# QR Dine OS - Scope Specification (SCOPE.md)

## 1. In-Scope Modules (Phase 0 through Phase 10)

| Module | Core Features | Security & Guarantees |
|---|---|---|
| **M1: Restaurant & Table Operations** | Table CRUD, capacity, active QR token lifecycle, token regeneration, printable QR cards with aesthetic styling | Non-sequential, unguessable tokens (`crypto.randomBytes(16)`); old tokens can be invalidated immediately. |
| **M2: Digital Menu Management** | Categories, item descriptions, high-res photos, base pricing, dietary badges (Veg, Vegan, Gluten-Free, Halal, Spicy), variant sets, add-on groups, live 86 / sold-out toggle | Server prevents ordering sold-out items; atomic availability check. |
| **M3: Customer Ordering & Cart** | Deep-link token resolution, instant category filtering, real-time search, item customization modal, special instructions, server-synchronized cart, sticky order bar | Client never dictates prices or taxes; server performs all arithmetic and validates variant integrity. |
| **M4: Server Pricing Engine** | Subtotal recalculation, variant delta calculation, add-on pricing, restaurant-configured tax calculation (e.g. GST/VAT), service charge, tips, currency formatting | Exact roundings, snapshot pricing frozen at order placement time. |
| **M5: Kitchen Display System (KDS)** | High-contrast touch grid, order elapsed timers, urgency coloring (Green < 10m, Amber 10-20m, Red > 20m), item-level prep checkoffs, bump actions | Idempotent status transitions; audit trail for prep times. |
| **M6: Owner / Manager Console** | Live revenue metrics, floor occupancy map, order review & acceptance, manual order cancellation with reason, menu management, cash collection console | Role-based authorization (`OWNER`, `MANAGER`, `CASHIER`, `KITCHEN`). |
| **M7: Payments & Cash Workflow** | Online gateway sandbox / Razorpay / Stripe adapter abstraction, signature verification, webhook processing with duplicate protection, explicit staff cash collection | Never auto-confirm cash orders; requires authorized user ID and audit record. |
| **M8: Real-Time Event Stream** | Server-Sent Events (SSE) with automatic reconnection, heartbeat pings, client dispatching | Secure channel scoped by restaurant tenant ID; no cross-tenant leakage. |
| **M9: Analytics & Reporting** | Daily gross sales, net sales, order volume, average ticket time, payment method breakdown (Cash vs Online), export to CSV/JSON | Parametric range queries isolated by tenant. |

## 2. Out-of-Scope (Deferred to Future Major Versions)
- Direct POS hardware integration for legacy serial thermal printers (standard browser print CSS provided).
- Native iOS/Android app store binaries (mobile web progressive app architecture replaces need).
- Third-party delivery driver dispatching (DoorDash/UberEats integration).
- Multi-currency currency conversion during a single dine-in session.
