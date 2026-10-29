# QR Dine OS - REST API Specification (API_SPEC.md)

All responses follow the standardized envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-10-29T12:00:00.000Z"
}
```

---

## 1. Public Table & Customer Endpoints

### `GET /api/v1/public/qr/:token`
Resolves a cryptographic table token to restaurant context, table number, and active session.
- **Request:** `token` (path parameter, e.g. `qrd_tbl_7fa8e1b...`)
- **Response 200:**
  ```json
  {
    "success": true,
    "data": {
      "table": {
        "id": "tbl_01",
        "tableNumber": "4",
        "capacity": 4,
        "status": "AVAILABLE"
      },
      "restaurant": {
        "id": "rest_grand_truffle",
        "name": "The Grand Truffle Bistro",
        "currency": "USD",
        "currencySymbol": "$",
        "taxRatePercent": 8.5,
        "serviceFeePercent": 5.0
      },
      "activeOrderId": null
    }
  }
  ```
- **Error 404:** Token not found, expired, or table disabled.

### `GET /api/v1/public/menu/:restaurantId`
Fetches active menu categories, items, variants, and add-ons.

### `POST /api/v1/public/orders`
Submits an order from the customer phone.
- **Headers:** `Idempotency-Key: <UUID>`
- **Request Body:**
  ```json
  {
    "qrToken": "qrd_tbl_...",
    "customerName": "Alex",
    "paymentMethod": "ONLINE_GATEWAY" | "CASH",
    "tipCents": 300,
    "notes": "Table by window",
    "items": [
      {
        "menuItemId": "item_truffle_burger",
        "variantId": "var_double",
        "addonIds": ["addon_cheddar", "addon_onions"],
        "quantity": 1,
        "specialInstructions": "Extra crispy fries"
      }
    ]
  }
  ```
- **Response 201:** Order object with calculated `subtotalCents`, `taxCents`, `serviceFeeCents`, `totalCents`, and `orderNumber`.

### `GET /api/v1/public/orders/:orderId`
Polls live order status, line items, and payment status.

---

## 2. Staff Operations & Management Endpoints (Protected by Role)

### `GET /api/v1/kds/orders`
Fetches all active orders in `RECEIVED`, `ACCEPTED`, `PREPARING`, `READY` status.

### `PATCH /api/v1/kds/orders/:orderId/status`
Updates order preparation status (`ACCEPTED`, `PREPARING`, `READY`, `SERVED`).

### `PATCH /api/v1/kds/orders/:orderId/items/:itemId`
Checks off a single item prep status (`PENDING` -> `PREPARING` -> `DONE`).

### `POST /api/v1/payments/cash-collect`
Authorized cashier confirms cash collection.
- **Request Body:** `{ "orderId": "ord_...", "staffUserId": "user_...", "amountCollectedCents": 4850 }`
- **Response 200:** Updates order payment status to `PAID` and emits `PAYMENT_CONFIRMED`.

### `POST /api/v1/payments/online/verify`
Verifies signature from online payment gateway.

### `POST /api/v1/tables/:tableId/rotate-qr`
Regenerates the cryptographic token for a table.

### `PATCH /api/v1/menu/items/:itemId/toggle-availability`
Toggles item 86 / sold-out state.

---

## 3. Real-Time Server-Sent Events

### `GET /api/v1/events?restaurantId=:id`
Subscribes to live SSE channel. Emits:
- `ORDER_CREATED`: New order placed.
- `ORDER_STATUS_CHANGED`: Order advanced along state machine.
- `ITEM_PREP_CHANGED`: Line item bumped in kitchen.
- `PAYMENT_CONFIRMED`: Bill marked paid.
- `TABLE_STATUS_CHANGED`: Table occupancy altered.
- `ITEM_86_TOGGLED`: Menu item availability changed.
