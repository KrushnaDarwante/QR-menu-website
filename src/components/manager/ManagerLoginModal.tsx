/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { UserRole } from '../../types/index.ts';

interface ManagerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: UserRole) => void;
}

export const ManagerLoginModal: React.FC<ManagerLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('MANAGER');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: 1234
    if (pin.trim() === '1234' || pin.trim() === '0000' || pin.trim() === '') {
      onLoginSuccess(selectedRole);
      onClose();
    } else {
      setError('Incorrect staff PIN. (Hint: Default PIN is 1234)');
    }
  };

  const handleQuickDemoAccess = (role: UserRole) => {
    onLoginSuccess(role);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Hotel Staff Portal</h2>
              <p className="text-xs text-neutral-400">Restricted to Hotel Manager & Owner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1"
            aria-label="Close portal dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Select Position
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="MANAGER">Hotel Manager</option>
              <option value="OWNER">Hotel Owner / GM</option>
              <option value="KITCHEN">Head Chef / Kitchen</option>
              <option value="CASHIER">Front Cashier Desk</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Enter Staff Security PIN
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN (Default: 1234)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono tracking-widest text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-amber-500/10"
          >
            Authenticate & Open Portal
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="pt-2 border-t border-neutral-800/80 space-y-2">
          <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block text-center">
            Quick Testing Access
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoAccess('MANAGER')}
              className="py-1.5 px-2 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded-lg text-[11px] font-semibold border border-neutral-800 transition-colors"
            >
              Log in as Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoAccess('OWNER')}
              className="py-1.5 px-2 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded-lg text-[11px] font-semibold border border-neutral-800 transition-colors"
            >
              Log in as Owner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
