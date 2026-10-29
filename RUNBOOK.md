# QR Dine OS - Operational Runbook (RUNBOOK.md)

## 1. Routine Operations

### Table QR Code Rotation
- **Scenario:** Acrylic stand on Table 4 is damaged or photographed by a previous customer trying to order remotely.
- **Action:**
  1. Open Operations Console -> `Floor & Tables`.
  2. Select Table 4.
  3. Click **"Rotate QR Token"**.
  4. The previous token is revoked immediately. Download the new high-resolution print card and place it on the table.

### 86-ing a Sold-Out Item
- **Scenario:** Kitchen runs out of Truffle Mushrooms at 8:15 PM.
- **Action:**
  1. Kitchen or Floor Staff opens `Menu & 86 Hub` (or toggles from KDS).
  2. Switch Truffle Burger toggle to **"Sold Out"**.
  3. System emits `ITEM_86_TOGGLED` across all active customer menus instantly.
  4. If a diner attempts to submit an in-flight cart containing the item, the server rejects it with a friendly notification.

### Confirming Cash Payments
- **Scenario:** Diner finishes meal and hands $50 cash to the server.
- **Action:**
  1. Cashier opens `Cashier Desk` in the Operations Console.
  2. Click on the pending bill for Table 4.
  3. Confirm the cash amount received.
  4. Click **"Confirm Cash Received"**.
  5. The order status updates to `PAID`, table status updates to `AVAILABLE`, and receipt is logged.

## 2. Incident Response

### High Uncollected Cash Alert
- Check if staff forgot to mark cash as collected in the console or if diner left without paying. Audit logs show the staff member assigned to the table.

### Payment Gateway Webhook Failures
- The server responds `200 OK` only after cryptographic HMAC validation. Check gateway dashboard to verify endpoint URL matches `https://<domain>/api/v1/payments/webhook`.
