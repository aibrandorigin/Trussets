import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { HelpInquiry } from '../../types/admin';
import {
  HelpCircle,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Trash2,
  MessageSquare,
  User,
  FileText,
  Save,
} from 'lucide-react';

export const AdminInquiries: React.FC = () => {
  const [inquiries, setInquiries] = useState<HelpInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<HelpInquiry | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchInquiries = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getHelpInquiries();
      setInquiries(res.inquiries || []);
    } catch (e) {
      console.error('Failed fetching inquiries:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const filtered = inquiries.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.fullName.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      item.subject.toLowerCase().includes(q) ||
      item.message.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, status: HelpInquiry['status']) => {
    try {
      setIsSaving(true);
      const res = await adminApi.updateHelpInquiry(id, { status });
      setInquiries((prev) => prev.map((item) => (item.id === id ? res.inquiry : item)));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(res.inquiry);
      }
    } catch (e) {
      console.error('Failed updating inquiry status:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;
    try {
      setIsSaving(true);
      const res = await adminApi.updateHelpInquiry(selectedInquiry.id, {
        adminNotes: notesDraft,
      });
      setInquiries((prev) =>
        prev.map((item) => (item.id === selectedInquiry.id ? res.inquiry : item))
      );
      setSelectedInquiry(res.inquiry);
    } catch (e) {
      console.error('Failed saving notes:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteHelpInquiry(id);
      setInquiries((prev) => prev.filter((item) => item.id !== id));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
    } catch (e) {
      console.error('Failed deleting inquiry:', e);
    }
  };

  const getStatusBadge = (status: HelpInquiry['status']) => {
    switch (status) {
      case 'New':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'In Progress':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Closed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const newCount = inquiries.filter((i) => i.status === 'New').length;
  const inProgressCount = inquiries.filter((i) => i.status === 'In Progress').length;
  const resolvedCount = inquiries.filter((i) => i.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Help Center Inquiries
            </h1>
            {newCount > 0 && (
              <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-xs font-black rounded-full">
                {newCount} New
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            View and respond to customer inquiries submitted through the public Help Center form.
          </p>
        </div>

        <button
          onClick={fetchInquiries}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer self-start sm:self-auto"
          title="Refresh Inquiries"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Inquiries
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{inquiries.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-red-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
            New / Pending
          </div>
          <div className="text-2xl font-black text-red-700 mt-1">{newCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
            In Progress
          </div>
          <div className="text-2xl font-black text-amber-800 mt-1">{inProgressCount}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Resolved
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email, subject, or message..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Inquiries List & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={selectedInquiry ? 'lg:col-span-7 space-y-3' : 'lg:col-span-12 space-y-3'}>
          {isLoading ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center text-xs text-slate-400">
              Loading Help Center inquiries...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No inquiries found</div>
              <p className="text-xs text-slate-400">
                When users submit the Help Center inquiry form, their messages will appear here.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedInquiry(item);
                  setNotesDraft(item.adminNotes || '');
                }}
                className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer ${
                  selectedInquiry?.id === item.id
                    ? 'border-[#77101F] ring-2 ring-[#77101F]/10 shadow-sm'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        {item.fullName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{item.id}</span>
                    </div>
                    <div className="text-xs font-bold text-[#77101F] mt-0.5">{item.subject}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-[#77101F]" />
                      {item.phone}
                    </span>
                    {item.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {item.email}
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    {item.createdAt}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Inquiry Detail Drawer / Card */}
        {selectedInquiry && (
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5 sticky top-20">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  {selectedInquiry.id} • {selectedInquiry.createdAt}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  {selectedInquiry.fullName}
                </h3>
                <p className="text-xs font-bold text-[#77101F] mt-0.5">
                  {selectedInquiry.subject}
                </p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Mobile Phone</div>
                <a
                  href={`tel:${selectedInquiry.phone}`}
                  className="font-mono font-bold text-slate-900 hover:text-[#77101F] mt-0.5 block"
                >
                  {selectedInquiry.phone}
                </a>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Email Address</div>
                <div className="font-semibold text-slate-800 truncate mt-0.5">
                  {selectedInquiry.email || 'Not provided'}
                </div>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Customer Inquiry Message
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedInquiry.message}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Update Inquiry Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['New', 'In Progress', 'Resolved', 'Closed'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleStatusChange(selectedInquiry.id, st)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedInquiry.status === st
                        ? 'bg-[#77101F] text-white border-[#77101F]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Internal Specialist Notes
              </label>
              <textarea
                rows={3}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Add callback outcome or verification notes..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedInquiry.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Inquiry</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
