# The "Playto" Payout Engine: Architecture of Truth

Building a payout engine is a high-stakes game of "Don't Double Spend." In most apps, if a database query fails, you show an error and the user refreshes. In fintech, if a database query fails halfway through, you might have sent money to a bank without recording it, or worse, recorded it twice.

This document explains the core logic of Playto and why I chose these specific patterns. It’s the difference between a "pasted" solution and an engineered one.

---

## 1. The Ground Truth: Append-Only Ledger
Most developers start by adding a `balance` column to the `Merchant` model. **I didn't.** A balance column is just a "cache" of history, and caches get out of sync.

Instead, I implemented a strict **Append-Only Ledger** (`LedgerEntry`). 
- **Code Enforcement:** In `models.py`, I overrode the `save()` and `delete()` methods of `LedgerEntry` to throw a `ValidationError` if anyone tries to update or delete an existing entry. 
- **The Math:** To find a merchant's balance, we run a real-time aggregation:
  ```python
  # available = (Sum of Credits - Sum of Ledger Debits) - Sum of "Held" Funds
  ```

**Why this matters:** If a server crashes while processing a payout, we don't have to "roll back" a balance. The ledger remains untouched. The math is always derived from immutable facts.

---

## 2. The "Held" Funds Pattern
If we only looked at the Ledger, a merchant could request five $100 payouts simultaneously if they had $100 in their account. The Ledger wouldn't see the debits yet because the bank hasn't finished.

I solved this by introducing the **"Held" state**. 
- Any Payout in `PENDING` or `PROCESSING` status is treated as "spent" by the balance calculator.
- Only when a payout is `COMPLETED` does it move from "Held" (the `Payout` table) to "Finalized" (the `LedgerEntry` table).

This ensures that the moment a user clicks "Withdraw," those funds are locked and cannot be touched by any other process.

---

## 3. Concurrency: DB-level vs. Python-level Locking
To prevent two servers from processing the same merchant's balance check at the exact same time, I used **PostgreSQL Row-Level Locking** via `select_for_update()`.

It’s crucial to understand that this is a **Database-level lock**, not a Python-level lock (like a Thread Lock). 
- **The Scope:** The lock is held for the entire duration of the `transaction.atomic()` block. 
- **The Protection:** If we had used a Python lock, it would only work on a single server. In a real-world production environment with multiple server instances, a Python lock is useless. By locking at the DB level, we ensure that even if 10 different servers try to process a payout for the same merchant, the database will force them to queue up.

In `views.py`, this is where the "check-then-deduct" race condition is killed:
```python
with transaction.atomic():
    # The database pauses any other transaction trying to touch this row
    locked_merchant = Merchant.objects.select_for_update().get(id=merchant.id)
    
    # ... Only now is it safe to calculate balance and create the payout ...
```

---

## 4. Idempotency: Shipping for Real Networks
Networks are flaky. A client might send a request, our server finishes it, but the client’s internet dies before they get the "201 Created" response. They *will* retry.

I implemented a robust `IdempotencyKey` system that handles three critical phases:
1. **The In-Flight Marker:** The moment a request starts, we create the key with `response_body=None`. If a second request arrives *while* the first is still inside the `transaction.atomic()` block, the DB unique constraint throws an `IntegrityError`, and we return a `409 Conflict`.
2. **The Atomic Link:** The `IdempotencyKey` is linked to the `Payout` via a `OneToOneField`. This means the receipt is permanently "locked" to that specific key.
3. **The Safety Net (Tasks):** In `tasks.py`, I implemented `retry_stuck_payouts`. If a payout gets stuck in `PROCESSING` (e.g., a worker dies), this task uses exponential backoff to either retry or eventually transition it to `FAILED`, which safely "releases" the held funds back to the ledger calculation.

---

## 5. The State Machine: Guardrails for Status
In `models.py`, I defined `VALID_TRANSITIONS`. A payout can't go from `FAILED` to `COMPLETED`. 

```python
VALID_TRANSITIONS = {
    STATUS_PROCESSING: [STATUS_COMPLETED, STATUS_FAILED],
    STATUS_COMPLETED: [], # The end of the road
}
```
This is a safety valve. If a background worker (Celery) gets confused and tries to re-process a failed payout, the model itself will throw an `InvalidStateTransition` error. It’s a second layer of defense behind the database logic.

---

## 6. The "AI Audit" Moment
During development, an AI suggested this for handling a failed payout:
`merchant.balance += payout.amount` (The "give them their money back" approach).

**I rejected this.** In a Ledger-based system, you never "give money back" by adding it. You simply *stop holding it*. By transitioning the payout to `FAILED`, it is automatically excluded from the `held_paise` sum in our next balance calculation. 

This is more robust because it avoids a second "write" operation that could also fail. It relies on the *absence* of a successful state rather than the *presence* of a recovery state.

---

### Summary
Playto is built on the principle that **code should be easy to reason about, but the database should be impossible to break.** By combining immutable ledger entries, row-level locking, and a strict state machine, we've built a payout engine that I can trust with real money.
