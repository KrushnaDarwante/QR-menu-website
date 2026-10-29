/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Flame,
} from 'lucide-react';
import { MenuCategory, MenuItem, UserRole } from '../../types/index.ts';
import { formatCurrency } from '../../core/pricing.ts';

interface MenuManagerProps {
  categories: MenuCategory[];
  items: MenuItem[];
  userRole: UserRole;
  onToggleAvailability: (itemId: string) => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  categories,
  items,
  userRole,
  onToggleAvailability,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filteredItems = items.filter((item) => {
    if (selectedCat !== 'ALL' && item.categoryId !== selectedCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const soldOutCount = items.filter((i) => !i.isAvailable).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 86 Hub Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            <span>Digital Menu & 86 (Sold-Out) Hub</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time item availability toggle. Changes propagate instantly to all active diner menus.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {soldOutCount > 0 ? (
            <span className="px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{soldOutCount} Items 86'd (Sold Out)</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full Menu Available</span>
            </span>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items to 86..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCat('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              selectedCat === 'ALL'
                ? 'bg-amber-500 text-neutral-950'
                : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
            }`}
          >
            All ({items.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                selectedCat === c.id
                  ? 'bg-amber-500 text-neutral-950'
                  : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-bold">Dish</th>
                <th className="py-3.5 px-4 font-bold">Category</th>
                <th className="py-3.5 px-4 font-bold">Base Price</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Quick 86 Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredItems.map((item) => {
                const category = categories.find((c) => c.id === item.categoryId);
                const isAvailable = item.isAvailable;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-neutral-800/40 transition-colors ${
                      !isAvailable ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover bg-neutral-950 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-white text-sm block">
                            {item.name}
                          </span>
                          <span className="text-neutral-400 text-[11px] line-clamp-1">
                            {item.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-neutral-300 font-medium">
                      {category?.name || 'Uncategorized'}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {formatCurrency(item.basePriceCents)}
                    </td>

                    <td className="py-3 px-4">
                      {isAvailable ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>In Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
                          <XCircle className="w-3 h-3" />
                          <span>86'd (Sold Out)</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onToggleAvailability(item.id)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                          isAvailable
                            ? 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40'
                            : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/40'
                        }`}
                      >
                        {isAvailable ? "Mark Sold Out (86)" : 'Restore to Stock'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
