/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Banknote,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Receipt,
  UserCheck,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { Order, UserRole } from '../../types/index.ts';
import { formatCurrency } from '../../core/pricing.ts';

interface CashierDeskProps {
  orders: Order[];
  userRole: UserRole;
  onCollectCash: (orderId: string, staffName: string) => Promise<void>;
  onCompleteOrder: (orderId: string) => void;
}

export const CashierDesk: React.FC<CashierDeskProps> = ({
  orders,
  userRole,
  onCollectCash,
  onCompleteOrder,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cashTenderedInput, setCashTenderedInput] = useState<string>('');
  const [staffName, setStaffName] = useState<string>('Elena (Cashier Station #1)');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter orders with cash pending collection
  const pendingCashOrders = orders.filter(
    (o) => o.paymentMethod === 'CASH' && o.paymentStatus === 'PENDING_CASH'
  );

  // Served orders ready for checkout completion
  const servedOrders = orders.filter((o) => o.status === 'SERVED');

  const handleOpenCollection = (order: Order) => {
    setSelectedOrder(order);
    const dollars = (order.totalCents / 100).toFixed(2);
    setCashTenderedInput(dollars);
    setFeedback(null);
  };

  const handleConfirmCashCollection = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      await onCollectCash(selectedOrder.id, staffName);
      setFeedback({
        type: 'success',
        message: `Cash collection of ${formatCurrency(selectedOrder.totalCents)} confirmed for Table ${selectedOrder.tableNumber}. Receipt generated!`,
      });
      setSelectedOrder(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to record cash payment.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const tenderedDollars = parseFloat(cashTenderedInput) || 0;
  const billDollars = selectedOrder ? selectedOrder.totalCents / 100 : 0;
  const changeDollars = Math.max(0, tenderedDollars - billDollars);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Cashier Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
            <Banknote className="w-6 h-6 text-neutral-950" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Cashier Desk & Payment Settlement</span>
              <span className="text-xs font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded border border-neutral-700">
                Staff Audit Enforced
              </span>
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Strict two-phase cash verification. Cash is never auto-confirmed.
            </p>
          </div>
        </div>

        {/* Staff badge */}
        <div className="flex items-center space-x-2 text-xs bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-neutral-400">Current Station:</span>
          <span className="font-semibold text-white">{staffName}</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center space-x-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Grid: Uncollected Cash Orders vs Served Ready for Settlement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uncollected Cash Queue */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <h2 className="font-bold text-white text-base">Uncollected Cash Orders</h2>
            </div>
            <span className="font-mono text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
              {pendingCashOrders.length} Pending Collection
            </span>
          </div>

          {pendingCashOrders.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
              <p>All cash payments have been verified and collected.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCashOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl bg-neutral-950/70 border border-amber-500/30 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <span className="w-9 h-9 rounded-lg bg-amber-500 text-neutral-950 font-mono font-black text-sm flex items-center justify-center">
                        T{order.tableNumber}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">
                            Order #{order.orderNumber}
                          </span>
                          <span className="text-xs text-neutral-400">({order.customerName})</span>
                        </div>
                        <span className="text-xs text-neutral-400">
                          {order.items.length} items • Status: <strong className="text-neutral-200">{order.status}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-400 text-base block">
                        {formatCurrency(order.totalCents)}
                      </span>
                      <span className="text-[10px] text-amber-300 font-mono uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">
                        CASH PENDING
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
                    <span className="text-neutral-500 font-mono text-[11px]">
                      Placed: {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => handleOpenCollection(order)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 shadow-sm transition-colors"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Collect Cash & Verify</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Served Orders Ready for Final Table Turnover */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Served Tables Ready for Checkout</span>
            </h2>
            <span className="font-mono text-xs text-neutral-400">
              {servedOrders.length} tables
            </span>
          </div>

          {servedOrders.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              <p>No tables currently awaiting checkout completion.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {servedOrders.map((order) => {
                const isPaid = order.paymentStatus === 'PAID';

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <span className="w-9 h-9 rounded-lg bg-neutral-800 text-white font-mono font-bold text-sm flex items-center justify-center">
                          T{order.tableNumber}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-sm">
                              Order #{order.orderNumber}
                            </span>
                            <span className="text-xs text-neutral-400">({order.customerName})</span>
                          </div>
                          <span className="text-xs text-neutral-400">
                            {formatCurrency(order.totalCents)} • {order.paymentMethod}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                          isPaid
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {isPaid ? 'PAID' : 'PAYMENT REQUIRED'}
                      </span>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-neutral-800">
                      <button
                        onClick={() => onCompleteOrder(order.id)}
                        disabled={!isPaid}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                          isPaid
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                            : 'bg-neutral-950 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                        }`}
                        title={!isPaid ? 'Payment must be confirmed before table can be completed' : ''}
                      >
                        <Receipt className="w-3.5 h-3.5 text-amber-400" />
                        <span>Finalize Checkout & Clear Table</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cash Collection Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                  Table {selectedOrder.tableNumber}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Confirm Cash Collection
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            {/* Bill Summary */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5 text-xs text-neutral-300">
              <div className="flex justify-between">
                <span>Guest</span>
                <span className="font-semibold text-white">{selectedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono">{formatCurrency(selectedOrder.subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax & Service Charge</span>
                <span className="font-mono">
                  {formatCurrency(selectedOrder.taxCents + selectedOrder.serviceFeeCents)}
                </span>
              </div>
              {selectedOrder.tipCents > 0 && (
                <div className="flex justify-between text-amber-400 font-medium">
                  <span>Hospitality Tip</span>
                  <span className="font-mono">{formatCurrency(selectedOrder.tipCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-neutral-800">
                <span>Total Due</span>
                <span className="font-mono text-amber-400 text-base">
                  {formatCurrency(selectedOrder.totalCents)}
                </span>
              </div>
            </div>

            {/* Cash Tendered & Change Calculator */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Cash Amount Tendered ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={cashTenderedInput}
                    onChange={(e) => setCashTenderedInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-4 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quick Bill presets */}
              <div className="flex space-x-2">
                {[50, 60, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCashTenderedInput(preset.toFixed(2))}
                    className="flex-1 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs font-mono"
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              {/* Change calculation */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex justify-between items-center text-xs">
                <span className="text-neutral-400">Change Due to Customer:</span>
                <span className="font-mono font-bold text-base text-emerald-400">
                  ${changeDollars.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirmCashCollection}
              disabled={isProcessing || tenderedDollars < billDollars}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm shadow-lg shadow-emerald-500/20 transition-all"
            >
              {isProcessing ? (
                <span>Recording Cash Payment...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Received & Stamp Paid</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
