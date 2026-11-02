import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { AuditLogItem } from '../../types/admin';
import {
  History,
  Search,
  Shield,
  Clock,
  RefreshCw,
  Terminal
} from 'lucide-react';

const toDisplayText = (val: unknown, fallback = '—'): string => {
  if (typeof val === 'string') return val.trim() || fallback;
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return fallback;
    }
  }
  return String(val);
};

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getAuditLogs();
      setLogs(Array.isArray(res?.logs) ? res.logs : []);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const query = search.trim().toLowerCase();
  const filteredLogs = (Array.isArray(logs) ? logs : []).filter((l) => {
    if (!query) return true;
    const admin = toDisplayText(l?.admin, '').toLowerCase();
    const action = toDisplayText(l?.action, '').toLowerCase();
    const moduleName = toDisplayText(l?.module, '').toLowerCase();
    const recordAffected = toDisplayText(l?.recordAffected, '').toLowerCase();
    const ip = toDisplayText(l?.ip, '').toLowerCase();
    return (
      admin.includes(query) ||
      action.includes(query) ||
      moduleName.includes(query) ||
      recordAffected.includes(query) ||
      ip.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Administrative Audit Trail
            </h1>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
              Immutable Logs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident logs of all administrative verifications, plan reorderings, and account mutations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer self-start sm:self-auto"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search filter */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter audit entries by admin, action, module, or affected record..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchLogs}
            className="px-3 py-1 bg-white border border-red-200 rounded-lg text-red-700 font-bold hover:bg-red-100 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Administrator</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Action Executed</th>
                <th className="py-3 px-3">Record / Entity</th>
                <th className="py-3 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#77101F]/30 border-t-[#77101F] rounded-full animate-spin mx-auto mb-2" />
                    Fetching audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={toDisplayText(log?.id, `audit-row-${idx}`)} className="hover:bg-slate-50/70 transition-colors font-mono text-[11px]">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {toDisplayText(log?.timestamp)}
                    </td>
                    <td className="py-3 px-3 font-sans font-bold text-slate-900">
                      {toDisplayText(log?.admin, 'Admin')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-sans text-[10px] font-bold">
                        {toDisplayText(log?.module, 'System')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans font-semibold text-slate-800">
                      {toDisplayText(log?.action)}
                    </td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[200px]">
                      {toDisplayText(log?.recordAffected)}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {typeof log?.ip === 'string' && log.ip.trim() ? log.ip : '127.0.0.1'}
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
