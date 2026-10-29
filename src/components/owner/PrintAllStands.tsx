/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, Utensils, Smartphone, ShieldCheck } from 'lucide-react';
import { Restaurant, Table } from '../../types/index.ts';
import { SvgQrMatrix } from './PrintQrModal.tsx';

interface PrintAllStandsProps {
  tables: Table[];
  restaurant: Restaurant;
}

export const PrintAllStands: React.FC<PrintAllStandsProps> = ({ tables, restaurant }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Action Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <span>Print All Table QR Stands</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Print-ready layout formatted for standard acrylic table-tent stands. Click Print or press Ctrl+P.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/10 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print All Stands</span>
        </button>
      </div>

      {/* Grid of Printable Table Stands */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {tables.map((table) => (
          <div
            key={table.id}
            className="bg-neutral-900 border-2 border-amber-500/40 rounded-2xl p-5 text-center space-y-3.5 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

            {/* Restaurant Brand */}
            <div className="space-y-0.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-neutral-950 mx-auto flex items-center justify-center font-bold">
                <Utensils className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-extrabold text-white tracking-tight">
                {restaurant.name}
              </h2>
              <p className="text-[9px] text-neutral-400 uppercase tracking-widest font-semibold">
                Table QR Dine-In
              </p>
            </div>

            {/* Table Badge */}
            <div className="py-1.5 bg-neutral-950 rounded-xl border border-neutral-800">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                Table
              </span>
              <span className="text-2xl font-black font-mono text-white">
                {table.tableNumber}
              </span>
            </div>

            {/* Crisp Vector QR Code */}
            <div className="flex justify-center py-1">
              <SvgQrMatrix token={table.qrToken} size={140} />
            </div>

            {/* Guest instructions */}
            <div className="space-y-1 text-xs text-neutral-300">
              <div className="flex items-center justify-center space-x-1 text-amber-400 font-bold text-[11px]">
                <Smartphone className="w-3 h-3" />
                <span>Scan to Order & Pay</span>
              </div>
              <p className="text-[10px] text-neutral-400">
                Browse our live menu directly from your phone.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-800 flex items-center justify-center space-x-1 text-[9px] text-neutral-500 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Token: {table.qrToken.slice(0, 14)}...</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
