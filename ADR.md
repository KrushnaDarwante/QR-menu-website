# QR Dine OS - Architectural Decision Records (ADR.md)

## ADR-001: Server-Sent Events (SSE) over Raw WebSockets for Real-Time Kitchen & Status Updates
- **Status:** Accepted
- **Context:** In restaurant dining scenarios, 95% of real-time communication is server-to-client push (e.g. "Order #104 status is now PREPARING", "New ticket for Table 2"). WebSocket handshakes often encounter proxy/firewall friction in guest cellular networks and iframe sandboxes.
- **Decision:** Use Server-Sent Events (SSE) via `/api/v1/events` with lightweight HTTP POST for client mutations. Provide automatic reconnection and heartbeat keep-alives.
- **Consequences:** Simpler state management, native browser `EventSource` resilience, zero protocol upgrade complexity, lower overhead.

## ADR-002: Cryptographic QR Tokens instead of Sequential IDs
- **Status:** Accepted
- **Context:** Using table IDs like `?table=1` allows diners to tamper with URLs and place orders on behalf of other tables.
- **Decision:** Generate 128-bit cryptographic tokens prefixed with `qrd_tbl_` using Node's `crypto.randomBytes(16).toString('hex')`. Store in table registry and permit instant rotation.
- **Consequences:** Eliminates table enumeration attacks; table stands can be printed with permanent or temporary QR codes that can be rotated if necessary.

## ADR-003: Two-Phase Cash Payment Verification
- **Status:** Accepted
- **Context:** If a customer selects "Pay with Cash", marking the order `PAID` immediately would allow diners to eat and leave without settling the bill.
- **Decision:** Cash orders are designated `PENDING_CASH`. The order is only flagged `PAID` when an authorized cashier or floor manager confirms physical cash collection in the operations console.
- **Consequences:** Protects restaurant revenue, maintains cash audit trail, and prevents fraud.
