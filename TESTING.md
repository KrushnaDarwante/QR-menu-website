# QR Dine OS - Testing Strategy & Quality Assurance (TESTING.md)

## 1. Testing Pyramid
QR Dine OS enforces automated verification across three tiers:
1. **Unit Tests (Pure Business Logic):**
   - Pricing engine arithmetic (variant add-ons, item quantity, taxes, rounding, tips).
   - Order State Machine transitions (allowed and forbidden status changes).
   - QR cryptographic token generation and verification.
   - Run via Node's native test runner (`node:test` via `npx --yes tsx --test`).
2. **Integration & API Tests:**
   - Server route endpoints (`/api/health`, `/api/v1/public/qr/:token`, `/api/v1/public/orders`, `/api/v1/payments/cash-collect`).
   - Webhook signature authentication.
   - Idempotency key duplicate rejection.
   - Tenant isolation verification.
3. **End-to-End Browser Tests (Playwright CLI):**
   - Full customer journey: scan QR -> add item with variants -> view cart -> select cash payment -> submit order -> track status.
   - Staff journey: view incoming order on KDS -> start prep -> bump to ready.
   - Cashier journey: collect cash -> confirm -> order marked paid.

---

## 2. Test Execution Commands

```bash
# Run unit tests
npx --yes tsx --test src/tests/*.test.ts

# Run TypeScript compilation check
npm run lint

# Build production bundle
npm run build
```
