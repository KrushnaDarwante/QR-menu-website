# QR Dine OS - Changelog (CHANGELOG.md)

All notable changes to QR Dine OS will be documented in this file.

## [1.0.0] - 2026-10-29
### Added
- **Core Architecture:** Dual-engine architecture documentation covering Spring Boot 3.x / MySQL 8.4 enterprise deployment and full-stack TypeScript runtime.
- **Table Operations:** Cryptographic QR token generation, rotation, and print-ready card rendering.
- **Server Pricing Engine:** Server-side calculation of subtotals, variant additions, add-ons, taxes, and service fees with snapshot storage.
- **Order State Machine:** Enforced state machine (`RECEIVED` -> `ACCEPTED` -> `PREPARING` -> `READY` -> `SERVED` -> `COMPLETED`).
- **Kitchen Display System (KDS):** High contrast touch interface with ticket timers, urgency color coding, and item-level checkoffs.
- **Operations Console:** Real-time metrics, live floor map, order acceptance, menu 86 hub, and cashier cash collection desk.
- **Payments:** Two-phase cash collection workflow and online gateway integration with HMAC-SHA256 signature verification.
- **Real-Time Updates:** Server-Sent Events (SSE) stream for live dining room synchronization.
- **Documentation:** Full suite of required documents (`PRD.md`, `SCOPE.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API_SPEC.md`, `UI_UX_SPEC.md`, `SECURITY.md`, `PAYMENT_FLOW.md`, `ORDER_STATE_MACHINE.md`, `TESTING.md`, `DEPLOYMENT.md`, `OBSERVABILITY.md`, `ADR.md`, `ROADMAP.md`, `CONTRIBUTING.md`, `ENVIRONMENT.md`, `RUNBOOK.md`).
