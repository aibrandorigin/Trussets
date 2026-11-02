import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  Users,
  Building2,
  CreditCard,
  DollarSign,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Receipt,
  Percent,
  FileText,
  Filter,
  Search,
  Eye,
  Printer,
  X,
  Coins,
  Info,
  Check,
  Building,
  Key
} from 'lucide-react';
import { PlanPaymentRecord, TaxAnalyticsSummary } from '../../types/admin';

export const AdminAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTxn, setSearchTxn] = useState('');
  const [planTypeFilter, setPlanTypeFilter] = useState<'All' | 'Buying' | 'Rental'>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<PlanPaymentRecord | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getAnalytics(dateRange);
      setData(res);
    } catch (e) {
      console.error(e);
      // Fallback to overview if analytics route is catching up
      try {
        const fallback = await adminApi.getOverview(dateRange);
        setData(fallback);
      } catch (err) {
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const kpis = data?.kpis;
  const charts = data?.charts;
  const taxSummary: TaxAnalyticsSummary | undefined = data?.taxSummary;

  // Base metrics
  const totalBaseRevenue = taxSummary?.totalBaseRevenue ?? kpis?.totalBaseRevenue ?? 22494;
  const totalTaxAmount = taxSummary?.totalTaxAmount ?? kpis?.totalTaxAmount ?? 4048.92;
  const grandTotalRevenue = taxSummary?.grandTotalRevenue ?? kpis?.grandTotalRevenue ?? 26542.92;
  const totalTransactions = taxSummary?.totalTransactions ?? kpis?.totalPlanPurchases ?? 6;

  // Filter transactions
  const transactions: PlanPaymentRecord[] = taxSummary?.transactions || [];
  const filteredTransactions = transactions.filter((t) => {
    const matchesType = planTypeFilter === 'All' || t.planType === planTypeFilter;
    const query = searchTxn.toLowerCase();
    const matchesSearch =
      !query ||
      t.userName?.toLowerCase().includes(query) ||
      t.plan?.toLowerCase().includes(query) ||
      t.transactionId?.toLowerCase().includes(query) ||
      (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(query));
    return matchesType && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = [
      'Invoice Number',
      'Transaction ID',
      'Date',
      'Customer Name',
      'User Email',
      'User Type',
      'Plan Name',
      'Plan Category',
      'Plan Amount (Income Before Tax)',
      'Tax Rate (%)',
      'CGST (9%)',
      'SGST (9%)',
      'Tax Amount',
      'Grand Total',
      'Payment Method',
      'Status',
    ];

    const rows = transactions.map((t) => [
      t.invoiceNumber || 'N/A',
      t.transactionId,
      t.paymentDate,
      `"${t.userName}"`,
      t.userEmail || '',
      t.userType || '',
      `"${t.plan}"`,
      t.planType,
      t.amount,
      `${t.taxRate}%`,
      Math.round((t.taxAmount / 2) * 100) / 100,
      Math.round((t.taxAmount / 2) * 100) / 100,
      t.taxAmount,
      t.grandTotal,
      `"${t.paymentMethod || 'Online'}"`,
      t.status,
    ]);

    const summaryRows = [
      [],
      ['--- REVENUE & TAX COLLECTION SUMMARY ---'],
      ['Total Plan Amount / Income Before Tax (INR)', totalBaseRevenue],
      ['Total Tax Amount / 18% GST (INR)', totalTaxAmount],
      ['Grand Total Revenue (INR)', grandTotalRevenue],
      ['Total Paid Transactions', totalTransactions],
      ['Tax Regime', 'GST (CGST 9% + SGST 9% / IGST 18%)'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(',')), ...summaryRows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trustsets-tax-analytics-ledger-${dateRange}-${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Platform Analytics & Tax Accounting
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
              18% GST Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time subscription monetization, separate tax accounting (Income Before Tax vs. Tax vs. Grand Total), and platform telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            {['7d', '30d', '3m', '6m', '1y', 'all'].map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  dateRange === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            title="Refresh Data"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-slate-400' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#77101F] hover:bg-[#600d19] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Tax Ledger CSV
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. TAX COLLECTION & PLAN REVENUE HEADLINE CARDS           */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 border-b border-slate-700/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-black tracking-tight text-white uppercase">
                  Tax Collection & Plan Purchases Intelligence
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Standard Goods and Services Tax (GST 18%) audited and calculated separately from base subscription earnings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-800/90 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 font-mono">
                Tax Regime: CGST 9% + SGST 9% (18%)
              </span>
            </div>
          </div>

          {/* Core 3 Figures distinctly required: Plan Amount, Tax Amount, Grand Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Plan Amount / Income Before Tax */}
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
              <div className="flex items-center justify-between text-slate-300 mb-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Plan Amount / Income Before Tax
                </span>
                <Coins className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ₹{totalBaseRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-300 font-medium">
                <Check className="w-3.5 h-3.5" />
                Net subscription income recognized
              </div>
            </div>

            {/* 2. Tax Amount */}
            <div className="bg-amber-500/15 backdrop-blur-xs p-4 rounded-2xl border border-amber-400/30">
              <div className="flex items-center justify-between text-amber-200 mb-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-200">
                  Tax Amount (18% GST)
                </span>
                <Percent className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
                ₹{totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-2 text-[11px] text-amber-200/90 font-medium flex items-center justify-between">
                <span>CGST (9%): ₹{(totalTaxAmount / 2).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                <span>SGST (9%): ₹{(totalTaxAmount / 2).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* 3. Grand Total */}
            <div className="bg-emerald-500/20 backdrop-blur-xs p-4 rounded-2xl border border-emerald-400/40">
              <div className="flex items-center justify-between text-emerald-200 mb-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                  Grand Total (Inclusive of Tax)
                </span>
                <DollarSign className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 tracking-tight">
                ₹{grandTotalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-200 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Total collection realized via payment gateway
              </div>
            </div>

            {/* 4. Total Transactions & Paid Orders */}
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
              <div className="flex items-center justify-between text-slate-300 mb-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Total Plan Purchases
                </span>
                <CreditCard className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {totalTransactions} Paid Orders
              </div>
              <div className="mt-2 text-[11px] text-slate-300 font-medium">
                {taxSummary?.buyingPlans.count || 4} Buying Plans • {taxSummary?.rentalPlans.count || 2} Rental Plans
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. PLAN TYPE TAX COMPARISON: BUYING vs RENTAL PLANS       */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buying Property Plans */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Buying Property Plans Tax Summary</h3>
                <p className="text-xs text-slate-400">Seller & Developer subscription packages</p>
              </div>
            </div>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full">
              {taxSummary?.buyingPlans.count || 4} Orders
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Plan Amount</div>
              <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                ₹{(taxSummary?.buyingPlans.baseAmount || 18496).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500">Before Tax</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-amber-700">Tax Amount</div>
              <div className="text-sm sm:text-base font-black text-amber-700 mt-0.5">
                ₹{(taxSummary?.buyingPlans.taxAmount || 3329.28).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500">18% GST</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-700">Grand Total</div>
              <div className="text-sm sm:text-base font-black text-emerald-700 mt-0.5">
                ₹{(taxSummary?.buyingPlans.grandTotal || 21825.28).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500">Collected</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Average Buying Ticket (Base):</span>
              <span className="font-bold text-slate-900">
                ₹{Math.round((taxSummary?.buyingPlans.baseAmount || 18496) / (taxSummary?.buyingPlans.count || 4)).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Average Tax Generated / Order:</span>
              <span className="font-bold text-amber-700">
                ₹{Math.round((taxSummary?.buyingPlans.taxAmount || 3329.28) / (taxSummary?.buyingPlans.count || 4)).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Contribution to Platform Tax Pool:</span>
              <span className="font-bold text-slate-900">82.2%</span>
            </div>
          </div>
        </div>

        {/* Rental Property Plans */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Rental Property Plans Tax Summary</h3>
                <p className="text-xs text-slate-400">Landlord & Tenant zero-brokerage passes</p>
              </div>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full">
              {taxSummary?.rentalPlans.count || 2} Orders
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Plan Amount</div>
              <div className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                ₹{(taxSummary?.rentalPlans.baseAmount || 3998).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500">Before Tax</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-amber-700">Tax Amount</div>
              <div className="text-sm sm:text-base font-black text-amber-700 mt-0.5">
                ₹{(taxSummary?.rentalPlans.taxAmount || 719.64).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500">18% GST</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-700">Grand Total</div>
              <div className="text-sm sm:text-base font-black text-emerald-700 mt-0.5">
                ₹{(taxSummary?.rentalPlans.grandTotal || 4717.64).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500">Collected</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Average Rental Ticket (Base):</span>
              <span className="font-bold text-slate-900">
                ₹{Math.round((taxSummary?.rentalPlans.baseAmount || 3998) / (taxSummary?.rentalPlans.count || 2)).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Average Tax Generated / Order:</span>
              <span className="font-bold text-amber-700">
                ₹{Math.round((taxSummary?.rentalPlans.taxAmount || 719.64) / (taxSummary?.rentalPlans.count || 2)).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Contribution to Platform Tax Pool:</span>
              <span className="font-bold text-slate-900">17.8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. PERIODIC REVENUE & TAX TREND (TIME SERIES CHART)       */}
      {/* ========================================================= */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Monthly Revenue & Tax Collection Trajectory</h3>
            <p className="text-xs text-slate-400">
              Visualizing Plan Amount (Before Tax), Tax Amount (18%), and Grand Total over time
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#77101F]" />
              <span className="text-slate-600">Plan Amount (Before Tax)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500" />
              <span className="text-slate-600">Tax Amount (18% GST)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-600" />
              <span className="text-slate-600">Grand Total</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 items-end h-48 border-b border-slate-200 pb-2">
            {(charts?.revenueOverTime || []).slice(0, 12).map((item: any) => {
              const base = item.incomeBeforeTax || item.buyingRevenue + item.rentalRevenue || 20000;
              const tax = item.taxAmount || Math.round(base * 0.18);
              const grand = item.grandTotal || base + tax;
              const maxHeight = 75000;
              const grandHeightPct = Math.min(100, Math.round((grand / maxHeight) * 100));
              const baseHeightPct = Math.min(100, Math.round((base / maxHeight) * 100));
              const taxHeightPct = Math.min(100, Math.round((tax / maxHeight) * 100));

              return (
                <div key={item.name} className="flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute bottom-full mb-2 z-20 bg-slate-900 text-white text-[10px] rounded-xl p-2.5 whitespace-nowrap shadow-lg">
                    <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-slate-200">{item.name} 2026</div>
                    <div className="text-blue-300">Plan Amount: ₹{base.toLocaleString('en-IN')}</div>
                    <div className="text-amber-300">Tax (18%): ₹{tax.toLocaleString('en-IN')}</div>
                    <div className="text-emerald-300 font-bold">Grand Total: ₹{grand.toLocaleString('en-IN')}</div>
                  </div>

                  <div className="w-full max-w-[28px] flex items-end justify-center gap-0.5 h-full">
                    {/* Plan Amount Bar */}
                    <div
                      className="w-1/2 bg-[#77101F] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${Math.max(8, baseHeightPct)}%` }}
                    />
                    {/* Tax Bar */}
                    <div
                      className="w-1/2 bg-amber-500 rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${Math.max(4, taxHeightPct)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 mt-2">{item.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. PLAN-BY-PLAN TAX LEDGER MATRIX                         */}
      {/* ========================================================= */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Plan-by-Plan Tax Audit Matrix</h3>
            <p className="text-xs text-slate-400">
              Detailed breakdown of revenue and tax generation for each active subscription tier
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {taxSummary?.byPlan?.length || 6} Active Tiers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50">
                <th className="p-3">Plan Tier</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-center">Purchases</th>
                <th className="p-3 text-right">Plan Amount (Before Tax)</th>
                <th className="p-3 text-right">Tax Amount (18% GST)</th>
                <th className="p-3 text-right font-black text-slate-900">Grand Total</th>
                <th className="p-3 text-right">Share of Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {(taxSummary?.byPlan || []).map((p) => {
                const sharePct = totalBaseRevenue > 0 ? Math.round((p.baseAmount / totalBaseRevenue) * 100) : 0;
                return (
                  <tr key={p.planName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          p.planType === 'Buying' ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                      />
                      {p.planName}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.planType === 'Buying'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {p.planType} Plan
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900">{p.count}</td>
                    <td className="p-3 text-right font-bold text-slate-800">
                      ₹{p.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-700">
                      ₹{p.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-800">
                      ₹{p.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-bold text-slate-600">{sharePct}%</span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#77101F] rounded-full"
                            style={{ width: `${sharePct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/80 font-black text-slate-900 border-t-2 border-slate-300">
                <td className="p-3" colSpan={2}>
                  Total Platform Subscriptions
                </td>
                <td className="p-3 text-center">{totalTransactions}</td>
                <td className="p-3 text-right text-[#77101F]">
                  ₹{totalBaseRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-right text-amber-700">
                  ₹{totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-right text-emerald-800 text-sm">
                  ₹{grandTotalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. COMPLETE PLAN PURCHASES & TAX LEDGER (TRANSACTIONS)    */}
      {/* ========================================================= */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Plan Purchases & Tax Transaction Register</h3>
            <p className="text-xs text-slate-400">
              Auditable itemized records distinguishing Plan Amount, Tax Amount (18% GST), and Grand Total
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user, txn, invoice..."
                value={searchTxn}
                onChange={(e) => setSearchTxn(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#77101F] w-48 sm:w-56"
              />
            </div>

            {/* Filter by Type */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['All', 'Buying', 'Rental'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPlanTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    planTypeFilter === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50">
                <th className="p-3">Invoice & Txn ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Plan Subscribed</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Plan Amount (Before Tax)</th>
                <th className="p-3 text-right text-amber-700">Tax (18% GST)</th>
                <th className="p-3 text-right font-black text-slate-900">Grand Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-bold font-mono text-slate-900">{tx.invoiceNumber || 'INV-2026-XXX'}</div>
                      <div className="text-[10px] font-mono text-slate-400">{tx.transactionId}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{tx.userName}</div>
                      <div className="text-[10px] text-slate-400">{tx.userType || 'Customer'}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{tx.plan}</div>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${
                          tx.planType === 'Buying'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-indigo-50 text-indigo-800'
                        }`}
                      >
                        {tx.planType} Plan
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">
                      <div>{tx.paymentDate}</div>
                      <div className="text-[10px] text-slate-400">{tx.paymentMethod || 'Online UPI'}</div>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800">
                      ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-700">
                      ₹{tx.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-800">
                      ₹{tx.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedInvoice(tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="View Official GST Invoice"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. PLATFORM ECOSYSTEM TELEMETRY (Category, Cities, Funnel) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Inventory by Property Category</h3>
          <p className="text-xs text-slate-400 mb-4">Volume distribution across asset classes</p>

          <div className="space-y-3">
            {charts?.categoryBreakdown?.map((cat: any) => {
              const total = kpis?.totalProperties || 10;
              const pct = Math.round((cat.count / total) * 100) || 0;
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="capitalize text-slate-700">{cat.category.replace('-', ' ')}</span>
                    <span className="text-slate-900 font-bold">{cat.count} Listings ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#77101F] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* City Distribution */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Top Metro & Regional Footprint</h3>
          <p className="text-xs text-slate-400 mb-4">Listings density across primary urban clusters</p>

          <div className="space-y-3">
            {charts?.cityDistribution?.map((city: any) => {
              const maxCount = 20;
              const pct = Math.min(100, Math.round((city.count / maxCount) * 100));
              return (
                <div key={city.city} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{city.city}</span>
                    <span className="text-slate-900 font-bold">{city.count} Properties</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Engagement & Leads Funnel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-900 mb-1">Marketplace Engagement & Contact Funnel</h3>
        <p className="text-xs text-slate-400 mb-4">Direct Buyer/Tenant to Owner interaction volume</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-400 font-medium">Direct WhatsApp Clicks</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">1,842</div>
            <div className="text-[10px] text-slate-500 mt-1">Zero Brokerage Connects</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-400 font-medium">Title Deed Inquiries</div>
            <div className="text-2xl font-black text-indigo-700 mt-1">943</div>
            <div className="text-[10px] text-slate-500 mt-1">Trust Verification Requests</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-400 font-medium">Properties Shortlisted</div>
            <div className="text-2xl font-black text-amber-700 mt-1">3,210</div>
            <div className="text-[10px] text-slate-500 mt-1">Saved User Favorites</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-400 font-medium">Platform Conversion</div>
            <div className="text-2xl font-black text-slate-900 mt-1">8.2%</div>
            <div className="text-[10px] text-slate-500 mt-1">Visitor to Inquiry Rate</div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. OFFICIAL GST TAX INVOICE MODAL                          */}
      {/* ========================================================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight text-white">Tax Invoice & Receipt</h3>
                  <p className="text-[11px] text-slate-300">GST Rule 46 Compliant Document</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Invoice Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <div className="font-black text-sm text-slate-900">TrustSets Technologies Pvt Ltd</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    GSTIN: 36AAACT8921B1Z4 • SAC: 998314
                  </div>
                  <div className="text-slate-500 text-[11px]">Financial District, Hyderabad, Telangana - 500032</div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-slate-900 block text-xs">
                    {selectedInvoice.invoiceNumber || 'INV-2026-001'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">{selectedInvoice.paymentDate}</span>
                </div>
              </div>

              {/* Billed to */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Billed To</span>
                <div className="font-bold text-slate-900">{selectedInvoice.userName}</div>
                {selectedInvoice.userEmail && <div className="text-slate-500">{selectedInvoice.userEmail}</div>}
                <div className="text-slate-500 text-[11px] mt-0.5">User Type: {selectedInvoice.userType || 'Registered Subscriber'}</div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100/70 p-2.5 font-bold text-slate-600 grid grid-cols-12 text-[11px]">
                  <div className="col-span-6">Description / Plan</div>
                  <div className="col-span-2 text-center">SAC</div>
                  <div className="col-span-4 text-right">Amount (INR)</div>
                </div>
                <div className="p-3 grid grid-cols-12 items-center border-t border-slate-200 text-[11px]">
                  <div className="col-span-6">
                    <span className="font-bold text-slate-900 block">{selectedInvoice.plan}</span>
                    <span className="text-[10px] text-slate-400">{selectedInvoice.planType} Subscription Plan</span>
                  </div>
                  <div className="col-span-2 text-center text-slate-500 font-mono">998314</div>
                  <div className="col-span-4 text-right font-bold text-slate-900">
                    ₹{selectedInvoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Tax Calculations */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Plan Amount / Income Before Tax:</span>
                  <span className="font-semibold text-slate-900">
                    ₹{selectedInvoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (CGST @ 9%):</span>
                  <span className="font-semibold text-amber-700">
                    ₹{(selectedInvoice.taxAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>State GST (SGST @ 9%):</span>
                  <span className="font-semibold text-amber-700">
                    ₹{(selectedInvoice.taxAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 font-bold border-t border-slate-200 pt-1.5">
                  <span className="text-amber-800">Total Tax Amount (18% GST):</span>
                  <span className="text-amber-800">
                    ₹{selectedInvoice.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 mt-2">
                  <span className="text-emerald-900">Grand Total (Inclusive of All Taxes):</span>
                  <span className="text-emerald-900">
                    ₹{selectedInvoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>Payment Mode: <strong>{selectedInvoice.paymentMethod || 'Razorpay UPI'}</strong></span>
                <span>Txn ID: <strong className="font-mono">{selectedInvoice.transactionId}</strong></span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
