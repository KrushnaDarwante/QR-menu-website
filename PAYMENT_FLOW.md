# QR Dine OS - Payment Flow & Cash Collection (PAYMENT_FLOW.md)

## 1. Payment Methods Overview
QR Dine OS supports two primary payment workflows:
1. **Online Digital Gateway (Cards, UPI, Apple Pay / Google Pay):**
   - Implemented via a provider abstraction (supporting Razorpay, Stripe, or Sandbox Simulator).
   - Server creates gateway order; client completes payment; webhook or client signature callback verifies HMAC SHA256 signature server-side before updating payment status to `PAID`.
2. **Cash at Table (Staff-Verified Collection):**
   - Diner requests cash payment at the end of the meal or during order submission.
   - **CRITICAL SECURITY RULE:** The system sets payment status to `PENDING_CASH`. The order is NEVER automatically marked as `PAID` merely because cash was selected.
   - Only authorized staff (`CASHIER`, `MANAGER`, `OWNER`) can mark the cash payment as `PAID` after physically receiving the cash.

---

## 2. Sequence Diagrams

### 2.1 Online Payment Flow
```
Diner Browser               Server (/api/v1/payments)            Gateway (Razorpay/Stripe)
      |                                  |                                   |
      | 1. Submit Order (Pay Online)     |                                   |
      |--------------------------------->|                                   |
      |                                  | 2. Calculate Server Total         |
      |                                  | 3. Create Gateway Order           |
      |                                  |---------------------------------->|
      |                                  |                                   |
      |                                  | 4. Return gateway_order_id        |
      |                                  |<----------------------------------|
      | 5. Return orderId & gatewayKey   |                                   |
      |<---------------------------------|                                   |
      |                                                                      |
      | 6. Open Payment Gateway Modal                                        |
      |--------------------------------------------------------------------->|
      | 7. User Authorizes & Completes Payment                               |
      |<---------------------------------------------------------------------|
      |                                                                      |
      | 8. Verify Payment (signature, paymentId)                             |
      |--------------------------------->|                                   |
      |                                  | 9. Validate HMAC-SHA256 signature |
      |                                  | 10. Check Idempotency             |
      |                                  | 11. Mark payment_status = PAID    |
      |                                  | 12. Emit PAYMENT_CONFIRMED event  |
      | 13. Render Confirmed Receipt     |                                   |
      |<---------------------------------|                                   |
```

### 2.2 Cash Collection Flow
```
Diner Browser            Staff Floor / Cashier Console          Server (/api/v1/payments)
      |                               |                                      |
      | 1. Select "Pay with Cash"     |                                      |
      |--------------------------------------------------------------------->|
      |                               |                                      |
      |                               |                               | 2. Set status = PENDING_CASH
      |                               |                               | 3. Emit CASH_COLLECTION_NEEDED
      |                               | 4. Table 4 Badge: Cash Due           |
      |                               |<-------------------------------------|
      |                               |                                      |
      | 5. Diner hands cash to Waiter |                                      |
      |==============================>|                                      |
      |                               | 6. Cashier reviews Bill ($48.50)     |
      |                               | 7. Click "Confirm Cash Received"     |
      |                               |------------------------------------->|
      |                               |                               | 8. Verify Staff Role
      |                               |                               | 9. Record Cash Audit Record
      |                               |                               | 10. Set status = PAID
      |                               |                               | 11. Emit PAYMENT_CONFIRMED
      | 12. Screen updates to PAID    | 13. Table cleared                    |
      |<---------------------------------------------------------------------|
```

---

## 3. Webhook Idempotency & Signature Verification

### 3.1 Signature Algorithm
```typescript
const expectedSignature = crypto
  .createHmac('sha256', process.env.GATEWAY_WEBHOOK_SECRET || 'test_secret')
  .update(`${orderId}|${paymentId}`)
  .digest('hex');

if (expectedSignature !== receivedSignature) {
  throw new UnauthorizedException('Invalid payment signature');
}
```

### 3.2 Duplicate Event Protection
Webhooks are recorded in a deduplication log by `event_id`. If an event with the same ID arrives twice, the handler logs a warning and returns `HTTP 200 OK` without reprocessing state or re-firing events.
