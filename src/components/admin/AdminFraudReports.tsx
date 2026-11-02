import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { FraudReport } from '../../types/admin';
import {
  ShieldAlert,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  ChevronRight,
  Shield,
  UserX,
  Building,
  Calendar,
  Send,
  RefreshCw
} from 'lucide-react';

export const AdminFraudReports: React.FC = () => {
  const [reports, setReports] = useState<FraudReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Details
  const [selectedReport, setSelectedReport] = useState<FraudReport | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getFraudReports();
      setReports(res.reports);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      !search ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.reportedBy.toLowerCase().includes(search.toLowerCase()) ||
      r.reportedUser.toLowerCase().includes(search.toLowerCase()) ||
      r.reportedProperty.toLowerCase().includes(search.toLowerCase()) ||
      r.reportType.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedReport) return;
    try {
      setStatusUpdating(true);
      const res = await adminApi.updateFraudReportStatus(
        selectedReport.id,
        newStatus,
        `Status updated to ${newStatus}`
      );
      setSelectedReport(res.report);
      setReports((prev) => prev.map((r) => (r.id === selectedReport.id ? res.report : r)));
    } catch (e) {
      console.error(e);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !newNote.trim()) return;

    try {
      setIsAddingNote(true);
      const res = await adminApi.addFraudReportNote(selectedReport.id, newNote.trim());
      setSelectedReport(res.report);
      setReports((prev) => prev.map((r) => (r.id === selectedReport.id ? res.report : r)));
      setNewNote('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Fraud & Counterfeit Reports Center
            </h1>
            <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-xs font-black rounded-full">
              Trust & Safety
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Investigate suspicious listings, unauthorized agents, disputed deeds, and deposit scams.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer self-start sm:self-auto"
          title="Refresh Reports"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Report ID, user name, property name, grievance..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:bg-white focus:outline-none"
        >
          <option value="">All Triage Statuses</option>
          <option value="New">New</option>
          <option value="Under Review">Under Review</option>
          <option value="Investigating">Investigating</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
          <option value="Escalated">Escalated</option>
        </select>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-3">Grievance Category</th>
                <th className="py-3 px-3">Reported Entity</th>
                <th className="py-3 px-3">Reported By</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Assigned Officer</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin mx-auto mb-2" />
                    Loading fraud complaints...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    No fraud incidents matching current filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                      {r.id}
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-800 border border-red-100">
                        {r.reportType}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{r.reportedProperty}</div>
                      <div className="text-[10px] text-slate-400">User: {r.reportedUser}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium">{r.reportedBy}</div>
                      <div className="text-[10px] text-slate-400">{r.reporterPhone}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {r.dateReported}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'New'
                            ? 'bg-red-100 text-red-800 animate-pulse'
                            : r.status === 'Escalated'
                            ? 'bg-purple-100 text-purple-800 font-black'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {r.assignedAdmin}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedReport(r);
                          setIsDetailOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Investigation Modal */}
      {isDetailOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Incident Docket #{selectedReport.id}
                </h3>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Status Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Triage Status:</span>
                  <select
                    value={selectedReport.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    disabled={statusUpdating}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                </div>
                <div className="text-[11px] text-slate-400">Officer: {selectedReport.assignedAdmin}</div>
              </div>

              {/* Grievance specifics */}
              <div className="grid grid-cols-2 gap-3 bg-red-50/50 p-3.5 rounded-2xl border border-red-100">
                <div>
                  <span className="text-slate-400 font-medium">Issue Type</span>
                  <div className="font-bold text-red-900">{selectedReport.reportType}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Reported Date</span>
                  <div className="font-bold text-slate-800">{selectedReport.dateReported}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Target Property</span>
                  <div className="font-bold text-slate-900">{selectedReport.reportedProperty}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Target User</span>
                  <div className="font-bold text-slate-900">{selectedReport.reportedUser}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1">
                  Complainant Narrative
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-700 border border-slate-200 leading-relaxed">
                  {selectedReport.description}
                </div>
              </div>

              {/* Evidence */}
              {selectedReport.evidence && (
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1">
                    Submitted Evidence & Exhibits
                  </h4>
                  <div className="p-3 bg-amber-50/60 rounded-xl text-amber-900 border border-amber-200 font-mono text-[11px]">
                    {selectedReport.evidence}
                  </div>
                </div>
              )}

              {/* Internal Notes Thread */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-2">
                  Internal Investigation Audit Notes ({selectedReport.internalNotes?.length || 0})
                </h4>

                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {selectedReport.internalNotes?.map((note) => (
                    <div
                      key={note.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-bold text-slate-700">{note.admin}</span>
                        <span>{note.date}</span>
                      </div>
                      <div className="text-slate-800">{note.note}</div>
                    </div>
                  ))}
                </div>

                {/* Add Note Input */}
                <form onSubmit={handleAddInternalNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Append internal investigator note..."
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isAddingNote || !newNote.trim()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer disabled:opacity-40"
                  >
                    Add Note
                  </button>
                </form>
              </div>
            </div>

            <div className="pt-4 mt-5 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Docket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
