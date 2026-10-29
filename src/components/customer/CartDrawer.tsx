/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { MenuItem, Restaurant } from '../../types/index.ts';
import { formatCurrency } from '../../core/pricing.ts';

export interface CartItem {
  id: string; // client cart line item id
  menuItemId: string;
  variantId?: string;
  variantName?: string;
  variantDeltaCents: number;
  addonIds?: string[];
  addons?: { id: string; name: string; priceCents: number }[];
  quantity: number;
  specialInstructions?: string;
  basePriceCents: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  menuItemsMap: Map<string, MenuItem>;
  restaurant: Restaurant;
  tableNumber: string;
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onSubmitOrder: (params: {
    paymentMethod: 'ONLINE_GATEWAY' | 'CASH';
    tipCents: number;
    customerName: string;
    notes?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  menuItemsMap,
  restaurant,
  tableNumber,
  onUpdateQuantity,
  onRemoveItem,
  onSubmitOrder,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState<'ONLINE_GATEWAY' | 'CASH'>('ONLINE_GATEWAY');
  const [tipPercent, setTipPercent] = useState<number>(15);
  const [customerName, setCustomerName] = useState<string>('Alex');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Subtotal calculation
  const subtotalCents = items.reduce((sum, item) => {
    const addonsTotal = (item.addons || []).reduce((aSum, a) => aSum + a.priceCents, 0);
    const unitPrice = item.basePriceCents + (item.variantDeltaCents || 0) + addonsTotal;
    return sum + unitPrice * item.quantity;
  }, 0);

  const taxCents = Math.round(subtotalCents * (restaurant.taxRatePercent / 100));
  const serviceFeeCents = Math.round(subtotalCents * (restaurant.serviceFeePercent / 100));
  const tipCents = Math.round(subtotalCents * (tipPercent / 100));
  const totalCents = subtotalCents + taxCents + serviceFeeCents + tipCents;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setErrorMsg(null);
    try {
      await onSubmitOrder({
        paymentMethod,
        tipCents,
        customerName: customerName.trim() || `Table ${tableNumber} Guest`,
        notes: orderNotes.trim() || undefined,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please check item availability.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-heading"
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col">
          {/* Cart Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h2 id="cart-heading" className="text-lg font-bold text-white flex items-center gap-2">
                <span>Your Order</span>
                <span className="text-xs font-mono font-normal bg-neutral-800 px-2 py-0.5 rounded text-amber-400 border border-neutral-700">
                  Table {tableNumber}
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">{items.length} unique items selected</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close cart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {items.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <p className="text-sm">Your order is empty.</p>
                <p className="text-xs text-neutral-500 mt-1">Tap any menu item to customize and add.</p>
              </div>
            ) : (
              items.map((cartItem) => {
                const menuItem = menuItemsMap.get(cartItem.menuItemId);
                const itemName = menuItem?.name || 'Selected Item';
                const addonsPrice = (cartItem.addons || []).reduce((s, a) => s + a.priceCents, 0);
                const itemUnitTotal =
                  cartItem.basePriceCents + cartItem.variantDeltaCents + addonsPrice;
                const lineTotal = itemUnitTotal * cartItem.quantity;

                return (
                  <div
                    key={cartItem.id}
                    className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-2.5"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-semibold text-sm text-neutral-100">{itemName}</h3>
                        {cartItem.variantName && (
                          <span className="text-xs text-amber-400/90 font-medium block">
                            Option: {cartItem.variantName}
                          </span>
                        )}
                        {cartItem.addons && cartItem.addons.length > 0 && (
                          <span className="text-xs text-neutral-400 block">
                            + {cartItem.addons.map((a) => a.name).join(', ')}
                          </span>
                        )}
                        {cartItem.specialInstructions && (
                          <span className="text-xs text-neutral-400 italic block mt-0.5">
                            Note: "{cartItem.specialInstructions}"
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-sm text-white shrink-0">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800/50">
                      <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(cartItem.id, cartItem.quantity - 1)}
                          className="text-neutral-400 hover:text-white p-0.5"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-xs font-bold w-4 text-center text-white">
                          {cartItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(cartItem.id, cartItem.quantity + 1)}
                          className="text-neutral-400 hover:text-white p-0.5"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(cartItem.id)}
                        className="text-neutral-500 hover:text-rose-400 text-xs flex items-center space-x-1 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {items.length > 0 && (
              <>
                {/* Diner Information */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label htmlFor="customer-name" className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                      Guest Name (For table service)
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="order-notes" className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                      Table / Seating Notes
                    </label>
                    <input
                      id="order-notes"
                      type="text"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Please bring water carafe"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Tip Selector */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Staff Hospitality Tip
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {formatCurrency(tipCents)}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setTipPercent(pct)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          tipPercent === pct
                            ? 'bg-amber-500 text-neutral-950 shadow-sm'
                            : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        {pct === 0 ? 'None' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method Choice */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                    Settlement Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('ONLINE_GATEWAY')}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        paymentMethod === 'ONLINE_GATEWAY'
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold">Online Pay</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1">Cards, Apple Pay, UPI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        paymentMethod === 'CASH'
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-neutral-800 bg-neutral-950/40 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Banknote className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold">Cash at Table</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1">Pay staff in person</span>
                    </button>
                  </div>

                  {paymentMethod === 'CASH' && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-snug">
                      <strong>Staff Collection Policy:</strong> Cashier staff will verify and collect cash at your table. Your bill will be marked settled once staff confirms receipt.
                    </div>
                  )}
                </div>

                {/* Transparent Financial Breakdown */}
                <div className="pt-3 border-t border-neutral-800 space-y-1.5 text-xs text-neutral-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-neutral-200">{formatCurrency(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({restaurant.taxRatePercent}%)</span>
                    <span className="font-mono text-neutral-200">{formatCurrency(taxCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee ({restaurant.serviceFeePercent}%)</span>
                    <span className="font-mono text-neutral-200">{formatCurrency(serviceFeeCents)}</span>
                  </div>
                  {tipCents > 0 && (
                    <div className="flex justify-between text-amber-400/90 font-medium">
                      <span>Hospitality Tip</span>
                      <span className="font-mono">{formatCurrency(tipCents)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-neutral-800">
                    <span>Total Amount</span>
                    <span className="font-mono text-amber-400 text-base">
                      {formatCurrency(totalCents)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Checkout Action Button */}
          {items.length > 0 && (
            <div className="p-4 border-t border-neutral-800 bg-neutral-950">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/15 transition-all text-sm"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting to Kitchen...</span>
                  </div>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {paymentMethod === 'ONLINE_GATEWAY' ? 'Pay Online & Submit' : 'Confirm Order (Pay Cash)'} • {formatCurrency(totalCents)}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
