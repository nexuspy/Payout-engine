import os
import django
import sys

# Setup django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from engine.models import Merchant, BankAccount, LedgerEntry, Payout

def seed():
    # Clear existing data
    Merchant.objects.all().delete()
    
    # 1. Pixel Studio
    m1 = Merchant.objects.create(name="Pixel Studio", email="hi@pixelstudio.com")
    BankAccount.objects.create(
        merchant=m1, 
        account_number="9988776655", 
        ifsc_code="PIXL0001234", 
        account_holder_name="Pixel Studio Ltd", 
        is_primary=True
    )
    # ₹5,95,000 in credits (595000 * 100 paise)
    LedgerEntry.objects.create(
        merchant=m1,
        amount_paise=59500000,
        entry_type=LedgerEntry.TYPE_CREDIT,
        description="Initial bulk credit"
    )
    # ₹2,00,000 completed debit
    p1 = Payout.objects.create(
        merchant=m1,
        bank_account=m1.bank_accounts.first(),
        amount_paise=20000000,
        status=Payout.STATUS_COMPLETED
    )
    LedgerEntry.objects.create(
        merchant=m1,
        amount_paise=20000000,
        entry_type=LedgerEntry.TYPE_DEBIT,
        description="Payout settlement",
        payout=p1
    )

    # 2. CodeForge
    m2 = Merchant.objects.create(name="CodeForge", email="legal@codeforge.io")
    BankAccount.objects.create(
        merchant=m2, 
        account_number="1122334455", 
        ifsc_code="CODE0005678", 
        account_holder_name="CodeForge Systems", 
        is_primary=True
    )
    # ₹1,85,000 in credits
    LedgerEntry.objects.create(
        merchant=m2,
        amount_paise=18500000,
        entry_type=LedgerEntry.TYPE_CREDIT,
        description="Receivables Q1"
    )
    # ₹50,000 completed debit
    p2 = Payout.objects.create(
        merchant=m2,
        bank_account=m2.bank_accounts.first(),
        amount_paise=5000000,
        status=Payout.STATUS_COMPLETED
    )
    LedgerEntry.objects.create(
        merchant=m2,
        amount_paise=5000000,
        entry_type=LedgerEntry.TYPE_DEBIT,
        description="System payout",
        payout=p2
    )

    # 3. CreatorHub
    m3 = Merchant.objects.create(name="CreatorHub", email="support@creatorhub.net")
    BankAccount.objects.create(
        merchant=m3, 
        account_number="5544332211", 
        ifsc_code="CREA0004321", 
        account_holder_name="CreatorHub Media", 
        is_primary=True
    )
    # ₹50,000 in credits
    LedgerEntry.objects.create(
        merchant=m3,
        amount_paise=5000000,
        entry_type=LedgerEntry.TYPE_CREDIT,
        description="Subscription revenue"
    )

    print("Seeding complete.")

if __name__ == "__main__":
    seed()
