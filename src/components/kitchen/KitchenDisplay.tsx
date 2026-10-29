/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/index.ts';

interface KitchenDisplayProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateItemPrepStatus: (orderId: string, itemId: string, prepStatus: 'PENDING' | 'PREPARING' | 'DONE') => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({
  orders,
  onUpdateOrderStatus,
  onUpdateItemPrepStatus,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'RECEIVED' | 'PREPARING' | 'READY'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());

  // Update clock every 10 seconds for elapsed timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter((o) =>
    ['RECEIVED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)
  );

  const filteredOrders = activeOrders.filter((o) => {
    if (filter === 'ALL') return true;
    if (filter === 'RECEIVED') return o.status === 'RECEIVED' || o.status === 'ACCEPTED';
    return o.status === filter;
  });

  const getElapsedMinutes = (createdAt: string) => {
    const elapsedMs = now - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(elapsedMs / 60000));
  };

  const getUrgencyBadge = (minutes: number) => {
    if (minutes >= 20) {
      return {
        bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        label: `${minutes}m DELAYED`,
        color: 'text-rose-400',
      };
    }
    if (minutes >= 10) {
      return {
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        label: `${minutes}m URGENT`,
        color: 'text-amber-400',
      };
    }
    return {
      bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      label: `${minutes}m NORMAL`,
      color: 'text-emerald-400',
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* KDS Header Controls */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Kitchen Display System (KDS)</span>
              <span className="text-xs font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded border border-neutral-700">
                Live Pass
              </span>
            </h1>
            <p className="text-xs text-neutral-400">
              {activeOrders.length} active tickets awaiting service
            </p>
          </div>
        </div>

        {/* Filter Pills & Sound Toggle */}
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filter === 'ALL' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Active ({activeOrders.length})
            </button>
            <button
              onClick={() => setFilter('RECEIVED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filter === 'RECEIVED' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              New Tickets
            </button>
            <button
              onClick={() => setFilter('PREPARING')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filter === 'PREPARING' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              On Grill / Prep
            </button>
            <button
              onClick={() => setFilter('READY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                filter === 'READY' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Plated & Ready
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className={`p-2.5 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-500'
            }`}
            title={soundEnabled ? 'Kitchen chime active' : 'Kitchen chime muted'}
            aria-label="Toggle chime sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Ticket Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-8 space-y-2">
          <ChefHat className="w-12 h-12 text-neutral-600 mx-auto" />
          <h2 className="text-base font-bold text-neutral-300">No tickets in this station queue</h2>
          <p className="text-xs text-neutral-500">All orders are up to date and served.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const elapsedMins = getElapsedMinutes(order.createdAt);
            const urgency = getUrgencyBadge(elapsedMins);
            const isReady = order.status === 'READY';
            const isPreparing = order.status === 'PREPARING';
            const isReceived = order.status === 'RECEIVED' || order.status === 'ACCEPTED';

            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between rounded-2xl border transition-all shadow-xl overflow-hidden ${
                  isReady
                    ? 'border-emerald-500/50 bg-neutral-900 ring-1 ring-emerald-500/20'
                    : elapsedMins >= 20
                    ? 'border-rose-500/50 bg-neutral-900 ring-1 ring-rose-500/20'
                    : 'border-neutral-800 bg-neutral-900'
                }`}
              >
                {/* Ticket Top Bar */}
                <div className="p-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 font-black font-mono flex items-center justify-center text-lg shadow-sm">
                      T{order.tableNumber}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white text-sm">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs text-neutral-400 font-medium truncate max-w-[120px]">
                          {order.customerName}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Urgency elapsed badge */}
                  <div className={`px-2.5 py-1 rounded-md border text-xs font-mono font-bold flex items-center space-x-1.5 ${urgency.bg}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{urgency.label}</span>
                  </div>
                </div>

                {/* Special Dining Notes / Allergens Banner */}
                {order.notes && (
                  <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-start space-x-2 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <span className="font-semibold">Note: "{order.notes}"</span>
                  </div>
                )}

                {/* Ticket Line Items */}
                <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-72">
                  {order.items.map((item) => {
                    const isItemDone = item.prepStatus === 'DONE';
                    const isItemPrep = item.prepStatus === 'PREPARING';

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          const nextStatus =
                            item.prepStatus === 'PENDING'
                              ? 'PREPARING'
                              : item.prepStatus === 'PREPARING'
                              ? 'DONE'
                              : 'PENDING';
                          onUpdateItemPrepStatus(order.id, item.id, nextStatus);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer select-none transition-all ${
                          isItemDone
                            ? 'bg-emerald-950/20 border-emerald-500/30 line-through opacity-75'
                            : isItemPrep
                            ? 'bg-amber-500/10 border-amber-500/40 text-white'
                            : 'bg-neutral-950/40 border-neutral-800 text-neutral-200 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start space-x-2.5">
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs font-bold font-mono mt-0.5 ${
                                isItemDone
                                  ? 'bg-emerald-500 text-neutral-950'
                                  : 'bg-neutral-800 text-neutral-300'
                              }`}
                            >
                              {item.quantity}
                            </span>
                            <div>
                              <span className="font-bold text-sm block leading-snug">
                                {item.snapshotItemName}
                              </span>
                              {item.selectedVariantName && (
                                <span className="text-xs text-amber-400 font-medium block">
                                  {item.selectedVariantName}
                                </span>
                              )}
                              {item.selectedAddons && item.selectedAddons.length > 0 && (
                                <span className="text-xs text-neutral-400 block">
                                  + {item.selectedAddons.map((a) => a.name).join(', ')}
                                </span>
                              )}
                              {item.specialInstructions && (
                                <span className="text-xs text-rose-300 font-semibold block mt-0.5">
                                  * {item.specialInstructions}
                                </span>
                              )}
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                              isItemDone
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : isItemPrep
                                ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                                : 'bg-neutral-800 text-neutral-500'
                            }`}
                          >
                            {item.prepStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bump Bar Actions */}
                <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between gap-3">
                  <div className="text-xs text-neutral-400">
                    Status: <strong className="text-white uppercase font-mono">{order.status}</strong>
                  </div>

                  {isReceived && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'PREPARING')}
                      className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/10 transition-colors"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Start Cooking</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'READY')}
                      className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/10 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ready for Pass</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'SERVED')}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-neutral-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Delivered to Table</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
