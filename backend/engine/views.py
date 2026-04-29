import uuid
from rest_framework import viewsets, status, response
from rest_framework.decorators import action
from django.db import transaction, IntegrityError
from django.db.models import Sum, Case, When, F, Value, IntegerField
from django.utils import timezone
from .models import Merchant, BankAccount, Payout, LedgerEntry, IdempotencyKey
from .serializers import MerchantSerializer, BankAccountSerializer, PayoutSerializer, LedgerEntrySerializer
from .tasks import process_payout

class MerchantViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Merchant.objects.all()
    serializer_class = MerchantSerializer

    @action(detail=True, methods=['get'])
    def balance(self, request, pk=None):
        merchant = self.get_object()
        
        # Balance Formula:
        # cleared_paise = SUM(credits) - SUM(debits in ledger)
        # held_paise = SUM(pending/processing payout amounts)
        # available_paise = cleared_paise - held_paise
        
        ledger_stats = LedgerEntry.objects.filter(merchant=merchant).aggregate(
            total_credits=Sum(Case(When(entry_type=LedgerEntry.TYPE_CREDIT, then=F('amount_paise')), default=Value(0), output_field=IntegerField())),
            total_debits=Sum(Case(When(entry_type=LedgerEntry.TYPE_DEBIT, then=F('amount_paise')), default=Value(0), output_field=IntegerField()))
        )
        
        cleared_paise = (ledger_stats['total_credits'] or 0) - (ledger_stats['total_debits'] or 0)
        
        held_paise = Payout.objects.filter(
            merchant=merchant, 
            status__in=[Payout.STATUS_PENDING, Payout.STATUS_PROCESSING]
        ).aggregate(total_held=Sum('amount_paise'))['total_held'] or 0
        
        available_paise = cleared_paise - held_paise
        
        data = {
            "merchant_id": merchant.id,
            "merchant_name": merchant.name,
            "total_balance_paise": cleared_paise,
            "held_paise": held_paise,
            "available_paise": available_paise,
            "total_balance_rupees": cleared_paise / 100.0,
            "held_rupees": held_paise / 100.0,
            "available_rupees": available_paise / 100.0
        }
        return response.Response(data)

    @action(detail=True, methods=['get'])
    def ledger(self, request, pk=None):
        merchant = self.get_object()
        ledger = LedgerEntry.objects.filter(merchant=merchant).order_by('-created_at')[:20]
        serializer = LedgerEntrySerializer(ledger, many=True)
        return response.Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='bank-accounts')
    def bank_accounts(self, request, pk=None):
        merchant = self.get_object()
        if request.method == 'POST':
            serializer = BankAccountSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(merchant=merchant)
                return response.Response(serializer.data, status=status.HTTP_201_CREATED)
            return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        accounts = BankAccount.objects.filter(merchant=merchant)
        serializer = BankAccountSerializer(accounts, many=True)
        return response.Response(serializer.data)

    @action(detail=True, methods=['get'])
    def payouts(self, request, pk=None):
        merchant = self.get_object()
        payouts = Payout.objects.filter(merchant=merchant).order_by('-created_at')
        serializer = PayoutSerializer(payouts, many=True)
        return response.Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='payouts/create')
    def create_payout(self, request, pk=None):
        merchant = self.get_object()
        key_val = request.headers.get('Idempotency-Key')
        
        if not key_val:
            return response.Response({"error": "Idempotency-Key header missing"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. Check IdempotencyKey
        try:
            idem_key = IdempotencyKey.objects.get(merchant=merchant, key=key_val)
            if idem_key.is_expired():
                idem_key.delete()
                # proceed as new
            elif idem_key.response_body is not None:
                return response.Response(idem_key.response_body, status=idem_key.response_status or 200)
            else:
                return response.Response({"error": "Request in-flight"}, status=status.HTTP_409_CONFLICT)
        except IdempotencyKey.DoesNotExist:
            pass
            
        # 3. Create in-flight marker
        try:
            idem_key = IdempotencyKey.objects.create(merchant=merchant, key=key_val, response_body=None)
        except IntegrityError:
            return response.Response({"error": "Request in-flight"}, status=status.HTTP_409_CONFLICT)

        # 4. Atomic transaction with row-level lock
        try:
            with transaction.atomic():
                # Lock the merchant row to serialize payouts
                locked_merchant = Merchant.objects.select_for_update().get(id=merchant.id)
                
                # 5. Calculate available balance using DB aggregation
                ledger_stats = LedgerEntry.objects.filter(merchant=locked_merchant).aggregate(
                    total_credits=Sum(Case(When(entry_type=LedgerEntry.TYPE_CREDIT, then=F('amount_paise')), default=Value(0), output_field=IntegerField())),
                    total_debits=Sum(Case(When(entry_type=LedgerEntry.TYPE_DEBIT, then=F('amount_paise')), default=Value(0), output_field=IntegerField()))
                )
                cleared_paise = (ledger_stats['total_credits'] or 0) - (ledger_stats['total_debits'] or 0)
                
                held_paise = Payout.objects.filter(
                    merchant=locked_merchant, 
                    status__in=[Payout.STATUS_PENDING, Payout.STATUS_PROCESSING]
                ).aggregate(total_held=Sum('amount_paise'))['total_held'] or 0
                
                available_paise = cleared_paise - held_paise
                
                amount_paise = request.data.get('amount_paise')
                bank_account_id = request.data.get('bank_account_id')
                
                if not amount_paise or not bank_account_id:
                    idem_key.delete()
                    return response.Response({"error": "Missing amount_paise or bank_account_id"}, status=status.HTTP_400_BAD_REQUEST)
                
                # 6. Check sufficiency
                if available_paise < int(amount_paise):
                    idem_key.delete()
                    return response.Response({"error": "Insufficient funds", "available_paise": available_paise}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
                
                # 7. Create Payout
                bank_account = BankAccount.objects.get(id=bank_account_id, merchant=locked_merchant)
                payout = Payout.objects.create(
                    merchant=locked_merchant,
                    bank_account=bank_account,
                    amount_paise=amount_paise,
                    status=Payout.STATUS_PENDING
                )
                
                # 8. Save response to IdempotencyKey
                serializer = PayoutSerializer(payout)
                resp_data = serializer.data
                idem_key.payout = payout
                idem_key.response_body = resp_data
                idem_key.response_status = 201
                idem_key.save()
                
                # 9. Dispatch Task
                process_payout.apply_async(args=[payout.id], countdown=1)
                
                return response.Response(resp_data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            idem_key.delete()
            return response.Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PayoutViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payout.objects.all()
    serializer_class = PayoutSerializer

    def create(self, request, *args, **kwargs):
        # Allow passing merchant_id in body if not part of URL
        merchant_id = request.data.get('merchant_id') or request.query_params.get('merchant_id')
        if not merchant_id:
             return response.Response({"error": "merchant_id required"}, status=status.HTTP_400_BAD_REQUEST)
             
        merchant = Merchant.objects.get(id=merchant_id)
        key_val = request.headers.get('Idempotency-Key')
        
        if not key_val:
            return response.Response({"error": "Idempotency-Key header missing"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. Check IdempotencyKey
        try:
            idem_key = IdempotencyKey.objects.get(merchant=merchant, key=key_val)
            if idem_key.is_expired():
                idem_key.delete()
            elif idem_key.response_body is not None:
                return response.Response(idem_key.response_body, status=idem_key.response_status or 200)
            else:
                return response.Response({"error": "Request in-flight"}, status=status.HTTP_409_CONFLICT)
        except IdempotencyKey.DoesNotExist:
            pass
            
        # 3. Create in-flight marker
        try:
            idem_key = IdempotencyKey.objects.create(merchant=merchant, key=key_val, response_body=None)
        except IntegrityError:
            return response.Response({"error": "Request in-flight"}, status=status.HTTP_409_CONFLICT)

        # 4. Atomic transaction with row-level lock
        try:
            with transaction.atomic():
                locked_merchant = Merchant.objects.select_for_update().get(id=merchant.id)
                
                # Aggregation logic
                ledger_stats = LedgerEntry.objects.filter(merchant=locked_merchant).aggregate(
                    total_credits=Sum(Case(When(entry_type=LedgerEntry.TYPE_CREDIT, then=F('amount_paise')), default=Value(0), output_field=IntegerField())),
                    total_debits=Sum(Case(When(entry_type=LedgerEntry.TYPE_DEBIT, then=F('amount_paise')), default=Value(0), output_field=IntegerField()))
                )
                cleared_paise = (ledger_stats['total_credits'] or 0) - (ledger_stats['total_debits'] or 0)
                
                held_paise = Payout.objects.filter(
                    merchant=locked_merchant, 
                    status__in=[Payout.STATUS_PENDING, Payout.STATUS_PROCESSING]
                ).aggregate(total_held=Sum('amount_paise'))['total_held'] or 0
                
                available_paise = cleared_paise - held_paise
                
                amount_paise = request.data.get('amount_paise')
                bank_account_id = request.data.get('bank_account_id')
                
                if not amount_paise or not bank_account_id:
                    idem_key.delete()
                    return response.Response({"error": "Missing amount_paise or bank_account_id"}, status=status.HTTP_400_BAD_REQUEST)
                
                if available_paise < int(amount_paise):
                    idem_key.delete()
                    return response.Response({"error": "Insufficient funds"}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
                
                bank_account = BankAccount.objects.get(id=bank_account_id, merchant=locked_merchant)
                payout = Payout.objects.create(
                    merchant=locked_merchant,
                    bank_account=bank_account,
                    amount_paise=amount_paise,
                    status=Payout.STATUS_PENDING
                )
                
                serializer = PayoutSerializer(payout)
                resp_data = serializer.data
                idem_key.payout = payout
                idem_key.response_body = resp_data
                idem_key.response_status = 201
                idem_key.save()
                
                process_payout.apply_async(args=[payout.id], countdown=1)
                return response.Response(resp_data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            idem_key.delete()
            return response.Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        # Add extra details for the receipt view if needed
        data = serializer.data
        data['bank_name'] = instance.bank_account.account_holder_name # Placeholder for bank logo/name
        return response.Response(data)
