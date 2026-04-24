from rest_framework import serializers
from .models import Merchant, BankAccount, Payout, LedgerEntry, IdempotencyKey

class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = ['id', 'account_number', 'ifsc_code', 'account_holder_name', 'is_primary', 'created_at']

class MerchantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = ['id', 'name', 'email', 'created_at']

class PayoutSerializer(serializers.ModelSerializer):
    bank_account_details = BankAccountSerializer(source='bank_account', read_only=True)
    
    class Meta:
        model = Payout
        fields = [
            'id', 'merchant', 'bank_account', 'bank_account_details', 
            'amount_paise', 'status', 'attempts', 'last_attempted_at', 
            'failure_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['status', 'attempts', 'last_attempted_at', 'failure_reason']

class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = ['id', 'merchant', 'amount_paise', 'entry_type', 'description', 'payout', 'created_at']
