import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { AdminNotification } from '../../types/admin';
import { AdminTab } from './AdminLayout';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Building2,
  Users,
  Check,
  RefreshCw
} from 'lucide-react';

interface AdminNotificationsProps {
  onNavigate: (tab: AdminTab) => void;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getNotifications();
      setNotifications(res.notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      const res = await adminApi.markNotificationRead(id);
      setNotifications(res.notifications);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await adminApi.markAllNotificationsRead();
      setNotifications(res.notifications);
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'fraud':
        return <ShieldAlert className="w-5 h-5 text-red-600" />;
      case 'verification':
        return <Building2 className="w-5 h-5 text-purple-600" />;
      case 'user':
        return <Users className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            System Alerts & Administrative Notifications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time triggers on deed submissions, seller subscriptions, fraud flags, and inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Mark All as Read
          </button>
          <button
            onClick={fetchNotifs}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-[#77101F]/30 border-t-[#77101F] rounded-full animate-spin mx-auto mb-2" />
            Loading alerts...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs">
            No notifications in your inbox.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                !notif.isRead ? 'bg-amber-50/30' : 'hover:bg-slate-50/60'
              }`}
            >
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shrink-0 shadow-2xs">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                    {notif.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 shrink-0 whitespace-nowrap">
                    {notif.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {notif.description}
                </p>

                <div className="mt-3 flex items-center gap-3 text-xs">
                  {notif.linkModule && (
                    <button
                      onClick={() => onNavigate(notif.linkModule as AdminTab)}
                      className="text-[#77101F] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      Inspect Module <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
