/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuditLogEntry,
  MenuCategory,
  MenuItem,
  Order,
  OrderItemRequest,
  OrderStatus,
  PaymentRecord,
  Restaurant,
  Table,
  UserRole,
} from '../types/index.ts';
import { calculateOrderTotals, PricingError } from './pricing.ts';
import { generateTableQrToken } from './qr-crypto.ts';
import {
  INITIAL_CATEGORIES,
  INITIAL_ITEMS,
  INITIAL_ORDERS,
  INITIAL_RESTAURANT,
  INITIAL_TABLES,
} from './seed-data.ts';
import { canTransitionOrder } from './state-machine.ts';

export type StoreEvent =
  | { type: 'ORDER_CREATED'; order: Order }
  | { type: 'ORDER_STATUS_CHANGED'; orderId: string; status: OrderStatus; previousStatus: OrderStatus }
  | { type: 'ITEM_PREP_CHANGED'; orderId: string; itemId: string; prepStatus: string }
  | { type: 'PAYMENT_CONFIRMED'; orderId: string; method: string; amountCents: number }
  | { type: 'TABLE_STATUS_CHANGED'; tableId: string; status: string }
  | { type: 'ITEM_86_TOGGLED'; itemId: string; isAvailable: boolean }
  | { type: 'ITEM_ADDED'; item: MenuItem }
  | { type: 'ITEM_DELETED'; itemId: string }
  | { type: 'BULK_AVAILABILITY_CHANGED'; isAvailable: boolean }
  | { type: 'QR_ROTATED'; tableId: string; newToken: string };

type Listener = (event: StoreEvent) => void;

