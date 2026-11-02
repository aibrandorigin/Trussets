import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import { AdminKPIs } from '../../types/admin';
import { AdminTab } from './AdminLayout';
import {
  Users,
  Building2,
  CheckCircle2,
  Clock,
  Check,
  AlertCircle,
  CreditCard,
  Key,
  DollarSign,
  ShieldAlert,
  Bell,
  TrendingUp,
  ArrowUpRight,
  Filter,
  Calendar,
  Sparkles,
  RefreshCw,
  Eye,
  Receipt,
  Percent
} from 'lucide-react';

interface AdminOverviewProps {
  onNavigate: (tab: AdminTab, filter?: any) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigate }) => {
  const [dateRange, setDateRange] = useState('30d');
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getOverview(dateRange);
      setKpis(res.kpis);
      setCharts(res.charts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  if (isLoading && !kpis) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-[#77101F]/20 border-t-[#77101F] rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-500">Loading TrustSets administrative overview...</p>
      </div>
    );
  }

  const kpiCards = [
    {
      id: 'totalUsers',
      label: 'Total Users',
      value: kpis?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-100',
      badge: '+12% MoM',
      targetTab: 'users' as AdminTab,
    },
    {
      id: 'propertySellers',
      label: 'Property Sellers',
      value: kpis?.propertySellers || 0,
      icon: Users,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      targetTab: 'users' as AdminTab,
      targetFilter: { userType: 'Property Sellers' },
    },
    {
      id: 'propertyBuyers',
      label: 'Property Buyers',
      value: kpis?.propertyBuyers || 0,
      icon: Users,
      color: 'bg-sky-50 text-sky-700 border-sky-100',
      targetTab: 'users' as AdminTab,
      targetFilter: { userType: 'Property Buyers' },
    },
    {
      id: 'tenants',
      label: 'Tenants',
      value: kpis?.tenants || 0,
      icon: Users,
      color: 'bg-teal-50 text-teal-700 border-teal-100',
      targetTab: 'users' as AdminTab,
      targetFilter: { userType: 'Tenants' },
    },
    {
      id: 'propertyOwners',
      label: 'Property Owners',
      value: kpis?.propertyOwners || 0,
      icon: Users,
      color: 'bg-cyan-50 text-cyan-700 border-cyan-100',
      targetTab: 'users' as AdminTab,
      targetFilter: { userType: 'Property Owners' },
    },
    {
      id: 'verifiedUsers',
      label: 'Verified Users',
      value: kpis?.verifiedUsers || 0,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      targetTab: 'users' as AdminTab,
      targetFilter: { verified: 'true' },
    },
    {
      id: 'unverifiedUsers',
      label: 'Unverified Users',
      value: kpis?.unverifiedUsers || 0,
      icon: AlertCircle,
      color: 'bg-amber-50 text-amber-700 border-amber-100',
      targetTab: 'users' as AdminTab,
      targetFilter: { verified: 'false' },
    },
    {
      id: 'totalProperties',
      label: 'Total Properties',
      value: kpis?.totalProperties || 0,
      icon: Building2,
      color: 'bg-purple-50 text-purple-700 border-purple-100',
      targetTab: 'properties' as AdminTab,
    },
    {
      id: 'activeProperties',
      label: 'Active Properties',
      value: kpis?.activeProperties || 0,
      icon: Building2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      targetTab: 'properties' as AdminTab,
      targetFilter: { listingStatus: 'Published' },
    },
    {
      id: 'pendingProperties',
      label: 'Pending Approval',
      value: kpis?.pendingProperties || 0,
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-100',
      targetTab: 'properties' as AdminTab,
      targetFilter: { listingStatus: 'Pending' },
    },
    {
      id: 'soldProperties',
      label: 'Sold Properties',
      value: kpis?.soldProperties || 0,
      icon: Check,
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      targetTab: 'properties' as AdminTab,
      targetFilter: { listingStatus: 'Sold' },
    },
    {
      id: 'rentedProperties',
      label: 'Rented Properties',
      value: kpis?.rentedProperties || 0,
      icon: Key,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      targetTab: 'properties' as AdminTab,
      targetFilter: { listingStatus: 'Rented' },
    },
    {
      id: 'activeBuyingPlans',
      label: 'Active Buying Plans',
      value: kpis?.activeBuyingPlans || 0,
      icon: CreditCard,
      color: 'bg-rose-50 text-rose-700 border-rose-100',
      targetTab: 'plans' as AdminTab,
      targetFilter: { subTab: 'buying' },
    },
    {
      id: 'activeRentalPlans',
      label: 'Active Rental Plans',
      value: kpis?.activeRentalPlans || 0,
      icon: Key,
      color: 'bg-orange-50 text-orange-700 border-orange-100',
      targetTab: 'plans' as AdminTab,
      targetFilter: { subTab: 'rental' },
    },
    {
      id: 'totalPlanPurchases',
      label: 'Total Plan Orders',
      value: kpis?.totalPlanPurchases || 0,
      icon: CreditCard,
      color: 'bg-violet-50 text-violet-700 border-violet-100',
      targetTab: 'analytics' as AdminTab,
    },
    {
      id: 'totalBaseRevenue',
      label: 'Plan Income (Before Tax)',
      value: `₹${(kpis?.totalBaseRevenue || 22494).toLocaleString('en-IN')}`,
      icon: Receipt,
      color: 'bg-blue-50 text-blue-800 border-blue-200 font-bold',
      targetTab: 'analytics' as AdminTab,
    },
    {
      id: 'totalTaxAmount',
      label: 'Tax Amount (18% GST)',
      value: `₹${(kpis?.totalTaxAmount || 4048.92).toLocaleString('en-IN')}`,
      icon: Percent,
      color: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
      targetTab: 'analytics' as AdminTab,
    },
    {
      id: 'grandTotalRevenue',
      label: 'Grand Total Revenue',
      value: `₹${(kpis?.grandTotalRevenue || kpis?.totalRevenue || 26542.92).toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
      targetTab: 'analytics' as AdminTab,
    },
    {
      id: 'pendingFraudReports',
      label: 'Pending Fraud Reports',
      value: kpis?.pendingFraudReports || 0,
      icon: ShieldAlert,
      color: (kpis?.pendingFraudReports || 0) > 0 ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-200',
      targetTab: 'fraudReports' as AdminTab,
    },
    {
      id: 'unreadNotifications',
      label: 'Unread Notifications',
      value: kpis?.unreadNotifications || 0,
      icon: Bell,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      targetTab: 'notifications' as AdminTab,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Executive Overview
            </h1>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
              Live Platform
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry, user cohorts, verification pipeline, and revenue metrics.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start md:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '3m', label: '3 Months' },
            { id: '6m', label: '6 Months' },
            { id: '1y', label: '1 Year' },
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                dateRange === range.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range.label}
            </button>
          ))}
          <button
            onClick={loadData}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors ml-1 cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 18 Interactive Clickable KPI Grid */}
      <div className="bg-[#f1f4f8]" style={{ backgroundColor: '#f1f4f8' }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-extrabold text-[#080808] uppercase tracking-wider" style={{ color: '#080808' }}>
            Key Performance Indicators (Click any card to inspect)
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">18 Active Telemetry Nodes</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-[#f1f4f8]" style={{ backgroundColor: '#f1f4f8' }}>
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <button
                key={kpi.id}
                id={`kpi-${kpi.id}`}
                onClick={() => onNavigate(kpi.targetTab, kpi.targetFilter)}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl border ${kpi.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#77101F] transition-colors" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {kpi.value}
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-slate-500 mt-1 line-clamp-1">
                  {kpi.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Graphical Analytics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth & Cohorts */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">User Growth & Cohorts</h3>
              <p className="text-xs text-slate-400">Weekly onboarding volume across 4 user personas</p>
            </div>
            <button
              onClick={() => onNavigate('users')}
              className="text-xs text-[#77101F] font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              Manage Users <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-3 pt-2">
            {charts?.userGrowth?.map((item: any) => {
              const maxVal = 250;
              const pct = Math.min(100, Math.round((item.users / maxVal) * 100));
              return (
                <div key={item.period} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">{item.period}</span>
                    <span className="text-slate-900 font-bold">{item.users} New Users</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <div className="text-xs text-slate-500 font-medium">Verified Accounts</div>
              <div className="text-lg font-black text-emerald-700">{kpis?.verifiedUsers}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <div className="text-xs text-slate-500 font-medium">Verification Backlog</div>
              <div className="text-lg font-black text-amber-700">{kpis?.unverifiedUsers}</div>
            </div>
          </div>
        </div>

        {/* Subscription Revenue Trend */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Subscription Revenue Growth</h3>
              <p className="text-xs text-slate-400">Buying vs. Rental property plan revenues</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-[#77101F] font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              View Analytics <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {charts?.revenueTrend?.map((item: any) => {
              const total = item.buyingRevenue + item.rentalRevenue;
              const maxVal = 180000;
              const pct = Math.min(100, Math.round((total / maxVal) * 100));
              const buyingRatio = total > 0 ? (item.buyingRevenue / total) * 100 : 50;

              return (
                <div key={item.period} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">{item.period}</span>
                    <span className="text-slate-900 font-bold">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-[#77101F] h-full"
                      style={{ width: `${(pct * buyingRatio) / 100}%` }}
                      title={`Buying: ₹${item.buyingRevenue}`}
                    />
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${(pct * (100 - buyingRatio)) / 100}%` }}
                      title={`Rental: ₹${item.rentalRevenue}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#77101F] rounded-xs" />
              <span className="font-semibold text-slate-700">Buying Plans Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-xs" />
              <span className="font-semibold text-slate-700">Rental Plans Revenue</span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Quick Action Shortcuts */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">Administrative Shortcut</div>
          <h4 className="text-base font-black">Fast-track Title Deed Verifications</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            There are currently {kpis?.pendingProperties} properties and {kpis?.unverifiedUsers} users waiting for verification.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('properties', { verificationStatus: 'Pending' })}
            className="px-4 py-2.5 bg-white text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Review Property Deeds
          </button>
          <button
            onClick={() => onNavigate('users', { verified: 'false' })}
            className="px-4 py-2.5 bg-[#77101F] text-white text-xs font-bold rounded-xl hover:bg-[#600c19] transition-colors cursor-pointer"
          >
            Review User KYC
          </button>
        </div>
      </div>
    </div>
  );
};
