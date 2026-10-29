/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SunMedium,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  AlertCircle,
  Sparkles,
  Leaf,
  Flame,
  Wheat,
  UtensilsCrossed,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { DietaryFlag, MenuCategory, MenuItem, UserRole } from '../../types/index.ts';
import { formatCurrency } from '../../core/pricing.ts';

interface DailyStockManagerProps {
  items: MenuItem[];
  categories: MenuCategory[];
  userRole: UserRole;
  onToggleAvailability: (itemId: string) => void;
  onBulkSetAvailability: (isAvailable: boolean) => void;
  onAddItem: (itemData: Omit<MenuItem, 'id'>) => void;
  onDeleteItem: (itemId: string) => void;
}

const PRESET_IMAGES = [
  { label: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80' },
  { label: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80' },
  { label: 'Salad / Starter', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80' },
  { label: 'Grill / Roast', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80' },
  { label: 'Drink / Cocktail', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80' },
  { label: 'Dessert', url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=700&q=80' },
];

export const DailyStockManager: React.FC<DailyStockManagerProps> = ({
  items,
  categories,
  userRole,
  onToggleAvailability,
  onBulkSetAvailability,
  onAddItem,
  onDeleteItem,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New Item Form State
  const [name, setName] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || 'cat_burgers');
  const [priceDollars, setPriceDollars] = useState<string>('15.00');
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(PRESET_IMAGES[0].url);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(10);
  const [dietaryFlags, setDietaryFlags] = useState<DietaryFlag[]>(['VEGETARIAN']);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleDietaryFlag = (flag: DietaryFlag) => {
    setDietaryFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter a dish name.');
      return;
    }
    const cents = Math.round(parseFloat(priceDollars) * 100);
    if (isNaN(cents) || cents <= 0) {
      setFormError('Please enter a valid price in dollars.');
      return;
    }

    onAddItem({
      name: name.trim(),
      restaurantId: 'rest_grand_truffle',
      categoryId,
      basePriceCents: cents,
      description: description.trim() || 'Prepared fresh by our culinary kitchen.',
      imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
      prepTimeMinutes: Number(prepTimeMinutes) || 10,
      isAvailable: true,
      dietaryFlags,
      sortOrder: items.length + 1,
    });

    // Reset and close
    setName('');
    setDescription('');
    setPriceDollars('15.00');
    setIsAddModalOpen(false);
  };

  const filteredItems = items.filter((item) => {
    if (selectedCat !== 'ALL' && item.categoryId !== selectedCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const availableCount = items.filter((i) => i.isAvailable).length;
  const soldOutCount = items.filter((i) => !i.isAvailable).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Hotel Manager Daily Setup */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-neutral-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
            <SunMedium className="w-6 h-6 text-neutral-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                Manager Daily Stock & Menu Checklist
              </h1>
              <span className="text-[11px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                Manager Only
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Select available items every morning. Customers will only see items marked In Stock.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onBulkSetAvailability(true)}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2 border border-neutral-700 transition-colors"
            title="Mark all items available for morning service"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Mark All In Stock for Today</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-amber-500/15 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish / Product</span>
          </button>
        </div>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
              Total Menu Items
            </span>
            <div className="text-2xl font-black font-mono text-white mt-1">{items.length}</div>
          </div>
          <UtensilsCrossed className="w-8 h-8 text-neutral-700" />
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
              Available to Customers
            </span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {availableCount}
            </div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400/80" />
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-300 font-semibold uppercase tracking-wider">
              Out of Stock Today (86)
            </span>
            <div className="text-2xl font-black font-mono text-rose-400 mt-1">
              {soldOutCount}
            </div>
          </div>
          <XCircle className="w-8 h-8 text-rose-400/80" />
        </div>
      </div>

      {/* Search & Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items to toggle availability or remove..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCat('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              selectedCat === 'ALL'
                ? 'bg-amber-500 text-neutral-950'
                : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800'
            }`}
          >
            All Categories ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                selectedCat === cat.id
                  ? 'bg-amber-500 text-neutral-950'
                  : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Item Stock Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const category = categories.find((c) => c.id === item.categoryId);
          const isAvailable = item.isAvailable;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 shadow-md ${
                isAvailable
                  ? 'bg-neutral-900 border-neutral-800'
                  : 'bg-neutral-950/80 border-rose-500/30 opacity-75'
              }`}
            >
              <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover bg-neutral-950 shrink-0 border border-neutral-800"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                    <span className="font-mono font-bold text-amber-400 text-xs shrink-0">
                      {formatCurrency(item.basePriceCents)}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">
                    {category?.name || 'Dish'} • {item.prepTimeMinutes}m prep
                  </span>

                  {/* Dietary badges */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.dietaryFlags.map((flag) => (
                      <span
                        key={flag}
                        className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300"
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
              </div>

              {/* Action Buttons: 1-Click Stock Toggle & Delete */}
              <div className="flex flex-col items-end space-y-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleAvailability(item.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors ${
                    isAvailable
                      ? 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-neutral-950 border border-emerald-500/40'
                      : 'bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40'
                  }`}
                  aria-label={`Toggle availability for ${item.name}`}
                >
                  {isAvailable ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>In Stock</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Out of Stock</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to remove '${item.name}' from the menu permanently?`)) {
                      onDeleteItem(item.id);
                    }
                  }}
                  className="text-neutral-500 hover:text-rose-400 p-1 text-xs flex items-center space-x-1 transition-colors"
                  title="Delete dish from menu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Remove</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Dish Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-neutral-950 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Add New Product / Dish</h2>
                  <p className="text-xs text-neutral-400">Add directly to today's available menu</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
                aria-label="Close add dish modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name and Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Dish Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Garlic Butter Naan & Dal Makhani"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Price ($) <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="1"
                    required
                    value={priceDollars}
                    onChange={(e) => setPriceDollars(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 font-mono font-bold focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Category & Prep Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Menu Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-500 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={prepTimeMinutes}
                    onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Description / Ingredients
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Fresh culinary ingredients, house special marinade, garnishes..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 focus:outline-none focus:border-amber-500 text-xs resize-none"
                />
              </div>

              {/* Dietary Tags */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Dietary Badges
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'HALAL', 'SPICY', 'CHEF_SPECIAL'] as DietaryFlag[]).map((flag) => {
                    const isSelected = dietaryFlags.includes(flag);
                    return (
                      <button
                        type="button"
                        key={flag}
                        onClick={() => toggleDietaryFlag(flag)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          isSelected
                            ? 'bg-amber-500 text-neutral-950 font-bold'
                            : 'bg-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {flag.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Product Photo Preset
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setImageUrl(preset.url)}
                      className={`relative rounded-xl overflow-hidden aspect-square border transition-all ${
                        imageUrl === preset.url
                          ? 'border-amber-500 ring-2 ring-amber-500/30'
                          : 'border-neutral-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white py-0.5 truncate px-1">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-300 hover:text-white font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20"
                >
                  Publish Dish to Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
