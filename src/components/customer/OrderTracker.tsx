/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Utensils,
  Sparkles,
  Banknote,
  ShieldCheck,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/index.ts';
import { formatCurrency } from '../../core/pricing.ts';

interface OrderTrackerProps {
  order: Order;
  onOrderMore: () => void;
}

const STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'RECEIVED', label: 'Received', icon: Clock },
  { status: 'ACCEPTED', label: 'Confirmed', icon: CheckCircle2 },
  { status: 'PREPARING', label: 'Cooking', icon: ChefHat },
  { status: 'READY', label: 'Ready', icon: Sparkles },
  { status: 'SERVED', label: 'Delivered', icon: Utensils },
];

export const OrderTracker: React.FC<OrderTrackerProps> = ({ order, onOrderMore }) => {
  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'RECEIVED':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'READY':
        return 3;
      case 'SERVED':
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Tracker Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
              Order #{order.orderNumber}
            </span>
            <span className="text-xs font-semibold text-neutral-400">
              Table {order.tableNumber}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Live Dining Status</h2>
        </div>

        {/* Payment Status Pill */}
        <div>
          {order.paymentStatus === 'PAID' ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Paid Online ({formatCurrency(order.totalCents)})</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
              <Banknote className="w-3.5 h-3.5 text-amber-400" />
              <span>Cash Due: {formatCurrency(order.totalCents)} (Pay Staff)</span>
            </span>
          )}
        </div>
      </div>

      {/* State Machine Stepper */}
      {!isCancelled ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute left-6 right-6 top-4 h-0.5 bg-neutral-800 -z-0" />
            <div
              className="absolute left-6 top-4 h-0.5 bg-amber-500 transition-all duration-500 -z-0"
              style={{ width: `${(currentIndex / (STEPS.length - 1)) * 90}%` }}
            />

            {STEPS.map((step, idx) => {
              const isPassed = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              const Icon = step.icon;

              return (
                <div key={step.status} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-amber-500 text-neutral-950 ring-4 ring-amber-500/20 shadow-lg shadow-amber-500/30'
                        : isPassed
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 whitespace-nowrap ${
                      isCurrent
                        ? 'text-amber-400 font-bold'
                        : isPassed
                        ? 'text-neutral-300'
                        : 'text-neutral-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current Stage Context Message */}
          <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-xl p-3.5 text-center">
            {order.status === 'RECEIVED' && (
              <p className="text-xs text-neutral-300">
                Your order has been transmitted directly to our kitchen. We'll accept it shortly!
              </p>
            )}
            {order.status === 'ACCEPTED' && (
              <p className="text-xs text-neutral-300">
                Order accepted by the kitchen. Preparation starting in 2 minutes.
              </p>
            )}
            {order.status === 'PREPARING' && (
              <p className="text-xs text-amber-300 font-medium">
                🍳 The chef is actively grilling and plating your dishes!
              </p>
            )}
            {order.status === 'READY' && (
              <p className="text-xs text-emerald-400 font-bold">
                ✨ Your dishes are ready at the pass! Waiter is bringing them to Table {order.tableNumber}.
              </p>
            )}
            {order.status === 'SERVED' && (
              <p className="text-xs text-neutral-300">
                Delivered to Table {order.tableNumber}. Bon Appétit!
              </p>
            )}
            {order.status === 'COMPLETED' && (
              <p className="text-xs text-emerald-400 font-semibold">
                Bill settled. Thank you for dining at The Grand Truffle Bistro!
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
          <strong>Order Cancelled:</strong> {order.cancellationReason || 'Cancelled by restaurant staff.'}
        </div>
      )}

      {/* Ordered Line Items Snapshot */}
      <div className="space-y-2 border-t border-neutral-800 pt-4">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
          Order Summary ({order.items.length} items)
        </span>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-800/40"
            >
              <div>
                <span className="font-semibold text-neutral-200">
                  {item.quantity}x {item.snapshotItemName}
                </span>
                {item.selectedVariantName && (
                  <span className="text-neutral-400 block text-[11px]">
                    {item.selectedVariantName}
                  </span>
                )}
                {item.selectedAddons && item.selectedAddons.length > 0 && (
                  <span className="text-neutral-400 block text-[11px]">
                    + {item.selectedAddons.map((a) => a.name).join(', ')}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-mono text-neutral-300">
                  {formatCurrency(item.itemTotalCents)}
                </span>
                <span className="block text-[10px] text-neutral-500 uppercase font-mono">
                  {item.prepStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order More Button */}
      <button
        onClick={onOrderMore}
        className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-xs transition-colors"
      >
        <PlusCircle className="w-4 h-4 text-amber-400" />
        <span>Add More Items to Table {order.tableNumber}</span>
      </button>
    </div>
  );
};
