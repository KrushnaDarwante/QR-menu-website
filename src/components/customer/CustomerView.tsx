/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Sparkles,
  Flame,
  Leaf,
  Wheat,
  Clock,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Plus,
  Camera,
  QrCode,
  Lock,
} from 'lucide-react';
import {
  DietaryFlag,
  MenuCategory,
  MenuItem,
  Order,
  Restaurant,
  Table,
} from '../../types/index.ts';
import { formatCurrency } from '../../core/pricing.ts';
import { ItemModal } from './ItemModal.tsx';
import { CartDrawer, CartItem } from './CartDrawer.tsx';
import { OrderTracker } from './OrderTracker.tsx';
import { QrScannerModal } from './QrScannerModal.tsx';

interface CustomerViewProps {
  restaurant: Restaurant;
  table: Table;
  availableTables: Table[];
  categories: MenuCategory[];
  items: MenuItem[];
  activeOrder?: Order | null;
  onOrderSubmitted: (order: Order) => void;
  onSubmitOrderStore: (params: any) => { success: boolean; order?: Order; error?: any };
  onScanTableSuccess: (token: string) => void;
  onOpenManagerPortal?: () => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  restaurant,
  table,
  availableTables,
  categories,
  items,
  activeOrder,
  onOrderSubmitted,
  onSubmitOrderStore,
  onScanTableSuccess,
  onOpenManagerPortal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFlag | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showOrderTracker, setShowOrderTracker] = useState<boolean>(!!activeOrder);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  // Default to showing only available food to users as requested
  const [onlyInStock, setOnlyInStock] = useState<boolean>(true);

  const menuItemsMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  // Filtered items (ensures customers only see available food unless toggled)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Only show available food to customer by default
      if (onlyInStock && !item.isAvailable) {
        return false;
      }
      // Category match
      if (selectedCategory !== 'ALL' && item.categoryId !== selectedCategory) {
        return false;
      }
      // Dietary match
      if (dietaryFilter !== 'ALL' && !item.dietaryFlags.includes(dietaryFilter)) {
        return false;
      }
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [items, onlyInStock, selectedCategory, dietaryFilter, searchQuery]);

  // Add to cart handler
  const handleAddToCart = (params: {
    menuItemId: string;
    variantId?: string;
    addonIds?: string[];
    quantity: number;
    specialInstructions?: string;
  }) => {
    const menuItem = menuItemsMap.get(params.menuItemId);
    if (!menuItem) return;

    const variant = menuItem.variants?.find((v) => v.id === params.variantId);
    const addons = (params.addonIds || [])
      .map((id) => menuItem.addons?.find((a) => a.id === id))
      .filter(Boolean) as { id: string; name: string; priceCents: number }[];

    const newItem: CartItem = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      menuItemId: menuItem.id,
      variantId: params.variantId,
      variantName: variant?.name,
      variantDeltaCents: variant?.priceDeltaCents || 0,
      addonIds: params.addonIds,
      addons,
      quantity: params.quantity,
      specialInstructions: params.specialInstructions,
      basePriceCents: menuItem.basePriceCents,
    };

    setCartItems((prev) => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleSubmitOrder = async (checkoutData: {
    paymentMethod: 'ONLINE_GATEWAY' | 'CASH';
    tipCents: number;
    customerName: string;
    notes?: string;
  }) => {
    setIsSubmitting(true);
    try {
      // Map to server contract
      const orderItemsReq = cartItems.map((ci) => ({
        menuItemId: ci.menuItemId,
        variantId: ci.variantId,
        addonIds: ci.addonIds,
        quantity: ci.quantity,
        specialInstructions: ci.specialInstructions,
      }));

      const result = onSubmitOrderStore({
        qrToken: table.qrToken,
        customerName: checkoutData.customerName,
        paymentMethod: checkoutData.paymentMethod,
        tipCents: checkoutData.tipCents,
        notes: checkoutData.notes,
        items: orderItemsReq,
        idempotencyKey: `idem_${Date.now()}_${table.id}`,
      });

      if (!result.success || !result.order) {
        throw new Error(result.error?.message || 'Order rejected by server.');
      }

      setCartItems([]);
      setIsCartOpen(false);
      onOrderSubmitted(result.order);
      setShowOrderTracker(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cart total for sticky button
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotalCents = cartItems.reduce((sum, item) => {
    const addonsTotal = (item.addons || []).reduce((aSum, a) => aSum + a.priceCents, 0);
    return sum + (item.basePriceCents + item.variantDeltaCents + addonsTotal) * item.quantity;
  }, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-28 pt-4 space-y-6">
      {/* Verified Table Banner */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-xl font-mono shadow-inner">
            {table.tableNumber}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-lg text-white tracking-tight">
                Table {table.tableNumber}
              </h1>
              <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified QR</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {restaurant.name} • {restaurant.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-md shadow-amber-500/15 transition-all flex items-center space-x-1.5"
            aria-label="Scan table QR code with camera"
          >
            <Camera className="w-3.5 h-3.5 text-neutral-950" />
            <span>Scan Table QR</span>
          </button>

          {activeOrder && (
            <button
              onClick={() => setShowOrderTracker((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-amber-400 border border-neutral-700 transition-colors flex items-center space-x-1.5"
            >
              <span>{showOrderTracker ? 'Hide Order Tracker' : 'View Active Order'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Order Tracker (if dining) */}
      {activeOrder && showOrderTracker && (
        <OrderTracker
          order={activeOrder}
          onOrderMore={() => setShowOrderTracker(false)}
        />
      )}

      {/* Search & Dietary Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search our artisan menu (e.g. Wagyu, Truffle, Pizza)..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Category horizontal scroll */}
        <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar" role="tablist">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Dietary toggle chips */}
        <div className="flex space-x-1.5 overflow-x-auto text-[11px] font-medium no-scrollbar">
          <button
            onClick={() => setDietaryFilter('ALL')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              dietaryFilter === 'ALL'
                ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All Diets
          </button>
          <button
            onClick={() => setDietaryFilter('VEGETARIAN')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
              dietaryFilter === 'VEGETARIAN'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-neutral-400 hover:text-emerald-400'
            }`}
          >
            <Leaf className="w-3 h-3 text-emerald-400" />
            <span>Vegetarian</span>
          </button>
          <button
            onClick={() => setDietaryFilter('VEGAN')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
              dietaryFilter === 'VEGAN'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-neutral-400 hover:text-emerald-400'
            }`}
          >
            <Leaf className="w-3 h-3 text-emerald-400" />
            <span>Vegan</span>
          </button>
          <button
            onClick={() => setDietaryFilter('GLUTEN_FREE')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-colors ${
              dietaryFilter === 'GLUTEN_FREE'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-neutral-400 hover:text-amber-400'
            }`}
          >
            <Wheat className="w-3 h-3 text-amber-400" />
            <span>Gluten-Free</span>
          </button>
        </div>
      </div>

      {/* Menu Item Cards Grid */}
      <div className="space-y-3.5">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-neutral-900/50 rounded-2xl border border-neutral-800 p-6">
            <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-neutral-300">No dishes match your selection</h3>
            <p className="text-xs text-neutral-500 mt-1">Try resetting your dietary filter or search terms.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSoldOut = !item.isAvailable;
            return (
              <div
                key={item.id}
                className={`relative bg-neutral-900/70 border border-neutral-800/80 rounded-2xl overflow-hidden p-3.5 sm:p-4 flex gap-3.5 sm:gap-4 transition-all duration-200 ${
                  isSoldOut ? 'opacity-60 grayscale-[40%]' : 'hover:border-neutral-700/80 hover:bg-neutral-900'
                }`}
              >
                {/* Food Image */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-neutral-950 shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isSoldOut && (
                    <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-[2px] flex items-center justify-center p-1 text-center">
                      <span className="text-[10px] font-extrabold uppercase font-mono text-rose-400 tracking-wider">
                        Sold Out (86)
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-white tracking-tight leading-snug">
                        {item.name}
                      </h3>
                      <span className="font-mono font-bold text-sm text-amber-400 shrink-0">
                        {formatCurrency(item.basePriceCents)}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Dietary Badges & Prep time */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-neutral-400 inline-flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        <span>{item.prepTimeMinutes}m</span>
                      </span>
                      {item.dietaryFlags.map((flag) => (
                        <span
                          key={flag}
                          className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300"
                        >
                          {flag === 'VEGETARIAN' && 'Veg'}
                          {flag === 'VEGAN' && 'Vegan'}
                          {flag === 'GLUTEN_FREE' && 'GF'}
                          {flag === 'CHEF_SPECIAL' && 'Chef pick'}
                          {flag === 'HALAL' && 'Halal'}
                          {flag === 'SPICY' && 'Spicy'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Add action */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => setModalItem(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors ${
                        isSoldOut
                          ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/10'
                      }`}
                      aria-label={`Add ${item.name} to order`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isSoldOut ? 'Sold Out' : 'Customize & Add'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Bottom Floating Cart Bar */}
      {cartItemCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold py-3.5 px-5 rounded-2xl shadow-2xl shadow-black/80 flex items-center justify-between transition-transform transform active:scale-95"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-neutral-950 text-amber-400 flex items-center justify-center text-xs font-bold">
                {cartItemCount}
              </div>
              <span className="text-sm tracking-tight">View Your Cart</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-base">{formatCurrency(cartSubtotalCents)}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Item Customization Modal */}
      <ItemModal
        item={modalItem}
        onClose={() => setModalItem(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        menuItemsMap={menuItemsMap}
        restaurant={restaurant}
        tableNumber={table.tableNumber}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onSubmitOrder={handleSubmitOrder}
        isSubmitting={isSubmitting}
      />

      {/* Table QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={onScanTableSuccess}
        availableTables={availableTables}
      />

      {/* Restaurant Website Footer */}
      <footer className="pt-10 border-t border-neutral-800/80 mt-12 space-y-4 text-center text-xs text-neutral-400">
        <div className="space-y-1">
          <p className="font-extrabold text-sm text-white tracking-tight">{restaurant.name}</p>
          <p className="text-neutral-400">{restaurant.address} • Phone: {restaurant.phone}</p>
          <p className="text-neutral-500 text-[11px]">Open 11:30 AM – 11:00 PM Daily • Modern QR Dine-In Platform</p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenManagerPortal}
            className="text-[11px] text-neutral-500 hover:text-amber-400 transition-colors inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
          >
            <Lock className="w-3 h-3 text-neutral-400" />
            <span>Hotel Management & Staff Access</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
