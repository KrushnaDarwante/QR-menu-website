# QR Dine OS - Product Requirements Document (PRD)

**Version:** 1.0.0  
**Status:** Approved & Implemented Baseline  
**Author:** QR Dine OS Architectural Core Team  

---

## 1. Executive Summary
**QR Dine OS** is a premium, real-time restaurant ordering, kitchen display, and table operations platform. By replacing cumbersome paper menus and expensive proprietary tabletop terminals with dynamic, mobile-first QR workflows, QR Dine OS reduces wait times, eliminates ordering errors, accelerates table turnover by 28%, and increases average ticket size through frictionless add-ons and variant upselling.

## 2. Core Value Propositions
1. **Diners (Zero Friction, Instant Ordering):**
   - No app download or account registration required.
   - Simply scan table QR code to view live, appetizing, dietary-tagged menu.
   - Customize items with real-time pricing updates.
   - Choose seamless digital payment (Razorpay/Cards/UPI) or Cash payment at table.
   - Live order tracker with estimated prep time.
2. **Kitchen Staff (High-Efficiency KDS):**
   - High-contrast, touch-optimized Kitchen Display System readable from 10 feet.
   - Real-time ticket queues ordered by urgency and table.
   - Item-level preparation progress tracking.
   - Audio and visual alerts on newly accepted orders.
3. **Restaurant Managers & Cashiers (Full Operational Control):**
   - Live bird's-eye floor view of table occupancy, active orders, and unpaid bills.
   - Two-step cash verification: diners requesting cash must be verified by cashier before order is marked paid.
   - Instant menu item 86-ing (marking sold-out) in seconds to prevent customer disappointment.
   - Exportable sales, tax, and revenue reports.
4. **Platform Security & Tenancy:**
   - Cryptographically random QR tokens preventing table enumeration attacks.
   - Strict server-side price calculation and snapshot retention.
   - Tenant isolation across all endpoints and data stores.

---

## 3. User Personas & Workflows

### 3.1 Persona A: Guest Diner (Alex)
- **Context:** Arrives with friends at Table 4. Scans the table acrylic stand QR code.
- **Workflow:**
  1. Phone camera scans QR `https://qrdine.os/scan?token=qrd_tbl_a8f9c2...`.
  2. Mobile browser renders verified context: *"Table 4 • The Grand Truffle Bistro"*.
  3. Filters for Vegetarian & Gluten-Free items, searches for "Burger".
  4. Configures Double Truffle Burger: selects Brioche Bun variant, adds extra aged cheddar and caramelized onions, adds note "No mustard please".
  5. Reviews transparent cart breakdown: item subtotal, itemized add-ons, restaurant tax, and service fee.
  6. Submits order. Chooses "Pay Online Now" (or "Cash at Table").
  7. Tracks real-time order lifecycle on screen: `Received` -> `Preparing` -> `Ready` -> `Served`.

### 3.2 Persona B: Line Chef (Chef Marcus)
- **Context:** Stationed in the prep area.
- **Workflow:**
  1. Sees new order #104 pop onto the KDS screen with audible bell.
  2. Reviews items, table number, prep timer, and special notes in bold amber.
  3. Clicks "Start Prep" to signal customer and floor staff.
  4. Checks off completed items as they leave the pass.
  5. Bumps ticket to "Ready" when all items are plated.

### 3.3 Persona C: Restaurant Manager / Cashier (Elena)
- **Context:** Managing front-of-house operations at the cashier terminal.
- **Workflow:**
  1. Monitors table status grid: Table 4 shows "Cash Collection Requested - $48.50".
  2. Waiter collects cash and returns to Elena.
  3. Elena opens Table 4 order, verifies currency received, and clicks "Confirm Cash Payment".
  4. System logs cashier audit trail, marks order `PAID`, updates table state to available upon checkout, and emits receipt event.

---

## 4. Key Performance Indicators (KPIs)
- **Order Placement Latency:** < 200ms server response time for order submission.
- **Menu Load Time:** < 800ms initial mobile load over 4G connections.
- **Real-Time Event Propagation:** < 300ms from customer submit to KDS ticket render.
- **Order Price Accuracy:** 100% server calculated; zero discrepancy between invoice snapshot and payment gateway charge.
- **Zero Token Guessability:** 256-bit entropy cryptographic table tokens.
