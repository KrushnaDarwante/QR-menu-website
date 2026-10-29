# QR Dine OS

> **Premium, Real-Time QR-Based Restaurant Ordering, Kitchen Display (KDS), and Dining Room Operations Platform.**

---

## 🍽️ Overview
**QR Dine OS** is an end-to-end hospitality operations suite engineered for contemporary dine-in restaurants. Each physical table has a unique, cryptographically random QR code token. When scanned, guests immediately experience a fast, responsive mobile digital menu without needing an app or registration. Guests configure items, select variants and add-ons, add custom cooking notes, submit orders with server-validated pricing, and track live order progress.

Back of house, **Kitchen Staff** work with a tactile, high-contrast Kitchen Display System (KDS), while **Managers & Cashiers** monitor dining room occupancy, accept incoming orders, 86 sold-out ingredients in real time, and verify cash payments through a secure two-phase workflow.

---

## 🚀 Key Modules
1. **Cryptographic QR Table Management:** Unguessable tokens (`qrd_tbl_<32 hex chars>`), instant rotation, table status (Available, Occupied, Billing, Reserved), and print-ready table cards.
2. **Server-Side Pricing Engine:** Complete protection against price tampering. Subtotals, variant deltas, add-ons, taxes, and service charges are calculated on the server and frozen into immutable order snapshots.
3. **Interactive Kitchen Display System (KDS):** Urgency coloring (Green < 10m, Amber 10-20m, Crimson > 20m), ticket elapsed timers, and individual line-item checkoffs.
4. **Operations & Floor Console:** Live revenue KPIs, floor occupancy grid, order acceptance/cancellation, and menu 86 hub.
5. **Two-Phase Cash & Online Payments:** Cash orders remain `PENDING_CASH` until authorized cashier staff physically confirms collection. Online payments verify HMAC-SHA256 signatures with duplicate-event protection.
6. **Real-Time Synchronization:** Server-Sent Events (SSE) stream ensuring instant updates across customer phones, KDS screens, and cashier desks.

---

## 🛠️ Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion.
- **Backend API:** Full-Stack Node.js/Express with TypeScript, Server-Sent Events, HMAC Cryptography, and Server Pricing Engine.
- **Enterprise Reference Architecture:** Spring Boot 3.4, Java 21, Spring Data JPA, Flyway Migrations, MySQL 8.4 (fully documented in `ARCHITECTURE.md` and `DATABASE.md`).
- **Testing:** Unit tests with `node:test`, Playwright E2E browser automation.

---

## 📖 Complete Documentation Index
- [Product Requirements Document (PRD)](./PRD.md)
- [Scope Specification](./SCOPE.md)
- [System Architecture](./ARCHITECTURE.md)
- [Database & Flyway Schema](./DATABASE.md)
- [REST API Specification](./API_SPEC.md)
- [UI/UX Design Specification](./UI_UX_SPEC.md)
- [Security & Threat Model](./SECURITY.md)
- [Payment Flow & Cash Verification](./PAYMENT_FLOW.md)
- [Order State Machine](./ORDER_STATE_MACHINE.md)
- [Testing Strategy](./TESTING.md)
- [Deployment & Infrastructure](./DEPLOYMENT.md)
- [Observability & Telemetry](./OBSERVABILITY.md)
- [Architectural Decision Records (ADR)](./ADR.md)
- [Product Roadmap](./ROADMAP.md)
- [Operational Runbook](./RUNBOOK.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Environment Variables](./ENVIRONMENT.md)
- [Changelog](./CHANGELOG.md)

---

## 🏃 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npx --yes tsx --test src/tests/pricing.test.ts src/tests/state-machine.test.ts src/tests/qr-crypto.test.ts

# 3. Start local development server
npm run dev
```

Visit `http://localhost:3000` to interact with QR Dine OS!
