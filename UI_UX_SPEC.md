# QR Dine OS - UI/UX Design Specification (UI_UX_SPEC.md)

## 1. Design Ethos & Visual Craft
QR Dine OS rejects generic dashboard templates, excessive neon glows, and AI slop. It adheres strictly to modern hospitality aesthetics:
- **Warm Culinary Dark/Light Modernity:** Deep graphite background (`#0a0a0c`, `#121216`), warm amber and saffron accents (`#f59e0b`, `#d97706`), crisp parchment text (`#f8fafc`), and subdued borders (`rgba(255, 255, 255, 0.08)`).
- **Zero-Pill Discipline:** Clean rectangular geometry with subtle 8px-12px radiuses. Meaningful badge indicators rather than decorative bubbles.
- **Typographic Scale:**
  - Display: `Plus Jakarta Sans`, 700/800 weight, tight tracking.
  - Body: `Plus Jakarta Sans`, 400/500 weight, relaxed line height.
  - Numbers/Pricing/Order IDs: `JetBrains Mono` or tabular numerals to prevent layout jitter.
- **Tactile Sound & Feedback:** Subtle visual pulse when an item is added to cart, clear status badges, and haptic-friendly buttons for mobile screens.

---

## 2. Customer Menu Screen (Mobile Viewport 390px - 430px)
1. **Header Context:**
   - Subtle restaurant branding badge + table badge (e.g. `[ Table 04 ]`).
   - Active bill status pill if existing order is running.
2. **Category Navigation:**
   - Sticky horizontal category scroll (`Chef's Specials`, `Artisan Burgers`, `Woodfired Pizzas`, `Appetizers`, `Desserts & Craft Beverages`).
   - Dietary quick filters (Veg, Vegan, Gluten-Free, Halal).
3. **Item Cards:**
   - 1:1 crisp food imagery with smooth zoom.
   - Dietary glyphs (green leaf for veg, amber wheat with slash for GF).
   - Prominent price and clear "+ Add" tactile action button.
   - Sold-out items show an elegant "Sold Out (86'd)" overlay and disable interaction.
4. **Item Customization Modal:**
   - Variant selector (Single vs Double Patty, Regular vs Truffle Mayo).
   - Add-on checkboxes with explicit price delta: `+ Extra Cheddar (+$1.50)`.
   - Special cooking instructions text area.
   - Live total button: `Add 1 to Cart — $16.50`.
5. **Floating Cart & Drawer:**
   - Persistent bottom bar showing item count and total.
   - Slide-over drawer with itemized line items, notes, subtotal, tax breakdown, tip selector (10%, 15%, 20%, Custom), and choice of "Pay with Card / UPI" or "Pay with Cash".

---

## 3. Kitchen Display System (KDS Screen)
- **High Contrast Grid:** Readable from 8-12 feet away under bright kitchen lights.
- **Ticket Cards:**
  - Order #, Table #, elapsed time since placement.
  - Color urgency: Green (< 10 mins), Amber (10-20 mins), Crimson (> 20 mins).
  - Item list with checkboxes for individual plating progress.
  - Special allergy warnings highlighted in high-visibility amber banner.
  - Quick action bump buttons: `Accept Order` -> `Start Cooking` -> `Ready for Pass`.

---

## 4. Restaurant Operations & Owner Console
- **Top Bar:** Quick stats: Total Sales ($), Active Tables, Orders in Queue, Avg Cook Time.
- **View Switcher:**
  - `Live Orders`: Interactive kanban & list view of all tickets.
  - `Floor & Tables`: Visual floor grid with table status (Available, Occupied, Billing, Reserved), and one-click QR code download/print stand generation.
  - `Menu & 86 Hub`: Rapid availability toggle and price adjustments.
  - `Cashier Desk`: Uncollected cash queue with 1-click verification.
  - `Analytics`: Sales breakdown, payment channels, top items.
