# QR Dine OS - Database Architecture & Schema (DATABASE.md)

## 1. Relational Entity Relationship Model

```
+--------------------+       1:N       +---------------------+
|    restaurants     | <-------------- |       tables        |
+--------------------+                 +---------------------+
| id (PK)            |                 | id (PK)             |
| name               |                 | restaurant_id (FK)  |
| currency           |                 | table_number        |
| tax_rate_percent   |                 | qr_token (UNIQUE)   |
| service_fee_percent|                 | qr_token_created_at |
| is_active          |                 | status              |
+--------------------+                 +---------------------+
          | 1:N                                   | 1:N
          v                                       v
+--------------------+                 +---------------------+
|  menu_categories   |                 |       orders        |
+--------------------+                 +---------------------+
| id (PK)            |                 | id (PK)             |
| restaurant_id (FK) |                 | order_number        |
| name               |                 | restaurant_id (FK)  |
| sort_order         |                 | table_id (FK)       |
+--------------------+                 | idempotency_key     |
          | 1:N                        | status              |
          v                            | payment_status      |
+--------------------+                 | payment_method      |
|     menu_items     |                 | subtotal_cents      |
+--------------------+                 | tax_cents           |
| id (PK)            |                 | service_fee_cents   |
| category_id (FK)   |                 | total_cents         |
| name, description  |                 | notes               |
| base_price_cents   |                 | created_at          |
| is_available       |                 +---------------------+
| dietary_flags      |                            | 1:N
+--------------------+                            v
          | 1:N                        +---------------------+
+--------------------+                 |     order_items     |
|   item_variants    |                 +---------------------+
|   & item_addons    |                 | id (PK)             |
+--------------------+                 | order_id (FK)       |
                                       | menu_item_id        |
                                       | snapshot_item_name  |
                                       | snapshot_price_cents|
                                       | quantity            |
                                       | selected_addons_json|
                                       | prep_status         |
                                       +---------------------+
```

## 2. Production MySQL 8.4 DDL Baseline

```sql
-- Flyway Migration: V1__Initial_Schema.sql
CREATE TABLE IF NOT EXISTS restaurants (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(64) NOT NULL UNIQUE,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    currency_symbol VARCHAR(4) NOT NULL DEFAULT '$',
    tax_rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 8.25,
    service_fee_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tables (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    table_number VARCHAR(16) NOT NULL,
    capacity INT NOT NULL DEFAULT 4,
    qr_token VARCHAR(64) NOT NULL UNIQUE,
    qr_token_created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status ENUM('AVAILABLE', 'OCCUPIED', 'BILLING', 'RESERVED') NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tables_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    UNIQUE KEY uq_restaurant_table_number (restaurant_id, table_number),
    INDEX idx_tables_qr_token (qr_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_categories (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    name VARCHAR(80) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_categories_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    INDEX idx_categories_order (restaurant_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    base_price_cents INT NOT NULL,
    image_url VARCHAR(512),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    dietary_flags JSON,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_items_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
    INDEX idx_items_lookup (restaurant_id, category_id, is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number INT NOT NULL,
    restaurant_id VARCHAR(36) NOT NULL,
    table_id VARCHAR(36) NOT NULL,
    idempotency_key VARCHAR(64) NOT NULL UNIQUE,
    status ENUM('RECEIVED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'RECEIVED',
    payment_status ENUM('UNPAID', 'PENDING_CASH', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    payment_method ENUM('ONLINE_GATEWAY', 'CASH') NOT NULL,
    subtotal_cents INT NOT NULL,
    tax_cents INT NOT NULL,
    service_fee_cents INT NOT NULL,
    tip_cents INT NOT NULL DEFAULT 0,
    total_cents INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_table FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE RESTRICT,
    INDEX idx_orders_tenant_status (restaurant_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    menu_item_id VARCHAR(36) NOT NULL,
    snapshot_item_name VARCHAR(120) NOT NULL,
    snapshot_price_cents INT NOT NULL,
    quantity INT NOT NULL,
    selected_variant_name VARCHAR(80),
    selected_variant_delta_cents INT NOT NULL DEFAULT 0,
    selected_addons JSON,
    special_instructions VARCHAR(256),
    prep_status ENUM('PENDING', 'PREPARING', 'DONE') NOT NULL DEFAULT 'PENDING',
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    restaurant_id VARCHAR(36) NOT NULL,
    amount_cents INT NOT NULL,
    method ENUM('ONLINE_GATEWAY', 'CASH') NOT NULL,
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    status ENUM('CREATED', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL,
    verified_by_user_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
