/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Utensils,
  Smartphone,
  ChefHat,
  LayoutGrid,
  Banknote,
  BarChart3,
  Printer,
  Radio,
  Lock,
  SunMedium,
  LogOut,
  Eye,
  Shield,
} from 'lucide-react';
import { UserRole } from '../../types/index.ts';

export type ActiveTab = 'customer' | 'stock' | 'kds' | 'floor' | 'cashier' | 'analytics' | 'print_all';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTableNumber?: string;
  pendingCashCount: number;
  activeKdsCount: number;
  isLiveConnected: boolean;
  onOpenLoginModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  userRole,
  onRoleChange,
  activeTableNumber = '4',
  pendingCashCount,
  activeKdsCount,
  isLiveConnected,
  onOpenLoginModal,
}) => {
  const isCustomer = userRole === 'PUBLIC_DINER';

  return (
    <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Brand & Context Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 shadow-md shadow-amber-500/20 font-bold">
            <Utensils className="w-5 h-5 text-neutral-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight text-white">The Grand Truffle Bistro</span>
              {!isCustomer && (
                <span className="text-[10px] font-mono uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                  {userRole} PORTAL
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              {isCustomer ? 'Artisanal Table-Side Dining Experience' : 'Management & Kitchen Operations OS'}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          {/* Live Sync badge */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-neutral-800/80 border border-neutral-700/60 text-xs text-neutral-300">
            <Radio
              className={`w-3.5 h-3.5 ${
                isLiveConnected ? 'text-emerald-400 animate-pulse' : 'text-neutral-500'
              }`}
            />
            <span className="font-mono text-[11px]">
              {isLiveConnected ? 'LIVE SYNC' : 'SYNCING'}
            </span>
          </div>

          {/* Customer View: Discreet Staff Login button */}
          {isCustomer ? (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/70 text-xs font-semibold transition-colors shadow-sm"
              aria-label="Hotel Staff Login"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Staff / Manager Login</span>
            </button>
          ) : (
            /* Manager / Staff View: Role Switcher & Back to Website button */
            <div className="flex items-center space-x-2">
              <select
                value={userRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-medium"
                aria-label="Active Staff Position"
              >
                <option value="MANAGER">Hotel Manager</option>
                <option value="OWNER">Hotel Owner</option>
                <option value="KITCHEN">Kitchen Staff</option>
                <option value="CASHIER">Cashier Desk</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  onRoleChange('PUBLIC_DINER');
                  onTabChange('customer');
                }}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium border border-neutral-700"
                title="Switch back to Customer Website view"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Guest Website</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Module Navigation Tabs (ONLY SHOWN TO STAFF/MANAGER/OWNER) */}
      {!isCustomer && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-neutral-800/80">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar" aria-label="Staff Modules">
            {/* Morning Stock & Product Add/Remove */}
            <button
              onClick={() => onTabChange('stock')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'stock'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <SunMedium className="w-4 h-4 text-amber-400" />
              <span>Morning Menu & Daily Stock</span>
            </button>

            {/* Kitchen Display */}
            <button
              onClick={() => onTabChange('kds')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'kds'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Kitchen Display (KDS)</span>
              {activeKdsCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'kds' ? 'bg-neutral-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {activeKdsCount}
                </span>
              )}
            </button>

            {/* Floor & Tables */}
            <button
              onClick={() => onTabChange('floor')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'floor'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Floor & Table QRs</span>
            </button>

            {/* Cashier Desk */}
            <button
              onClick={() => onTabChange('cashier')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors relative ${
                activeTab === 'cashier'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Cashier Desk</span>
              {pendingCashCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {pendingCashCount} Cash Due
                </span>
              )}
            </button>

            {/* Reports & Audit */}
            <button
              onClick={() => onTabChange('analytics')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reports & Audit</span>
            </button>

            {/* Print QR Stands */}
            <button
              onClick={() => onTabChange('print_all')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'print_all'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Print Table Stands</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
