# QR Dine OS - Observability & Telemetry (OBSERVABILITY.md)

## 1. Metrics & Health Probing
The system exposes:
- `GET /api/health`: Provides structured JSON health probe indicating system uptime, memory RSS, event subscriber counts, database connectivity, and active version.

## 2. Structured JSON Logging
All application logs are formatted as single-line JSON with standard fields:
- `timestamp`: ISO-8601 UTC.
- `level`: `INFO`, `WARN`, `ERROR`, `SECURITY`.
- `correlationId`: Distributed trace request ID.
- `tenantId`: Restaurant identifier.
- `action`: Specific domain action (e.g., `ORDER_PLACED`, `CASH_CONFIRMED`).
- `durationMs`: Response execution time.
- **Data redaction:** Credit card information, customer PII, and raw secret keys are strictly redacted.
