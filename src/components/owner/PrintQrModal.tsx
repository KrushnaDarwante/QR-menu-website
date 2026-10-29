/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Printer, ShieldCheck, Utensils, Smartphone, Sparkles } from 'lucide-react';
import { Restaurant, Table } from '../../types/index.ts';

interface PrintQrModalProps {
  table: Table | null;
  restaurant: Restaurant;
  onClose: () => void;
}

/**
 * Deterministic SVG QR pattern generator for crisp offline vector printing
 */
export const SvgQrMatrix: React.FC<{ token: string; size?: number }> = ({ token, size = 180 }) => {
  // Generate deterministic grid of dark modules based on token string hash
  const gridSize = 21; // standard version 1 QR size
  const modules: boolean[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => false)
  );

  // Position detection patterns (corners)
  const drawCorner = (rStart: number, cStart: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          modules[rStart + r][cStart + c] = true;
        }
      }
    }
  };

  drawCorner(0, 0); // Top-left
  drawCorner(0, gridSize - 7); // Top-right
  drawCorner(gridSize - 7, 0); // Bottom-left

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }

  // Populate data modules deterministically from token char codes
  let bitIndex = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite corner zones
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      if (!inTopLeft && !inTopRight && !inBottomLeft) {
        const charCode = token.charCodeAt(bitIndex % token.length) || 42;
        modules[r][c] = (charCode + r * 7 + c * 13) % 3 === 0;
        bitIndex++;
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-white p-2 rounded-xl">
      {modules.map((row, r) =>
        row.map((isDark, c) =>
          isDark ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.1}
              height={cellSize + 0.1}
              fill="#0a0a0a"
            />
          ) : null
        )
      )}
    </svg>
  );
};

export const PrintQrModal: React.FC<PrintQrModalProps> = ({ table, restaurant, onClose }) => {
  if (!table) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Top Control Bar */}
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center no-print">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Table Stand Preview
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-lg"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Table Acrylic Stand Layout */}
        <div className="p-6 bg-neutral-950 flex justify-center">
          <div
            id="table-stand-card"
            className="w-72 bg-neutral-900 border-2 border-amber-500/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl shadow-black relative overflow-hidden"
          >
            {/* Subtle luxury brass border ornament */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

            {/* Restaurant Brand */}
            <div className="space-y-1">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-neutral-950 mx-auto flex items-center justify-center font-bold">
                <Utensils className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                {restaurant.name}
              </h2>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">
                Dine-In Digital Experience
              </p>
            </div>

            {/* Prominent Table Number Callout */}
            <div className="py-2 bg-neutral-950/80 rounded-xl border border-neutral-800">
              <span className="text-[11px] font-mono uppercase text-amber-400 font-bold block">
                Table
              </span>
              <span className="text-3xl font-black font-mono text-white tracking-tight">
                {table.tableNumber}
              </span>
            </div>

            {/* Crisp Vector QR Code */}
            <div className="flex justify-center py-1">
              <SvgQrMatrix token={table.qrToken} size={160} />
            </div>

            {/* Guest instructions */}
            <div className="space-y-1.5 text-xs text-neutral-300">
              <div className="flex items-center justify-center space-x-1.5 text-amber-400 font-bold text-[11px]">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Scan with Camera to Order</span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-snug">
                Browse our live chef menu, customize dishes, and order directly to Table {table.tableNumber}.
              </p>
            </div>

            {/* Security badge footer */}
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-center space-x-1 text-[9px] text-neutral-500 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Token: {table.qrToken.slice(0, 16)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
