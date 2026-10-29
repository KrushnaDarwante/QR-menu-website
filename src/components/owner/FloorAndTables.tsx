/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutGrid,
  Users,
  QrCode,
  RotateCw,
  ExternalLink,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Order, Table, UserRole } from '../../types/index.ts';

interface FloorAndTablesProps {
  tables: Table[];
  orders: Order[];
  userRole: UserRole;
  onRotateQr: (tableId: string) => void;
  onSelectTableForCustomer: (table: Table) => void;
  onPrintTableQr: (table: Table) => void;
}

export const FloorAndTables: React.FC<FloorAndTablesProps> = ({
  tables,
  orders,
  userRole,
  onRotateQr,
  onSelectTableForCustomer,
  onPrintTableQr,
}) => {
  const [rotatingId, setRotatingId] = useState<string | null>(null);

  const getTableStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400';
      case 'OCCUPIED':
        return 'border-amber-500/40 bg-amber-500/5 text-amber-400';
      case 'BILLING':
        return 'border-purple-500/40 bg-purple-500/5 text-purple-400';
      case 'RESERVED':
        return 'border-blue-500/40 bg-blue-500/5 text-blue-400';
      default:
        return 'border-neutral-700 bg-neutral-800 text-neutral-400';
    }
  };

  const handleRotate = async (tableId: string) => {
    if (!window.confirm('Are you sure you want to rotate this table QR token? Any existing printed cards or guest links will be invalidated immediately.')) {
      return;
    }
    setRotatingId(tableId);
    try {
      await onRotateQr(tableId);
    } finally {
      setRotatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Floor Summary Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-amber-400" />
            <span>Dining Room & Table QR Management</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {tables.length} configured dining tables with cryptographically isolated QR tokens
          </p>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold">
            ● Available ({tables.filter((t) => t.status === 'AVAILABLE').length})
          </span>
          <span className="px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold">
            ● Occupied ({tables.filter((t) => t.status === 'OCCUPIED').length})
          </span>
          <span className="px-2.5 py-1 rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-400 font-semibold">
            ● Reserved ({tables.filter((t) => t.status === 'RESERVED').length})
          </span>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tables.map((table) => {
          const activeOrder = orders.find(
            (o) => o.tableId === table.id && !['COMPLETED', 'CANCELLED'].includes(o.status)
          );
          const isRotating = rotatingId === table.id;

          return (
            <div
              key={table.id}
              className={`rounded-2xl border bg-neutral-900 p-5 space-y-4 shadow-xl transition-all ${getTableStatusColor(
                table.status
              )}`}
            >
              {/* Card Top */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center font-mono font-black text-xl text-white shadow-inner">
                    T{table.tableNumber}
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-base">Table {table.tableNumber}</h2>
                    <div className="flex items-center space-x-2 text-xs text-neutral-400 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{table.capacity} Seats</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[10px] uppercase font-bold text-neutral-300">
                        {table.status}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onPrintTableQr(table)}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors border border-neutral-700/60"
                  title="Print Table Stand QR Card"
                  aria-label={`Print Stand for Table ${table.tableNumber}`}
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              {/* Cryptographic Token Details */}
              <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-neutral-400">
                  <span className="flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cryptographic QR Token</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRotate(table.id)}
                    disabled={isRotating}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 transition-colors"
                  >
                    <RotateCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
                    <span>Rotate</span>
                  </button>
                </div>
                <code className="block text-[11px] font-mono text-neutral-300 truncate bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                  {table.qrToken}
                </code>
              </div>

              {/* Active Dining Order summary if present */}
              {activeOrder && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs space-y-1 text-amber-300">
                  <div className="flex justify-between font-bold">
                    <span>Active Order #{activeOrder.orderNumber}</span>
                    <span className="font-mono uppercase text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">
                      {activeOrder.status}
                    </span>
                  </div>
                  <p className="text-neutral-300 text-[11px]">
                    Guest: {activeOrder.customerName} • {activeOrder.items.length} items
                  </p>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-amber-500/20 font-mono">
                    <span>Payment: {activeOrder.paymentMethod}</span>
                    <span className={activeOrder.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}>
                      {activeOrder.paymentStatus === 'PAID' ? 'PAID' : 'CASH DUE'}
                    </span>
                  </div>
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectTableForCustomer(table)}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors border border-neutral-700"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Diner Menu</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
