import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Building2, 
  Mail, 
  Phone, 
  Clock, 
  LogOut, 
  ExternalLink, 
  Settings, 
  CheckCircle2,
  Lock
} from 'lucide-react';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: any;
  onNavigateWorkspace?: () => void;
  onNavigateHome?: () => void;
  onLogout?: () => void;
  isInWorkspace?: boolean;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose,
  admin,
  onNavigateWorkspace,
  onNavigateHome,
  onLogout,
  isInWorkspace = false,
}) => {
  if (!isOpen) return null;

  const adminName = admin?.name || 'Platform Administrator';
  const adminEmail = admin?.email || 'admin@trussets.in';
  const adminRoleTitle = admin?.roleTitle || 'Super Administrator';
  const adminDepartment = admin?.department || 'Platform Governance & Trust';
  const adminPhone = admin?.phone || '+91 98490 12345';
  const adminStatus = admin?.status || 'Active';
  const lastLogin = admin?.lastLogin 
    ? new Date(admin.lastLogin).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Active Session';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Top Banner */}
        <div className="bg-gradient-to-r from-[#77101F] via-[#600C18] to-[#450811] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close Profile Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 font-black text-2xl flex items-center justify-center shadow-lg ring-4 ring-white/20 shrink-0">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <ShieldCheck className="w-3 h-3 text-amber-300" />
                  {adminRoleTitle}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {adminStatus}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1 truncate">{adminName}</h3>
              <p className="text-xs text-red-200/90 truncate">{adminDepartment}</p>
            </div>
          </div>
        </div>

        {/* Modal Body Info */}
        <div className="p-6 space-y-4">
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-2 font-medium">
                <Mail className="w-4 h-4 text-slate-400" /> Email ID
              </span>
              <span className="font-bold text-slate-800 select-all">{adminEmail}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-2 font-medium">
                <Phone className="w-4 h-4 text-slate-400" /> Phone
              </span>
              <span className="font-bold text-slate-800">{adminPhone}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4 text-slate-400" /> Last Active
              </span>
              <span className="font-semibold text-slate-700">{lastLogin}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-500 flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4 text-slate-400" /> Clearance Level
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Full Permissions
              </span>
            </div>
          </div>

          {/* Action Links */}
          <div className="space-y-2 pt-1">
            {!isInWorkspace && onNavigateWorkspace && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateWorkspace();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#77101F] hover:bg-[#600C18] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <Building2 className="w-4 h-4 text-amber-300" />
                <span>Open Admin Workspace</span>
              </button>
            )}

            {isInWorkspace && onNavigateHome && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateHome();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-98"
              >
                <ExternalLink className="w-4 h-4 text-slate-600" />
                <span>Switch to Live Marketplace</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out Admin Session</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