class RestaurantStore {
  private restaurant: Restaurant = { ...INITIAL_RESTAURANT };
  private tables: Table[] = [...INITIAL_TABLES];
  private categories: MenuCategory[] = [...INITIAL_CATEGORIES];
  private items: MenuItem[] = [...INITIAL_ITEMS];
  private orders: Order[] = [...INITIAL_ORDERS];
  private payments: PaymentRecord[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private idempotencyCache: Map<string, Order> = new Map();
  private listeners: Set<Listener> = new Set();
  private nextOrderNumber = 105;

  constructor() {
    // Populate idempotency cache from initial orders
    for (const ord of this.orders) {
      this.idempotencyCache.set(ord.idempotencyKey, ord);
    }
  }

  // --- Subscriptions ---
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: StoreEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    }
  }

  // --- Queries ---
  public getRestaurant(): Restaurant {
    return { ...this.restaurant };
  }

  public getTables(): Table[] {
    return [...this.tables];
  }

  public getTableByToken(token: string): Table | undefined {
    return this.tables.find((t) => t.qrToken === token && t.isActive);
  }

  public getTableById(id: string): Table | undefined {
    return this.tables.find((t) => t.id === id);
  }

  public getCategories(): MenuCategory[] {
    return [...this.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public getItems(): MenuItem[] {
    return [...this.items].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public getItemById(id: string): MenuItem | undefined {
    return this.items.find((i) => i.id === id);
  }

  public getOrders(): Order[] {
    return [...this.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id);
  }

  public getActiveKdsOrders(): Order[] {
    return this.orders
      .filter((o) => ['RECEIVED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  // --- Mutations ---

  /**
   * Toggles menu item availability (86-ing an item in real-time)
   */
  public toggleItemAvailability(itemId: string, userRole: UserRole): { success: boolean; message?: string } {
    if (userRole === 'PUBLIC_DINER') {
      return { success: false, message: 'Unauthorized' };
    }
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return { success: false, message: 'Item not found' };

    item.isAvailable = !item.isAvailable;
    this.logAudit({
      userId: 'staff_console',
      userRole,
      action: 'ITEM_AVAILABILITY_TOGGLED',
      details: `${item.name} set to ${item.isAvailable ? 'AVAILABLE' : '86-ed (SOLD OUT)'}`,
    });

    this.emit({ type: 'ITEM_86_TOGGLED', itemId: item.id, isAvailable: item.isAvailable });
    return { success: true };
  }

  /**
   * Manager Morning Action: Bulk set availability for all items
   * (e.g. "Mark All In-Stock for Today")
   */
  public bulkSetAvailability(isAvailable: boolean, userRole: UserRole): { success: boolean; message?: string } {
    if (userRole !== 'MANAGER' && userRole !== 'OWNER') {
      return { success: false, message: 'Only Hotel Manager or Owner can perform bulk stock resets.' };
    }

    for (const item of this.items) {
      item.isAvailable = isAvailable;
    }

    this.logAudit({
      userId: 'manager_console',
      userRole,
      action: 'BULK_STOCK_RESET',
      details: `Manager reset all menu items to ${isAvailable ? 'AVAILABLE (In Stock)' : 'OUT OF STOCK'}`,
    });

    this.emit({ type: 'BULK_AVAILABILITY_CHANGED', isAvailable });
    return { success: true };
  }

  /**
   * Manager Action: Add a new dish to the digital menu
   */
  public addItem(
    itemData: Omit<MenuItem, 'id'>,
    userRole: UserRole
  ): { success: boolean; item?: MenuItem; message?: string } {
    if (userRole !== 'MANAGER' && userRole !== 'OWNER') {
      return { success: false, message: 'Only Hotel Manager or Owner can add dishes to the menu.' };
    }

    if (!itemData.name?.trim()) {
      return { success: false, message: 'Dish name is required.' };
    }
    if (!itemData.basePriceCents || itemData.basePriceCents <= 0) {
      return { success: false, message: 'A valid base price is required.' };
    }

    const newItem: MenuItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: itemData.name.trim(),
      restaurantId: this.restaurant.id,
      isAvailable: itemData.isAvailable ?? true,
      sortOrder: this.items.length + 1,
    };

    this.items.push(newItem);

    this.logAudit({
      userId: 'manager_console',
      userRole,
      action: 'ITEM_ADDED',
      details: `Manager added new dish: '${newItem.name}' ($${(newItem.basePriceCents / 100).toFixed(2)})`,
    });

    this.emit({ type: 'ITEM_ADDED', item: newItem });
    return { success: true, item: newItem };
  }

  /**
   * Manager Action: Permanently delete/remove a dish from the menu
   */
  public deleteItem(itemId: string, userRole: UserRole): { success: boolean; message?: string } {
    if (userRole !== 'MANAGER' && userRole !== 'OWNER') {
      return { success: false, message: 'Only Hotel Manager or Owner can delete dishes from the menu.' };
    }

    const index = this.items.findIndex((i) => i.id === itemId);
    if (index === -1) {
      return { success: false, message: 'Dish not found.' };
    }

    const [deletedItem] = this.items.splice(index, 1);

    this.logAudit({
      userId: 'manager_console',
      userRole,
      action: 'ITEM_DELETED',
      details: `Manager removed dish: '${deletedItem.name}'`,
    });

    this.emit({ type: 'ITEM_DELETED', itemId });
    return { success: true };
  }

  /**
   * Rotates a table's cryptographic QR token immediately
   */
  public rotateTableToken(tableId: string, userRole: UserRole): { success: boolean; table?: Table; message?: string } {
    if (userRole !== 'MANAGER' && userRole !== 'OWNER') {
      return { success: false, message: 'Only managers or owners can rotate QR tokens.' };
    }
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return { success: false, message: 'Table not found' };

    const oldToken = table.qrToken;
    const newToken = generateTableQrToken();
    table.qrToken = newToken;
    table.qrTokenCreatedAt = new Date().toISOString();

    this.logAudit({
      userId: 'staff_console',
      userRole,
      action: 'QR_TOKEN_ROTATED',
      details: `Table ${table.tableNumber} QR rotated from ${oldToken.slice(0, 12)}... to ${newToken.slice(0, 12)}...`,
    });

    this.emit({ type: 'QR_ROTATED', tableId: table.id, newToken });
    return { success: true, table: { ...table } };
  }

  /**
   * Submits a new customer order with server-calculated pricing and idempotency check
   */
  public submitOrder(params: {
    qrToken: string;
    customerName?: string;
    paymentMethod: 'ONLINE_GATEWAY' | 'CASH';
    tipCents?: number;
    notes?: string;
    items: OrderItemRequest[];
    idempotencyKey: string;
  }): { success: boolean; order?: Order; error?: PricingError | { code: string; message: string } } {
    // 1. Idempotency check
    if (params.idempotencyKey && this.idempotencyCache.has(params.idempotencyKey)) {
      return { success: true, order: this.idempotencyCache.get(params.idempotencyKey)! };
    }

    // 2. Validate table token
    const table = this.getTableByToken(params.qrToken);
    if (!table) {
      return {
        success: false,
        error: { code: 'INVALID_TABLE_TOKEN', message: 'Table QR code is invalid, expired, or deactivated.' },
      };
    }

    // 3. Server pricing recalculation
    const menuMap = new Map(this.items.map((i) => [i.id, i]));
    const orderId = `ord_${Date.now()}`;
    const pricingResult = calculateOrderTotals(
      this.restaurant,
      params.items,
      menuMap,
      params.tipCents || 0,
      orderId
    );

    if (pricingResult.error || !pricingResult.pricing) {
      return { success: false, error: pricingResult.error };
    }

    const { subtotalCents, taxCents, serviceFeeCents, tipCents, totalCents, snapshots } = pricingResult.pricing;

    // 4. Construct Order record
    const newOrder: Order = {
      id: orderId,
      orderNumber: this.nextOrderNumber++,
      restaurantId: this.restaurant.id,
      tableId: table.id,
      tableNumber: table.tableNumber,
      idempotencyKey: params.idempotencyKey || `idem_${Date.now()}`,
      status: 'RECEIVED',
      paymentStatus: params.paymentMethod === 'ONLINE_GATEWAY' ? 'PAID' : 'PENDING_CASH',
      paymentMethod: params.paymentMethod,
      customerName: params.customerName?.trim() || `Table ${table.tableNumber} Guest`,
      subtotalCents,
      taxCents,
      serviceFeeCents,
      tipCents,
      totalCents,
      notes: params.notes?.trim() || undefined,
      items: snapshots,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paidAt: params.paymentMethod === 'ONLINE_GATEWAY' ? new Date().toISOString() : undefined,
    };

    // Update table occupancy
    table.status = 'OCCUPIED';
    table.currentOrderId = newOrder.id;

    // Persist in store
    this.orders.unshift(newOrder);
    this.idempotencyCache.set(newOrder.idempotencyKey, newOrder);

    this.logAudit({
      userId: 'customer_qr',
      userRole: 'PUBLIC_DINER',
      orderId: newOrder.id,
      action: 'ORDER_PLACED',
      details: `Order #${newOrder.orderNumber} placed for Table ${table.tableNumber} ($${(totalCents / 100).toFixed(2)}) via ${params.paymentMethod}`,
    });

    this.emit({ type: 'ORDER_CREATED', order: newOrder });
    this.emit({ type: 'TABLE_STATUS_CHANGED', tableId: table.id, status: table.status });

    return { success: true, order: newOrder };
  }

  /**
   * Advances order status along state machine
   */
  public updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    role: UserRole,
    cancellationReason?: string
  ): { success: boolean; order?: Order; message?: string } {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const transition = canTransitionOrder(order.status, newStatus, role, order.paymentStatus);
    if (!transition.allowed) {
      return { success: false, message: transition.reason || 'Transition not allowed.' };
    }

    const previousStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();

    if (newStatus === 'CANCELLED') {
      order.cancellationReason = cancellationReason || 'Cancelled by staff';
      // Release table if no other active orders
      const table = this.tables.find((t) => t.id === order.tableId);
      if (table && table.currentOrderId === order.id) {
        table.status = 'AVAILABLE';
        table.currentOrderId = null;
        this.emit({ type: 'TABLE_STATUS_CHANGED', tableId: table.id, status: table.status });
      }
    } else if (newStatus === 'COMPLETED') {
      // Table is now free
      const table = this.tables.find((t) => t.id === order.tableId);
      if (table && table.currentOrderId === order.id) {
        table.status = 'AVAILABLE';
        table.currentOrderId = null;
        this.emit({ type: 'TABLE_STATUS_CHANGED', tableId: table.id, status: table.status });
      }
    }

    this.logAudit({
      userId: 'staff_console',
      userRole: role,
      orderId: order.id,
      action: 'ORDER_STATUS_CHANGED',
      details: `Order #${order.orderNumber} transitioned from ${previousStatus} to ${newStatus}`,
    });

    this.emit({ type: 'ORDER_STATUS_CHANGED', orderId: order.id, status: newStatus, previousStatus });
    return { success: true, order: { ...order } };
  }

  /**
   * Kitchen Display: updates line-item prep status
   */
  public updateItemPrepStatus(
    orderId: string,
    snapshotId: string,
    prepStatus: 'PENDING' | 'PREPARING' | 'DONE'
  ): { success: boolean; order?: Order } {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { success: false };

    const item = order.items.find((i) => i.id === snapshotId);
    if (!item) return { success: false };

    item.prepStatus = prepStatus;
    order.updatedAt = new Date().toISOString();

    // Check if all items in order are now DONE
    const allDone = order.items.every((i) => i.prepStatus === 'DONE');
    if (allDone && order.status === 'PREPARING') {
      order.status = 'READY';
      this.emit({ type: 'ORDER_STATUS_CHANGED', orderId: order.id, status: 'READY', previousStatus: 'PREPARING' });
    }

    this.emit({ type: 'ITEM_PREP_CHANGED', orderId, itemId: snapshotId, prepStatus });
    return { success: true, order: { ...order } };
  }

  /**
   * Two-phase cash collection: Only authorized staff (Cashier/Manager/Owner) can confirm cash received.
   * Orders are NEVER marked paid automatically when cash is chosen.
   */
  public collectCashPayment(
    orderId: string,
    staffUserId: string,
    role: UserRole
  ): { success: boolean; order?: Order; message?: string } {
    if (role !== 'CASHIER' && role !== 'MANAGER' && role !== 'OWNER') {
      return { success: false, message: 'Only Cashiers, Managers, or Owners can record cash collection.' };
    }

    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found' };

    if (order.paymentStatus === 'PAID') {
      return { success: true, order, message: 'Order is already marked as paid.' };
    }

    order.paymentStatus = 'PAID';
    order.paidAt = new Date().toISOString();
    order.verifiedByStaffId = staffUserId;
    order.updatedAt = new Date().toISOString();

    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}`,
      orderId: order.id,
      restaurantId: order.restaurantId,
      amountCents: order.totalCents,
      method: 'CASH',
      status: 'SUCCESS',
      verifiedByUserId: staffUserId,
      verifiedAt: new Date().toISOString(),
    };
    this.payments.push(paymentRecord);

    this.logAudit({
      userId: staffUserId,
      userRole: role,
      orderId: order.id,
      action: 'CASH_PAYMENT_COLLECTED',
      details: `Cash payment of $${(order.totalCents / 100).toFixed(2)} verified by ${role} for Order #${order.orderNumber} (Table ${order.tableNumber})`,
    });

    this.emit({
      type: 'PAYMENT_CONFIRMED',
      orderId: order.id,
      method: 'CASH',
      amountCents: order.totalCents,
    });

    return { success: true, order: { ...order } };
  }

  private logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'restaurantId'>) {
    this.auditLogs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      restaurantId: this.restaurant.id,
      ...entry,
    });
  }
}

// Singleton store instance
export const store = new RestaurantStore();
