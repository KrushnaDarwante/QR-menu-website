/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Clock,
  Download,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { AuditLogEntry, Order, Table } from '../../types/index.ts';
import { formatCurrency } from '../../core/pricing.ts';

interface AnalyticsViewProps {
  orders: Order[];
  tables: Table[];
  auditLogs: AuditLogEntry[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ orders, tables, auditLogs }) => {
  const [logFilter, setLogFilter] = useState<string>('ALL');

  // Metrics
  const grossSalesCents = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalCents, 0);

  const netSalesCents = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.subtotalCents, 0);

  const taxesCents = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.taxCents + o.serviceFeeCents, 0);

  const tipsCents = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.tipCents, 0);

  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED').length;
  const occupancyPercent = Math.round((occupiedTables / tables.length) * 100);

  // Payment breakdown
  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
  const onlineOrders = paidOrders.filter((o) => o.paymentMethod === 'ONLINE_GATEWAY');
  const cashOrders = paidOrders.filter((o) => o.paymentMethod === 'CASH');

  const onlineTotalCents = onlineOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const cashTotalCents = cashOrders.reduce((sum, o) => sum + o.totalCents, 0);

  // Filtered audit logs
  const filteredLogs = auditLogs.filter((log) => {
    if (logFilter === 'ALL') return true;
    return log.action.includes(logFilter);
  });

  const exportCsv = () => {
    const headers = ['Order Number', 'Table', 'Status', 'Payment Method', 'Payment Status', 'Total ($)', 'Created At'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.tableNumber,
      o.status,
      o.paymentMethod,
      o.paymentStatus,
      (o.totalCents / 100).toFixed(2),
      o.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `qrdine_sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Analytics Top */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>Operational Reports & Security Audit</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time financial reconciliation and immutable staff audit trail.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2 border border-neutral-700 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Export Sales CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex justify-between items-center text-xs text-neutral-400 font-semibold">
            <span>Gross Sales</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white">
            {formatCurrency(grossSalesCents)}
          </div>
          <div className="text-[11px] text-neutral-400">
            Net: <span className="font-mono text-neutral-200">{formatCurrency(netSalesCents)}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex justify-between items-center text-xs text-neutral-400 font-semibold">
            <span>Taxes & Service</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white">
            {formatCurrency(taxesCents)}
          </div>
          <div className="text-[11px] text-neutral-400">
            Tips: <span className="font-mono text-amber-400">{formatCurrency(tipsCents)}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex justify-between items-center text-xs text-neutral-400 font-semibold">
            <span>Total Orders</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white">
            {orders.length}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            {paidOrders.length} Paid & Settled
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex justify-between items-center text-xs text-neutral-400 font-semibold">
            <span>Table Occupancy</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white">
            {occupancyPercent}%
          </div>
          <div className="text-[11px] text-neutral-400">
            {occupiedTables} of {tables.length} tables seated
          </div>
        </div>
      </div>

      {/* Payment Channel Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Online Gateway Payments (Cards/UPI)</span>
          </div>
          <div className="flex justify-between items-end pt-1">
            <div>
              <span className="text-2xl font-mono font-black text-white">
                {formatCurrency(onlineTotalCents)}
              </span>
              <p className="text-xs text-neutral-400 mt-0.5">{onlineOrders.length} transactions verified via HMAC</p>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/30">
              {paidOrders.length > 0 ? Math.round((onlineOrders.length / paidOrders.length) * 100) : 0}% share
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-white">
            <Banknote className="w-4 h-4 text-emerald-400" />
            <span>Staff-Verified Cash Collections</span>
          </div>
          <div className="flex justify-between items-end pt-1">
            <div>
              <span className="text-2xl font-mono font-black text-white">
                {formatCurrency(cashTotalCents)}
              </span>
              <p className="text-xs text-neutral-400 mt-0.5">{cashOrders.length} cash collections audited</p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">
              {paidOrders.length > 0 ? Math.round((cashOrders.length / paidOrders.length) * 100) : 0}% share
            </span>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-white text-base">Security & Operations Audit Trail</h2>
            <p className="text-xs text-neutral-400">Append-only record of staff actions and state changes.</p>
          </div>

          <div className="flex space-x-1.5 text-xs">
            <button
              onClick={() => setLogFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                logFilter === 'ALL' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setLogFilter('CASH')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                logFilter === 'CASH' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              Cash Only
            </button>
            <button
              onClick={() => setLogFilter('ORDER')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                logFilter === 'ORDER' ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              Order States
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-3 font-bold">Timestamp</th>
                <th className="py-2.5 px-3 font-bold">Role & User</th>
                <th className="py-2.5 px-3 font-bold">Action</th>
                <th className="py-2.5 px-3 font-bold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-neutral-500">
                    No matching audit log entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 15).map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-800/30">
                    <td className="py-2.5 px-3 text-neutral-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-300">
                      <span className="font-bold text-amber-400">{log.userRole}</span> ({log.userId})
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-300 font-sans">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
