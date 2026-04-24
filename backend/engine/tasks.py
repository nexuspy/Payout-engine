import random
from celery import shared_task
from django.db import transaction
from django.utils import timezone
from .models import Payout, LedgerEntry

@shared_task(bind=True, max_retries=3)
def process_payout(self, payout_id):
    try:
        with transaction.atomic():
            # SELECT FOR UPDATE NOWAIT on payout row
            try:
                payout = Payout.objects.select_for_update(nowait=True).get(id=payout_id)
            except Exception:
                # Could not get lock, skip for now
                return "Locked"

            if payout.status != Payout.STATUS_PENDING:
                return f"Already {payout.status}"

            payout.transition_to(Payout.STATUS_PROCESSING)
            payout.attempts += 1
            payout.last_attempted_at = timezone.now()
            payout.save()

            # Simulate bank settlement
            res = random.random()
            if res < 0.70:
                # Success
                payout.transition_to(Payout.STATUS_COMPLETED)
                # Write DEBIT LedgerEntry atomically
                LedgerEntry.objects.create(
                    merchant=payout.merchant,
                    amount_paise=payout.amount_paise,
                    entry_type=LedgerEntry.TYPE_DEBIT,
                    description=f"Payout completed to {payout.bank_account.account_number}",
                    payout=payout
                )
                return "Completed"
            elif res < 0.90:
                # Failure
                payout.transition_to(Payout.STATUS_FAILED)
                payout.failure_reason = "Bank rejected the transaction"
                payout.save()
                return "Failed"
            else:
                # Hang (do nothing)
                return "Hung"
                
    except Exception as e:
        # For terminal errors, we might want to log or fail it
        # But per specs, retry_stuck_payouts handles hangs/errors
        raise e

@shared_task
def retry_stuck_payouts():
    # Find payouts WHERE status='processing' AND last_attempted_at < now()-30s
    cutoff = timezone.now() - timezone.timedelta(seconds=30)
    stuck_payouts = Payout.objects.filter(
        status=Payout.STATUS_PROCESSING,
        last_attempted_at__lt=cutoff
    )

    for payout in stuck_payouts:
        if payout.attempts < 3:
            # Reset status to 'pending', requeue with exponential backoff
            payout.status = Payout.STATUS_PENDING
            payout.save()
            process_payout.apply_async(args=[payout.id], countdown=2**payout.attempts)
        else:
            # Transition to FAILED
            try:
                payout.transition_to(Payout.STATUS_FAILED)
                payout.failure_reason = "Exhausted 3 retry attempts"
                payout.save()
            except Exception:
                pass
