# QR Dine OS - Order State Machine (ORDER_STATE_MACHINE.md)

## 1. Order Status Lifecycle

```
    [ Customer Submits Cart ]
                |
                v
          +------------+
          |  RECEIVED  |  (New incoming order, visible on Owner Bar & KDS)
          +------------+
           /          \
  (Staff Rejects)     (Staff / Kitchen Accepts)
         /              \
        v                v
  +-----------+    +------------+
  | CANCELLED |    |  ACCEPTED  |
  +-----------+    +------------+
                         |
                         v
                   +------------+
                   | PREPARING  |  (Kitchen active cook time)
                   +------------+
                         |
                         v
                   +------------+
                   |   READY    |  (Food plated at the pass, bell rung)
                   +------------+
                         |
                         v
                   +------------+
                   |   SERVED   |  (Delivered to table)
                   +------------+
                         |
            (Payment settled + diner leaves)
                         |
                         v
                   +------------+
                   | COMPLETED  |  (Archived in daily reports)
                   +------------+
```

## 2. Allowed Transition Matrix

| From State | Allowed Target States | Permitted Roles | Side Effects |
|---|---|---|---|
| `RECEIVED` | `ACCEPTED`, `CANCELLED` | `OWNER`, `MANAGER`, `KITCHEN` | Emits `ORDER_ACCEPTED` or `ORDER_CANCELLED`. Table marked `OCCUPIED`. |
| `ACCEPTED` | `PREPARING`, `CANCELLED` | `OWNER`, `MANAGER`, `KITCHEN` | Starts prep timer on KDS. |
| `PREPARING` | `READY`, `CANCELLED` | `KITCHEN`, `MANAGER` | Marks all line items as ready; notifies floor staff. |
| `READY` | `SERVED` | `WAITER`, `MANAGER`, `OWNER` | Waiter delivers order to table. |
| `SERVED` | `COMPLETED` | `CASHIER`, `MANAGER`, `OWNER` | Only allowed if `payment_status == PAID`. Clears table to `AVAILABLE`. |
| `CANCELLED`| None (Terminal) | - | Records cancellation reason. Restores any locked inventory. |
| `COMPLETED`| None (Terminal) | - | Archived for reporting. |

## 3. Invariant Rules
1. **No Skip Transitions:** An order cannot transition directly from `RECEIVED` to `SERVED` or `COMPLETED`.
2. **Cancellation Restriction:** Once an order reaches `READY` or `SERVED`, it cannot be cancelled without manager-level authorization override and mandatory waste audit logging.
3. **Completion Payment Gate:** An order CANNOT transition to `COMPLETED` unless its payment status is `PAID`.
