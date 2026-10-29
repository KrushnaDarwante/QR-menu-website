/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'PUBLIC_DINER' | 'KITCHEN' | 'CASHIER' | 'MANAGER' | 'OWNER';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'BILLING' | 'RESERVED';

export type OrderStatus =
  | 'RECEIVED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PENDING_CASH' | 'PAID' | 'REFUNDED';

export type PaymentMethod = 'ONLINE_GATEWAY' | 'CASH';

export type DietaryFlag = 'VEGETARIAN' | 'VEGAN' | 'GLUTEN_FREE' | 'HALAL' | 'SPICY' | 'CHEF_SPECIAL';

export type ItemPrepStatus = 'PENDING' | 'PREPARING' | 'DONE';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  currency: string;
  currencySymbol: string;
  taxRatePercent: number; // e.g. 8.5%
  serviceFeePercent: number; // e.g. 3.0%
  isActive: boolean;
  address: string;
  phone: string;
}

export interface Table {
  id: string;
  restaurantId: string;
  tableNumber: string;
  capacity: number;
  qrToken: string; // 32 hex char cryptographic token
  qrTokenCreatedAt: string;
  isActive: boolean;
  status: TableStatus;
  currentOrderId?: string | null;
}

export interface ItemVariant {
  id: string;
  name: string; // e.g. "Double Patty" or "Gluten-Free Crust"
  priceDeltaCents: number; // e.g. +300 cents
}

export interface ItemAddon {
  id: string;
  name: string; // e.g. "Aged Truffle Cheddar"
  priceCents: number;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  basePriceCents: number;
  imageUrl: string;
  isAvailable: boolean; // false when 86'd (sold out)
  dietaryFlags: DietaryFlag[];
  variants?: ItemVariant[];
  addons?: ItemAddon[];
  calories?: number;
  prepTimeMinutes: number;
  sortOrder: number;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  iconName?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface OrderItemRequest {
  menuItemId: string;
  variantId?: string;
  addonIds?: string[];
  quantity: number;
  specialInstructions?: string;
}

export interface OrderItemSnapshot {
  id: string;
  orderId: string;
  menuItemId: string;
  snapshotItemName: string;
  snapshotBasePriceCents: number;
  quantity: number;
  selectedVariantName?: string;
  selectedVariantDeltaCents: number;
  selectedAddons: { id: string; name: string; priceCents: number }[];
  itemTotalCents: number;
  specialInstructions?: string;
  prepStatus: ItemPrepStatus;
}

export interface Order {
  id: string;
  orderNumber: number;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  idempotencyKey: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerName?: string;
  subtotalCents: number;
  taxCents: number;
  serviceFeeCents: number;
  tipCents: number;
  totalCents: number;
  notes?: string;
  items: OrderItemSnapshot[];
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  verifiedByStaffId?: string;
  cancellationReason?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  restaurantId: string;
  amountCents: number;
  method: PaymentMethod;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  verifiedByUserId?: string;
  verifiedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  restaurantId: string;
  orderId?: string;
  userId: string;
  userRole: UserRole;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface SystemHealth {
  status: 'UP' | 'DOWN';
  uptimeSeconds: number;
  version: string;
  environment: string;
  memoryRssMb: number;
  database: {
    status: 'CONNECTED';
    activeTables: number;
    activeOrders: number;
    totalMenuItems: number;
  };
  sseSubscribers: number;
  timestamp: string;
}
