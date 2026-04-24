import threading
import time
from django.test import TransactionTestCase, Client
from django.urls import reverse
from django.db import connection
from .models import Merchant, BankAccount, Payout, LedgerEntry, IdempotencyKey, InvalidStateTransition

class ConcurrencyTest(TransactionTestCase):
    def setUp(self):
        self.merchant = Merchant.objects.create(name="Test Merchant", email="test@test.com")
        self.bank_account = BankAccount.objects.create(
            merchant=self.merchant, account_number="123", ifsc_code="IFSC", 
            account_holder_name="Test Holder", is_primary=True
        )
        # ₹100 (10000 paise)
        LedgerEntry.objects.create(
            merchant=self.merchant, amount_paise=10000, 
            entry_type=LedgerEntry.TYPE_CREDIT, description="Seed"
        )
        self.client = Client()
        self.url = reverse('merchant-create-payout', kwargs={'pk': self.merchant.id})

    def test_simultaneous_payouts(self):
        # Fire two simultaneous threads, each requesting ₹60 (6000 paise)
        results = []

        def request_payout(key):
            # Using a fresh client/connection per thread is tricky in Django tests, 
            # but TransactionTestCase allows real DB actions.
            # We'll simulate via API calls.
            c = Client()
            resp = c.post(self.url, {'amount_paise': 6000, 'bank_account_id': self.bank_account.id}, 
                          HTTP_IDEMPOTENCY_KEY=key, content_type='application/json')
            results.append(resp)

        t1 = threading.Thread(target=request_payout, args=('key-1',))
        t2 = threading.Thread(target=request_payout, args=('key-2',))

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        statuses = [r.status_code for r in results]
        # Assert exactly one 201 and one 422
        self.assertIn(201, statuses)
        self.assertIn(422, statuses)
        
        # Assert exactly one Payout row in DB
        self.assertEqual(Payout.objects.filter(merchant=self.merchant).count(), 1)


class IdempotencyTest(TransactionTestCase):
    def setUp(self):
        self.merchant = Merchant.objects.create(name="Idem Merchant", email="idem@test.com")
        self.bank_account = BankAccount.objects.create(
            merchant=self.merchant, account_number="456", ifsc_code="IFSC", 
            account_holder_name="Idem", is_primary=True
        )
        LedgerEntry.objects.create(
            merchant=self.merchant, amount_paise=50000, 
            entry_type=LedgerEntry.TYPE_CREDIT, description="Seed"
        )
        self.client = Client()
        self.url = reverse('merchant-create-payout', kwargs={'pk': self.merchant.id})

    def test_same_key_twice(self):
        key = "same-key"
        r1 = self.client.post(self.url, {'amount_paise': 1000, 'bank_account_id': self.bank_account.id}, 
                              HTTP_IDEMPOTENCY_KEY=key, content_type='application/json')
        r2 = self.client.post(self.url, {'amount_paise': 1000, 'bank_account_id': self.bank_account.id}, 
                              HTTP_IDEMPOTENCY_KEY=key, content_type='application/json')
        
        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r2.status_code, 201)
        self.assertEqual(r1.json()['id'], r2.json()['id'])
        self.assertEqual(Payout.objects.filter(merchant=self.merchant).count(), 1)

    def test_missing_key(self):
        resp = self.client.post(self.url, {'amount_paise': 1000, 'bank_account_id': self.bank_account.id}, 
                                content_type='application/json')
        self.assertEqual(resp.status_code, 400)

    def test_different_merchants_same_key(self):
        m2 = Merchant.objects.create(name="M2", email="m2@test.com")
        BankAccount.objects.create(merchant=m2, account_number="999", ifsc_code="X", account_holder_name="X")
        LedgerEntry.objects.create(merchant=m2, amount_paise=10000, entry_type='credit', description='x')
        
        key = "shared-key"
        url1 = self.url
        url2 = reverse('merchant-create-payout', kwargs={'pk': m2.id})
        
        r1 = self.client.post(url1, {'amount_paise': 100, 'bank_account_id': self.bank_account.id}, 
                              HTTP_IDEMPOTENCY_KEY=key, content_type='application/json')
        r2 = self.client.post(url2, {'amount_paise': 100, 'bank_account_id': m2.bank_accounts.first().id}, 
                              HTTP_IDEMPOTENCY_KEY=key, content_type='application/json')
        
        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r2.status_code, 201)
        self.assertNotEqual(r1.json()['id'], r2.json()['id'])


class StateTransitionTest(TransactionTestCase):
    def setUp(self):
        self.merchant = Merchant.objects.create(name="State Merchant", email="state@test.com")
        self.bank_account = BankAccount.objects.create(merchant=self.merchant, account_number="789", ifsc_code="F", account_holder_name="H")
        self.payout = Payout.objects.create(
            merchant=self.merchant, bank_account=self.bank_account, amount_paise=1000, status=Payout.STATUS_PENDING
        )

    def test_legal_transitions(self):
        self.payout.transition_to(Payout.STATUS_PROCESSING)
        self.assertEqual(self.payout.status, Payout.STATUS_PROCESSING)
        self.payout.transition_to(Payout.STATUS_COMPLETED)
        self.assertEqual(self.payout.status, Payout.STATUS_COMPLETED)

    def test_illegal_transitions(self):
        # completed -> pending
        self.payout.status = Payout.STATUS_COMPLETED
        self.payout.save()
        with self.assertRaises(InvalidStateTransition):
            self.payout.transition_to(Payout.STATUS_PENDING)

        # failed -> completed
        self.payout.status = Payout.STATUS_FAILED
        self.payout.save()
        with self.assertRaises(InvalidStateTransition):
            self.payout.transition_to(Payout.STATUS_COMPLETED)

        # pending -> completed (skipping processing)
        p2 = Payout.objects.create(merchant=self.merchant, bank_account=self.bank_account, amount_paise=100, status=Payout.STATUS_PENDING)
        with self.assertRaises(InvalidStateTransition):
            p2.transition_to(Payout.STATUS_COMPLETED)
