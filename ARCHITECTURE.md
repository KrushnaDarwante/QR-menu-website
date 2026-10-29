# QR Dine OS - System Architecture (ARCHITECTURE.md)

## 1. High-Level Architecture Diagram

```
       +-------------------------------------------------------------+
       |                       Client Tier                           |
       |  +--------------------+  +-------------------------------+  |
       |  | Mobile Diner PWA   |  | Ops Console (Owner / Cashier) |  |
       |  +--------------------+  +-------------------------------+  |
       |  +--------------------+  +-------------------------------+  |
       |  | Kitchen Display    |  | QR Code Generator & Print KOT |  |
       |  +--------------------+  +-------------------------------+  |
       +-------------------------------------------------------------+
                                     |
                        HTTPS REST / SSE Stream
                                     v
       +-------------------------------------------------------------+
       |                      Application Tier                       |
       |  [API Gateway & Rate Limiter]                               |
       |  [Tenant Isolation Filter & RBAC Security Layer]            |
       |                                                             |
       |  +----------------------+    +---------------------------+  |
       |  | QR Token Resolver    |    | Pricing Engine (Server)   |  |
       |  +----------------------+    +---------------------------+  |
       |  | Order State Machine  |    | Payment Gateway Adapter   |  |
       |  +----------------------+    +---------------------------+  |
       |  | KDS Ticket Dispatch  |    | SSE Event Stream Bus      |  |
       |  +----------------------+    +---------------------------+  |
       +-------------------------------------------------------------+
                                     |
                                 SQL / ACID
                                     v
       +-------------------------------------------------------------+
       |                       Persistence Tier                      |
       |  - Multi-Tenant Schema / Restaurant Isolation               |
       |  - Tables & Cryptographic QR Registry                       |
       |  - Immutable Order & Line Item Snapshots                    |
       |  - Payment Transactions & Staff Audit Log                   |
       +-------------------------------------------------------------+
```

## 2. Architectural Principles

### 2.1 Zero-Trust Client Pricing
The frontend client never dictates prices, sub-totals, discounts, or tax sums. The client sends only:
```json
{
  "qrToken": "qrd_tbl_78a1c9e4b...",
  "items": [
    {
      "menuItemId": "item_truffle_burger",
      "variantId": "var_double_patty",
      "addonIds": ["addon_aged_cheddar", "addon_truffle_mayo"],
      "quantity": 2,
      "specialInstructions": "No raw onions"
    }
  ],
  "idempotencyKey": "idem_8f7b3e10-..."
}
```
The server resolves the active restaurant, checks whether the table is active and not disabled, checks whether each item is available (not 86'd), calculates item prices, variant deltas, add-on costs, taxes, and service fees, and stores an immutable snapshot in the database.

### 2.2 Cryptographic QR Tokens vs Predictable IDs
Standard table URLs like `/restaurant/12/table/5` are vulnerable to tampering and table-spoofing attacks (a diner can place an order for another table).
QR Dine OS utilizes cryptographically generated tokens (`qrd_tbl_<32 hex chars>`) stored in the table record:
- **Unguessable:** Generated with high-entropy cryptographic RNG.
- **Revocable / Rotatable:** If a table sticker is compromised or a table is rearranged, staff can regenerate the QR token instantly, invalidating old bookmarks or photos.
- **Public Safe:** Resolving a token yields only public customer menu data and table label, never exposing internal restaurant administrative secrets or credentials.

### 2.3 Order State Machine & Event Sinks
All transitions in an order's lifecycle (`PLACED` -> `ACCEPTED` -> `PREPARING` -> `READY` -> `SERVED` -> `COMPLETED`) are strictly enforced by the `OrderStateMachine` engine. Transitions emit real-time server-sent events (`ORDER_CREATED`, `ORDER_STATUS_CHANGED`, `PAYMENT_CONFIRMED`) to subscribed KDS screens and manager consoles.

### 2.4 Dual Stack Specification
1. **Interactive Production Node.js/TypeScript Engine (Running Dev Server & API):**
   - High performance Express + TypeScript backend running within the Vite application.
   - Implements full REST API, Pricing Engine, State Machine, HMAC signature verifications, and Server-Sent Events.
   - Comprehensive unit test suite using Node.js test runner (`node:test`).
2. **Enterprise Reference Architecture (Spring Boot 3.x / MySQL 8.4):**
   - Fully documented in `DATABASE.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`, and `API_SPEC.md` for zero-friction migration to enterprise Spring Data JPA + MySQL clusters.
