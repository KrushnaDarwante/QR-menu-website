/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, Minus, Check, Flame, Sparkles, Leaf } from 'lucide-react';
import { MenuItem } from '../../types/index.ts';
import { formatCurrency } from '../../core/pricing.ts';

interface ItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (params: {
    menuItemId: string;
    variantId?: string;
    addonIds?: string[];
    quantity: number;
    specialInstructions?: string;
  }) => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({ item, onClose, onAddToCart }) => {
  if (!item) return null;

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    item.variants && item.variants.length > 0 ? item.variants[0].id : undefined
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Calculate live modal total
  const selectedVariant = item.variants?.find((v) => v.id === selectedVariantId);
  const variantDelta = selectedVariant?.priceDeltaCents || 0;
  const addonsTotal = selectedAddonIds.reduce((sum, id) => {
    const addon = item.addons?.find((a) => a.id === id);
    return sum + (addon?.priceCents || 0);
  }, 0);

  const unitTotalCents = item.basePriceCents + variantDelta + addonsTotal;
  const grandTotalCents = unitTotalCents * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddToCart({
      menuItemId: item.id,
      variantId: selectedVariantId,
      addonIds: selectedAddonIds,
      quantity,
      specialInstructions: specialInstructions.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-item-title"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Item Image Header */}
        <div className="relative h-48 sm:h-56 w-full bg-neutral-950 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-black/40" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 id="modal-item-title" className="text-xl font-bold text-white">
                {item.name}
              </h2>
              <span className="text-lg font-mono font-bold text-amber-400">
                {formatCurrency(item.basePriceCents)}
              </span>
            </div>
            <p className="text-sm text-neutral-300 mt-2 leading-relaxed">{item.description}</p>

            {/* Dietary Tags */}
            {item.dietaryFlags && item.dietaryFlags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {item.dietaryFlags.map((flag) => (
                  <span
                    key={flag}
                    className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/60"
                  >
                    {flag === 'VEGETARIAN' && <Leaf className="w-3 h-3 text-emerald-400" />}
                    {flag === 'CHEF_SPECIAL' && <Sparkles className="w-3 h-3 text-amber-400" />}
                    {flag === 'SPICY' && <Flame className="w-3 h-3 text-rose-400" />}
                    <span>{flag.replace('_', ' ')}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Variants Selector */}
          {item.variants && item.variants.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Select Option <span className="text-amber-500">*</span>
              </label>
              <div className="space-y-2">
                {item.variants.map((v) => {
                  const isSelected = selectedVariantId === v.id;
                  return (
                    <label
                      key={v.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-neutral-800 bg-neutral-800/40 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="item-variant"
                          value={v.id}
                          checked={isSelected}
                          onChange={() => setSelectedVariantId(v.id)}
                          className="text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-sm font-medium">{v.name}</span>
                      </div>
                      <span className="text-xs font-mono text-neutral-400">
                        {v.priceDeltaCents > 0
                          ? `+${formatCurrency(v.priceDeltaCents)}`
                          : 'Included'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons Checklist */}
          {item.addons && item.addons.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Enhance with Add-ons (Optional)
              </label>
              <div className="space-y-2">
                {item.addons.map((a) => {
                  const isChecked = selectedAddonIds.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-neutral-800 bg-neutral-800/40 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddon(a.id)}
                          className="rounded text-amber-500 focus:ring-amber-500 bg-neutral-900 border-neutral-700"
                        />
                        <span className="text-sm font-medium">{a.name}</span>
                      </div>
                      <span className="text-xs font-mono text-amber-400">
                        +{formatCurrency(a.priceCents)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Cooking Instructions */}
          <div className="space-y-2">
            <label htmlFor="special-notes" className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Kitchen Notes (Allergies, Dressing on side)
            </label>
            <textarea
              id="special-notes"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra crispy, no onions, sauce on the side..."
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center space-x-3 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="text-neutral-400 hover:text-white disabled:opacity-30 p-1"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-sm text-white w-5 text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="text-neutral-400 hover:text-white p-1"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart button */}
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-3 px-4 rounded-xl flex items-center justify-between shadow-lg shadow-amber-500/10 transition-colors"
          >
            <span>Add to Order</span>
            <span className="font-mono font-extrabold">{formatCurrency(grandTotalCents)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
