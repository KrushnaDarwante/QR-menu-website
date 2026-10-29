/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActiveTab,
  Header,
} from './components/common/Header.tsx';
import { CustomerView } from './components/customer/CustomerView.tsx';
import { KitchenDisplay } from './components/kitchen/KitchenDisplay.tsx';
import { FloorAndTables } from './components/owner/FloorAndTables.tsx';
import { CashierDesk } from './components/owner/CashierDesk.tsx';
import { AnalyticsView } from './components/owner/AnalyticsView.tsx';
import { PrintQrModal } from './components/owner/PrintQrModal.tsx';
import { PrintAllStands } from './components/owner/PrintAllStands.tsx';
import { DailyStockManager } from './components/manager/DailyStockManager.tsx';
import { ManagerLoginModal } from './components/manager/ManagerLoginModal.tsx';
import { store, StoreEvent } from './core/store.ts';
import {
  MenuCategory,
  MenuItem,
  Order,
  OrderStatus,
  Restaurant,
  Table,
  UserRole,
} from './types/index.ts';

export default function App() {
  const [restaurant, setRestaurant] = useState<Restaurant>(store.getRestaurant());
  const [tables, setTables] = useState<Table[]>(store.getTables());
  const [categories, setCategories] = useState<MenuCategory[]>(store.getCategories());
  const [items, setItems] = useState<MenuItem[]>(store.getItems());
  const [orders, setOrders] = useState<Order[]>(store.getOrders());
  const [auditLogs, setAuditLogs] = useState(store.getAuditLogs());

  const [activeTab, setActiveTab] = useState<ActiveTab>('customer');
  const [userRole, setUserRole] = useState<UserRole>('PUBLIC_DINER');
  const [selectedTableId, setSelectedTableId] = useState<string>('tbl_04'); // Table 4 default
  const [printTable, setPrintTable] = useState<Table | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);

  // Sync state from store
  const refreshState = useCallback(() => {
    setRestaurant(store.getRestaurant());
    setTables(store.getTables());
    setCategories(store.getCategories());
    setItems(store.getItems());
    setOrders(store.getOrders());
    setAuditLogs(store.getAuditLogs());
  }, []);

  // Handle URL query parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || params.get('tableToken');
    const viewParam = params.get('view');
    const roleParam = params.get('role');

    if (tokenParam) {
      const matchedTable = store.getTableByToken(tokenParam);
      if (matchedTable) {
        setSelectedTableId(matchedTable.id);
        setActiveTab('customer');
        setUserRole('PUBLIC_DINER');
      }
    }

    if (viewParam && ['customer', 'kds', 'floor', 'cashier', 'analytics', 'print_all'].includes(viewParam)) {
      setActiveTab(viewParam as ActiveTab);
    }

    if (roleParam && ['PUBLIC_DINER', 'KITCHEN', 'CASHIER', 'MANAGER', 'OWNER'].includes(roleParam)) {
      setUserRole(roleParam as UserRole);
    }
  }, []);

  // Subscribe to real-time store events (in-memory + SSE bridge)
  useEffect(() => {
    const unsubscribe = store.subscribe((event: StoreEvent) => {
      refreshState();

      // Show user-friendly toast notification
      if (event.type === 'ORDER_CREATED') {
        setToastMessage(`🔔 New Order #${event.order.orderNumber} placed for Table ${event.order.tableNumber}!`);
      } else if (event.type === 'PAYMENT_CONFIRMED') {
        setToastMessage(`💰 Payment confirmed: Order bill settled.`);
      } else if (event.type === 'ITEM_86_TOGGLED') {
        const item = store.getItemById(event.itemId);
        setToastMessage(`ℹ️ Menu updated: ${item?.name} is now ${event.isAvailable ? 'available' : '86-ed (sold out)'}.`);
      } else if (event.type === 'ORDER_STATUS_CHANGED') {
        setToastMessage(`📋 Order status updated to ${event.status}.`);
      }
    });

    return () => unsubscribe();
  }, [refreshState]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearInterval(timer);
  }, [toastMessage]);

  const activeTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId) || tables[0],
    [tables, selectedTableId]
  );

  const activeTableOrder = useMemo(() => {
    return orders.find(
      (o) => o.tableId === activeTable.id && !['COMPLETED', 'CANCELLED'].includes(o.status)
    );
  }, [orders, activeTable]);

  const pendingCashCount = useMemo(
    () => orders.filter((o) => o.paymentMethod === 'CASH' && o.paymentStatus === 'PENDING_CASH').length,
    [orders]
  );

  const activeKdsCount = useMemo(
    () => orders.filter((o) => ['RECEIVED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)).length,
    [orders]
  );

  // Tab switch handler with role sync
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'kds') {
      setUserRole('KITCHEN');
    } else if (tab === 'cashier') {
      setUserRole('CASHIER');
    } else if (tab === 'stock' || tab === 'floor' || tab === 'analytics' || tab === 'print_all') {
      if (userRole === 'PUBLIC_DINER') {
        setUserRole('MANAGER');
      }
    } else if (tab === 'customer') {
      setUserRole('PUBLIC_DINER');
    }
  };

  // Actions
  const handleRotateQr = (tableId: string) => {
    const result = store.rotateTableToken(tableId, userRole === 'PUBLIC_DINER' ? 'MANAGER' : userRole);
    if (result.success) {
      refreshState();
      setToastMessage('✅ Table QR token rotated successfully. Previous QR link invalidated.');
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    store.updateOrderStatus(orderId, status, userRole);
    refreshState();
  };

  const handleUpdateItemPrepStatus = (
    orderId: string,
    itemId: string,
    prepStatus: 'PENDING' | 'PREPARING' | 'DONE'
  ) => {
    store.updateItemPrepStatus(orderId, itemId, prepStatus);
    refreshState();
  };

  const handleCollectCash = async (orderId: string, staffName: string) => {
    const result = store.collectCashPayment(orderId, staffName, 'CASHIER');
    if (!result.success) {
      throw new Error(result.message);
    }
    refreshState();
  };

  const handleCompleteOrder = (orderId: string) => {
    const result = store.updateOrderStatus(orderId, 'COMPLETED', 'CASHIER');
    if (result.success) {
      refreshState();
      setToastMessage('✅ Order finalized and Table cleared to Available.');
    } else {
      setToastMessage(`⚠️ ${result.message}`);
    }
  };

  const handleToggleAvailability = (itemId: string) => {
    store.toggleItemAvailability(itemId, userRole === 'PUBLIC_DINER' ? 'MANAGER' : userRole);
    refreshState();
  };

  const handleBulkSetAvailability = (isAvailable: boolean) => {
    const result = store.bulkSetAvailability(isAvailable, userRole === 'PUBLIC_DINER' ? 'MANAGER' : userRole);
    if (result.success) {
      refreshState();
      setToastMessage(`☀️ Daily stock updated: All dishes marked ${isAvailable ? 'IN STOCK' : 'OUT OF STOCK'}.`);
    } else {
      setToastMessage(`⚠️ ${result.message}`);
    }
  };

  const handleAddItem = (itemData: Omit<MenuItem, 'id'>) => {
    const result = store.addItem(itemData, userRole === 'PUBLIC_DINER' ? 'MANAGER' : userRole);
    if (result.success && result.item) {
      refreshState();
      setToastMessage(`✅ Added '${result.item.name}' to the live menu!`);
    } else {
      setToastMessage(`⚠️ ${result.message || 'Failed to add dish.'}`);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    const result = store.deleteItem(itemId, userRole === 'PUBLIC_DINER' ? 'MANAGER' : userRole);
    if (result.success) {
      refreshState();
      setToastMessage('🗑️ Dish removed from the menu.');
    } else {
      setToastMessage(`⚠️ ${result.message}`);
    }
  };

  const handleLoginSuccess = (role: UserRole) => {
    setUserRole(role);
    setActiveTab('stock');
    setToastMessage(`🔑 Welcome, ${role}! Morning stock & operations portal unlocked.`);
  };

  const handleSelectTableForCustomer = (table: Table) => {
    setSelectedTableId(table.id);
    setActiveTab('customer');
    setUserRole('PUBLIC_DINER');
  };

  const handleScanTableSuccess = (token: string) => {
    const matchedTable = store.getTableByToken(token);
    if (matchedTable) {
      setSelectedTableId(matchedTable.id);
      setActiveTab('customer');
      setUserRole('PUBLIC_DINER');

      // Update URL query parameter to persist table context
      try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('token', token);
        window.history.pushState({}, '', newUrl.toString());
      } catch {
        // Ignore in restrictive environments
      }

      setToastMessage(`🎯 Verified Table ${matchedTable.tableNumber}! Dining context switched.`);
    } else {
      setToastMessage('⚠️ Scanned QR token is invalid or table is not active.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 z-50 max-w-sm bg-neutral-900 border border-amber-500/40 text-amber-300 text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl shadow-black/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2"
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-neutral-400 hover:text-white p-0.5"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userRole={userRole}
        onRoleChange={setUserRole}
        activeTableNumber={activeTable.tableNumber}
        pendingCashCount={pendingCashCount}
        activeKdsCount={activeKdsCount}
        isLiveConnected={isLiveConnected}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {activeTab === 'customer' && (
          <CustomerView
            restaurant={restaurant}
            table={activeTable}
            availableTables={tables}
            categories={categories}
            items={items}
            activeOrder={activeTableOrder}
            onOrderSubmitted={(newOrder) => {
              refreshState();
            }}
            onSubmitOrderStore={(params) => store.submitOrder(params)}
            onScanTableSuccess={handleScanTableSuccess}
            onOpenManagerPortal={() => setIsLoginModalOpen(true)}
          />
        )}

        {activeTab === 'stock' && (
          <DailyStockManager
            items={items}
            categories={categories}
            userRole={userRole}
            onToggleAvailability={handleToggleAvailability}
            onBulkSetAvailability={handleBulkSetAvailability}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'kds' && (
          <KitchenDisplay
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateItemPrepStatus={handleUpdateItemPrepStatus}
          />
        )}

        {activeTab === 'floor' && (
          <FloorAndTables
            tables={tables}
            orders={orders}
            userRole={userRole}
            onRotateQr={handleRotateQr}
            onSelectTableForCustomer={handleSelectTableForCustomer}
            onPrintTableQr={(table) => setPrintTable(table)}
          />
        )}

        {activeTab === 'cashier' && (
          <CashierDesk
            orders={orders}
            userRole={userRole}
            onCollectCash={handleCollectCash}
            onCompleteOrder={handleCompleteOrder}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            orders={orders}
            tables={tables}
            auditLogs={auditLogs}
          />
        )}

        {activeTab === 'print_all' && (
          <PrintAllStands
            tables={tables}
            restaurant={restaurant}
          />
        )}
      </main>

      {/* Single Table QR Print Modal */}
      {printTable && (
        <PrintQrModal
          table={printTable}
          restaurant={restaurant}
          onClose={() => setPrintTable(null)}
        />
      )}

      {/* Hotel Manager & Staff Login Modal */}
      <ManagerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
