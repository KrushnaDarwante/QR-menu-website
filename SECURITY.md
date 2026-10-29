# QR Dine OS - Security Architecture & Threat Model (SECURITY.md)

## 1. Threat Model & Mitigations

| Threat | Attack Vector | QR Dine OS Mitigation |
|---|---|---|
| **Table Tampering / Impersonation** | Attacker iterates table numbers (`/table/1`, `/table/2`) to send fake orders. | High-entropy cryptographically secure random tokens (`qrd_tbl_<32 hex chars>`). Revocable and rotatable per table. |
| **Client-Side Price Manipulation** | Malicious client alters JSON body `total: 0.01` or intercepts HTTP request. | Server recalculates every subtotal, variant addition, and tax. Client values are strictly discarded. |
| **Sold-Out Race Condition (86'd items)** | User places order while kitchen runs out of ingredients. | Server executes atomic inventory availability check before order creation. Rejects with `ITEM_UNAVAILABLE_86`. |
| **Phantom Cash Collection** | Dishonest customer selects "Pay Cash" and leaves without paying. | Orders marked with cash payment remain in `PENDING_CASH`. Only authorized staff can transition to `PAID` with audit log. |
| **Tenant Cross-Contamination** | Attacker accesses another restaurant's menu or sales reports via forged IDs. | Tenant isolation middleware: every query filters by authenticated `restaurant_id`. |
| **Payment Webhook Replay** | Attacker replays captured gateway success payloads. | Webhook signature verification via HMAC-SHA256 and idempotency cache for duplicate event IDs. |
| **Brute-Force & Denial of Service** | Bot floods order or QR scan endpoints. | Rate limiting per IP and per table token. |

---

## 2. Role-Based Access Control (RBAC) Matrix

| Permission | Public Diner | Kitchen Staff | Cashier | Floor Manager | Restaurant Owner |
|---|:---:|:---:|:---:|:---:|:---:|
| Resolve Table QR | Yes | Yes | Yes | Yes | Yes |
| View Menu & Availability | Yes | Yes | Yes | Yes | Yes |
| Place Order for Table | Yes | No | Yes | Yes | Yes |
| View KDS Screen | No | Yes | Yes | Yes | Yes |
| Update Prep Status (Start/Bump) | No | Yes | No | Yes | Yes |
| Confirm Cash Payment | No | No | Yes | Yes | Yes |
| Toggle Item Availability (86) | No | Yes | Yes | Yes | Yes |
| Regenerate QR Tokens | No | No | No | Yes | Yes |
| Edit Prices & Menu | No | No | No | No | Yes |
| View Financial Reports | No | No | No | No | Yes |

---

## 3. Data Protection & Compliance
- **Zero Cardholder Data Storage:** Credit card details never touch QR Dine OS servers. Gateways render hosted SDK fields directly.
- **Audit Logging:** Every status change, cash confirmation, price modification, and cancellation logs `timestamp`, `user_id`, `role`, `ip_address`, and `previous_state`.
