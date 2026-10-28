import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  Bookmark,
  Table,
  Lock,
  FileText,
  Package,
  Users,
  Landmark,
  Layers,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { formatINR } from '../lib/utils';
import {
  buildReport,
  getSavedReports,
  saveReportTemplate,
  HARDWARE_CATEGORIES,
} from '../lib/storage';

// Helper to format local calendar date as YYYY-MM-DD without UTC timezone offsets
const formatLocalDate = d => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ReportsPage = () => {
  const [userRole, setUserRole] = useState('admin');

  // Presets & Dates
  const [preset, setPreset] = useState('this_month');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return formatLocalDate(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return formatLocalDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  });

  // Builder Config
  const [reportType, setReportType] = useState('sales'); // 'sales' | 'stock' | 'khata' | 'gst'
  const [groupBy, setGroupBy] = useState('day');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'chart'
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState(() => getSavedReports());

  const applyPreset = p => {
    setPreset(p);
    const now = new Date();
    let s = new Date();
    let e = new Date();

    switch (p) {
      case 'today':
        s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        e = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        e = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'this_week': {
        const day = now.getDay() || 7;
        s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
        e = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 7);
        break;
      }
      case 'last_week': {
        const prevDay = now.getDay() || 7;
        s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - prevDay - 6);
        e = new Date(now.getFullYear(), now.getMonth(), now.getDate() - prevDay);
        break;
      }
      case 'this_month':
        s = new Date(now.getFullYear(), now.getMonth(), 1);
        e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'last_month':
        s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        e = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'this_quarter': {
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        s = new Date(now.getFullYear(), qMonth, 1);
        e = new Date(now.getFullYear(), qMonth + 3, 0);
        break;
      }
      case 'this_fy': {
        const curYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        s = new Date(curYear, 3, 1);
        e = new Date(curYear + 1, 2, 31);
        break;
      }
      default:
        break;
    }

    setStartDate(formatLocalDate(s));
    setEndDate(formatLocalDate(e));
  };

  const reportData = useMemo(() => {
    return buildReport({
      reportType,
      startDate,
      endDate: endDate + 'T23:59:59.999Z',
      groupBy,
      category: categoryFilter || undefined,
      paymentMode: paymentModeFilter || undefined,
    });
  }, [reportType, startDate, endDate, groupBy, categoryFilter, paymentModeFilter]);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    saveReportTemplate({
      title: templateName.trim(),
      reportType,
      preset,
      groupBy,
      categoryFilter,
      paymentModeFilter,
    });
    setSavedTemplates(getSavedReports());
    setTemplateName('');
  };

  const handleLoadTemplate = t => {
    setReportType(t.reportType);
    setGroupBy(t.groupBy || 'day');
    setCategoryFilter(t.categoryFilter || '');
    setPaymentModeFilter(t.paymentModeFilter || '');
    if (t.preset) applyPreset(t.preset);
  };

  const handleExportCSV = () => {
    let rows = [];
    if (reportType === 'sales') {
      rows.push(['Invoice Number', 'Date', 'Customer', 'Items Count', 'Payment Mode', 'Gross (Paise)', 'Tax (Paise)', 'Grand Total (INR)']);
      (reportData.records || []).forEach(r => {
        rows.push([
          r.number,
          r.issuedAt,
          `"${r.partyName}"`,
          r.items?.length || 0,
          r.paymentMode,
          r.totals?.taxableValuePaise || 0,
          (r.totals?.cgstPaise || 0) + (r.totals?.sgstPaise || 0),
          ((r.totals?.grandTotalPaise || 0) / 100).toFixed(2),
        ]);
      });
    } else if (reportType === 'stock') {
      rows.push(['Item Name', 'Category', 'Unit', 'Stock Qty', 'Reorder Level', 'Purchase Rate (INR)', 'Retail Rate (INR)', 'Valuation (INR)']);
      (reportData.records || []).forEach(r => {
        rows.push([
          `"${r.name}"`,
          r.category,
          r.unit,
          r.stockUnits,
          r.reorderUnits,
          (r.purchasePricePaise / 100).toFixed(2),
          (r.retailPricePaise / 100).toFixed(2),
          ((r.stockUnits * r.purchasePricePaise) / 100).toFixed(2),
        ]);
      });
    } else if (reportType === 'khata') {
      rows.push(['Customer Name', 'Mobile', 'Type', 'Price Tier', 'Outstanding Due (INR)']);
      (reportData.records || []).forEach(r => {
        rows.push([
          `"${r.name}"`,
          r.mobile,
          r.type,
          r.priceTier,
          (r.balancePaise / 100).toFixed(2),
        ]);
      });
    } else if (reportType === 'gst') {
      rows.push(['GST Rate %', 'Taxable Turnover (INR)', 'CGST (INR)', 'SGST (INR)', 'Total Tax (INR)']);
      (reportData.records || []).forEach(r => {
        rows.push([
          `${r.rate}%`,
          (r.taxable / 100).toFixed(2),
          (r.cgst / 100).toFixed(2),
          (r.sgst / 100).toFixed(2),
          (((r.cgst + r.sgst)) / 100).toFixed(2),
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bharat_Hardware_${reportType}_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-paper-surface border border-border rounded-panel">
        <Lock className="h-12 w-12 text-accent mb-3" />
        <h2 className="text-lg font-bold text-ink">Restricted Access</h2>
        <p className="text-sm text-ink-muted max-w-md mt-1 mb-4 font-medium">
          Financial reporting, margins, and tax audits require Owner or Admin permissions.
        </p>
        <button
          onClick={() => setUserRole('admin')}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-control hover:bg-primary-hover shadow-sm"
        >
          Switch to Owner / Admin View
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Admin Report Builder
            </h1>
            <span className="bg-paper-sunken border border-border text-ink font-bold text-xs px-2.5 py-0.5 rounded-control">
              Owner Mode
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Real-time analytics, tax summaries, stock valuation, and credit ledgers
          </p>
        </div>

        {/* View Mode & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode 2-Button Segmented Toggle */}
          <div className="inline-flex rounded-control border border-border bg-paper-sunken p-1 text-xs font-semibold shadow-inner gap-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control transition-all ${
                viewMode === 'table'
                  ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                  : 'text-ink-muted hover:text-ink hover:bg-paper'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>Data Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control transition-all ${
                viewMode === 'chart'
                  ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                  : 'text-ink-muted hover:text-ink hover:bg-paper'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Visual Chart</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-border rounded-control bg-paper-surface text-ink hover:bg-paper-sunken shadow-sm transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-control bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ================= REPORT TYPE SEGMENTED TOGGLE BAR ================= */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-paper-sunken border border-border rounded-panel text-xs font-bold shadow-inner">
        {[
          { id: 'sales', label: 'Sales & Revenue Register', icon: FileText },
          { id: 'stock', label: 'Stock Valuation & Status', icon: Package },
          { id: 'khata', label: 'Contractor Credit & Khata Aging', icon: Users },
          { id: 'gst', label: 'GST Tax Breakdown Slabs', icon: Landmark },
        ].map(t => {
          const Icon = t.icon;
          const isActive = reportType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setReportType(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-control transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                  : 'text-ink-muted hover:text-ink font-semibold hover:bg-paper'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Preset Buttons & Date Filters Bar */}
      <div className="bg-paper-surface border border-border rounded-panel p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-ink mr-1 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" /> Quick Period:
          </span>
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'this_week', label: 'This Week' },
            { id: 'last_week', label: 'Last Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'this_quarter', label: 'This Quarter' },
            { id: 'this_fy', label: 'This FY (2026-27)' },
          ].map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`px-3 py-1.5 rounded-control text-xs transition-all font-semibold ${
                preset === p.id
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'bg-paper-sunken border border-border text-ink hover:bg-paper hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date Pickers & Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border">
          <div>
            <label className="block text-xs font-bold text-ink uppercase mb-1">
              Active Report Mode
            </label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="w-full text-xs rounded-control border border-border bg-paper p-2 font-bold text-ink focus:border-primary focus:outline-none"
            >
              <option value="sales">Sales & Revenue Register</option>
              <option value="stock">Inventory Valuation & Stock Status</option>
              <option value="khata">Contractor Credit & Dues Aging</option>
              <option value="gst">GST Tax Breakdown (Slabs 5%, 12%, 18%, 28%)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase mb-1">
              Start Date (From)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setPreset('custom');
              }}
              className="w-full text-xs rounded-control border border-border bg-paper text-ink font-semibold p-2 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase mb-1">
              End Date (To)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setPreset('custom');
              }}
              className="w-full text-xs rounded-control border border-border bg-paper text-ink font-semibold p-2 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase mb-1">
              Filter Category
            </label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full text-xs rounded-control border border-border bg-paper text-ink p-2 font-bold focus:border-primary focus:outline-none"
            >
              <option value="">All Hardware Categories</option>
              {HARDWARE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================= SUMMARY KPI CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {reportType === 'sales' && (
          <>
            <div className="p-4 bg-paper-surface border border-border rounded-panel shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Invoices Recorded</span>
              <div className="text-2xl font-bold mt-1.5 text-ink font-mono">
                {reportData.summary?.totalInvoices || 0}
              </div>
              <span className="text-[11px] text-ink-muted font-medium mt-0.5 block">Issued invoices in range</span>
            </div>
            <div className="p-4 bg-paper-surface border border-border rounded-panel shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Taxable Sales</span>
              <div className="text-2xl font-bold mt-1.5 font-mono tabular-nums text-ink">
                {formatINR(reportData.summary?.totalGrossPaise || 0)}
              </div>
              <span className="text-[11px] text-ink-muted font-medium mt-0.5 block">Turnover before GST</span>
            </div>
            <div className="p-4 bg-paper-surface border border-border rounded-panel shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Total GST Collected</span>
              <div className="text-2xl font-bold mt-1.5 font-mono tabular-nums text-primary font-bold">
                {formatINR(reportData.summary?.totalTaxPaise || 0)}
              </div>
              <span className="text-[11px] text-primary font-bold mt-0.5 block">CGST + SGST collected</span>
            </div>
            <div className="p-4 bg-paper-surface border border-border rounded-panel shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Grand Net Revenue</span>
              <div className="text-2xl font-bold mt-1.5 font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-bold">
                {formatINR(reportData.summary?.totalNetPaise || 0)}
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5 block">Total billing volume</span>
            </div>
          </>
        )}

        {reportType === 'stock' && (
          <>
            <div className="p-4 bg-paper-surface border border-border rounded-panel shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">SKUs Catalogued</span>
              <div className="text-2xl font-bold mt-1.5 text-ink font-mono">
                {reportData.summary?.totalUniqueItems || 0}
              </div>
              <span className="text-[11px] text-ink-muted font-medium mt-0.5 block">Active stock items</span>
            </div>
            <div className="p-4 bg-paper-surface border border-border rounded-panel shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Total Units in Shop</span>
              <div className="text-2xl font-bold mt-1.5 font-mono font-bold text-ink">
                {reportData.summary?.totalItemsCount || 0}
              </div>
              <span className="text-[11px] text-ink-muted font-medium mt-0.5 block">Physical unit quantity</span>
            </div>
            <div className="p-4 bg-paper-surface border border-border rounded-panel col-span-2 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Total Inventory Valuation (Cost)</span>
              <div className="text-2xl font-bold mt-1.5 font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-bold">
                {formatINR(reportData.summary?.totalValuationPaise || 0)}
              </div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5 block">Asset value based on purchase rates</span>
            </div>
          </>
        )}

        {reportType === 'khata' && (
          <>
            <div className="p-4 bg-paper-surface border border-border rounded-panel col-span-2 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Contractors with Outstanding Dues</span>
              <div className="text-2xl font-bold mt-1.5 text-ink font-mono">
                {reportData.summary?.totalContractorsWithDue || 0} Contractors
              </div>
              <span className="text-[11px] text-ink-muted font-medium mt-0.5 block">Active credit ledger accounts</span>
            </div>
            <div className="p-4 bg-paper-surface border border-border rounded-panel col-span-2 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Total Credit Receivables (Pending Due)</span>
              <div className="text-2xl font-bold mt-1.5 font-mono tabular-nums text-rose-700 dark:text-rose-400 font-bold">
                {formatINR(reportData.summary?.totalDuesPaise || 0)}
              </div>
              <span className="text-[11px] text-rose-700 dark:text-rose-400 font-bold mt-0.5 block">Outstanding balance to be collected</span>
            </div>
          </>
        )}

        {reportType === 'gst' && (
          <>
            <div className="p-4 bg-paper-surface border border-border rounded-panel col-span-2 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Total Taxable Turnover</span>
              <div className="text-2xl font-bold mt-1.5 font-mono tabular-nums text-ink">
                {formatINR(reportData.summary?.totalTaxable || 0)}
              </div>
              <span className="text-[11px] text-ink-muted font-medium mt-0.5 block">Aggregate sales across GST slabs</span>
            </div>
            <div className="p-4 bg-paper-surface border border-border rounded-panel col-span-2 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Total GST Output Tax (CGST + SGST)</span>
              <div className="text-2xl font-bold mt-1.5 font-mono tabular-nums text-primary font-bold">
                {formatINR(reportData.summary?.totalTax || 0)}
              </div>
              <span className="text-[11px] text-primary font-bold mt-0.5 block">Tax liability for return filing</span>
            </div>
          </>
        )}
      </div>

      {/* ================= VISUAL CHART VIEW ================= */}
      {viewMode === 'chart' && (
        <div className="bg-paper-surface border border-border rounded-panel p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span>Visual Trend Breakdown ({reportType.toUpperCase()})</span>
            </h3>
            <span className="text-xs text-ink-muted font-medium">Top 12 entries</span>
          </div>

          {(!reportData.records || reportData.records.length === 0) ? (
            <div className="py-12 text-center text-xs font-medium text-ink-muted">
              No data points to render for selected period.
            </div>
          ) : (
            <div className="h-72 flex items-end gap-3 pt-8 pb-3 overflow-x-auto">
              {(reportData.records || []).slice(0, 12).map((r, i) => {
                const val =
                  reportType === 'sales'
                    ? r.totals?.grandTotalPaise || 0
                    : reportType === 'stock'
                    ? r.stockUnits * r.purchasePricePaise
                    : reportType === 'khata'
                    ? r.balancePaise
                    : r.total;
                const maxVal = Math.max(
                  ...reportData.records.map(x =>
                    reportType === 'sales'
                      ? x.totals?.grandTotalPaise || 0
                      : reportType === 'stock'
                      ? x.stockUnits * x.purchasePricePaise
                      : reportType === 'khata'
                      ? x.balancePaise
                      : x.total
                  ),
                  1
                );
                const heightPercent = Math.max(10, Math.round((val / maxVal) * 100));

                return (
                  <div key={i} className="flex-1 min-w-[65px] flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[11px] font-mono font-bold text-ink whitespace-nowrap">
                      {formatINR(val)}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-primary hover:bg-primary-hover rounded-t transition-all shadow-sm group-hover:opacity-90"
                    />
                    <span className="text-xs font-bold text-ink truncate w-full text-center mt-1">
                      {reportType === 'sales'
                        ? r.number
                        : reportType === 'stock'
                        ? r.name
                        : reportType === 'khata'
                        ? r.name
                        : `${r.rate}% Slab`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= DATA TABLE VIEW ================= */}
      {viewMode === 'table' && (
        <div className="border border-border rounded-panel bg-paper-surface overflow-x-auto shadow-sm">
          <table className="w-full text-left dense-table">
            <thead>
              {reportType === 'sales' && (
                <tr>
                  <th className="font-bold text-ink">Invoice No</th>
                  <th className="font-bold text-ink">Date & Time</th>
                  <th className="font-bold text-ink">Customer</th>
                  <th className="font-bold text-ink">Payment Mode</th>
                  <th className="text-right font-bold text-ink">Taxable Amount</th>
                  <th className="text-right font-bold text-ink">GST (CGST+SGST)</th>
                  <th className="text-right font-bold text-ink">Grand Total</th>
                </tr>
              )}
              {reportType === 'stock' && (
                <tr>
                  <th className="font-bold text-ink">Item Name & Spec</th>
                  <th className="font-bold text-ink">Category</th>
                  <th className="font-bold text-ink">Stock Qty</th>
                  <th className="font-bold text-ink">Reorder Level</th>
                  <th className="text-right font-bold text-ink">Purchase Rate</th>
                  <th className="text-right font-bold text-ink">Retail Rate</th>
                  <th className="text-right font-bold text-ink">Total Valuation</th>
                </tr>
              )}
              {reportType === 'khata' && (
                <tr>
                  <th className="font-bold text-ink">Customer / Contractor Name</th>
                  <th className="font-bold text-ink">Mobile Phone</th>
                  <th className="font-bold text-ink">Trade Type</th>
                  <th className="font-bold text-ink">Price Tier</th>
                  <th className="text-right font-bold text-ink">Outstanding Khata Balance</th>
                </tr>
              )}
              {reportType === 'gst' && (
                <tr>
                  <th className="font-bold text-ink">GST Slab Rate</th>
                  <th className="text-right font-bold text-ink">Taxable Turnover</th>
                  <th className="text-right font-bold text-ink">CGST Collected</th>
                  <th className="text-right font-bold text-ink">SGST Collected</th>
                  <th className="text-right font-bold text-ink">Total GST Collected</th>
                </tr>
              )}
            </thead>
            <tbody>
              {(!reportData.records || reportData.records.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs font-medium text-ink-muted">
                    No records found for the selected period and criteria. Try selecting another date preset like "This FY" or "All Time".
                  </td>
                </tr>
              )}

              {reportType === 'sales' &&
                (reportData.records || []).map(r => (
                  <tr key={r.id} className="hover:bg-paper transition-colors">
                    <td className="font-mono text-xs font-bold text-primary">{r.number}</td>
                    <td className="text-xs font-medium text-ink">
                      {new Date(r.issuedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="font-bold text-xs text-ink">{r.partyName}</td>
                    <td>
                      <span className="uppercase text-[11px] font-bold text-ink bg-paper-sunken border border-border px-2 py-0.5 rounded-control inline-block">
                        {r.paymentMode}
                      </span>
                    </td>
                    <td className="text-right font-mono tabular-nums text-xs font-medium text-ink">
                      {formatINR(r.totals?.taxableValuePaise || 0)}
                    </td>
                    <td className="text-right font-mono tabular-nums text-xs font-bold text-primary">
                      {formatINR((r.totals?.cgstPaise || 0) + (r.totals?.sgstPaise || 0))}
                    </td>
                    <td className="text-right font-mono font-bold tabular-nums text-xs text-ink">
                      {formatINR(r.totals?.grandTotalPaise || 0)}
                    </td>
                  </tr>
                ))}

              {reportType === 'stock' &&
                (reportData.records || []).map(r => (
                  <tr key={r.id} className="hover:bg-paper transition-colors">
                    <td>
                      <div className="font-bold text-xs text-ink">{r.name}</div>
                      <div className="text-[11px] text-ink-muted font-medium break-words">{r.description} · {r.sizeSpec}</div>
                    </td>
                    <td className="text-xs font-bold text-ink">{r.category}</td>
                    <td className="font-mono font-bold text-xs text-ink">
                      {r.stockUnits} {r.unit}
                    </td>
                    <td className="text-xs font-medium text-ink-muted">
                      {r.reorderUnits} {r.unit}
                    </td>
                    <td className="text-right font-mono tabular-nums text-xs text-ink">
                      {formatINR(r.purchasePricePaise)}
                    </td>
                    <td className="text-right font-mono tabular-nums text-xs text-ink font-medium">
                      {formatINR(r.retailPricePaise)}
                    </td>
                    <td className="text-right font-mono font-bold tabular-nums text-xs text-emerald-700 dark:text-emerald-400">
                      {formatINR(r.stockUnits * r.purchasePricePaise)}
                    </td>
                  </tr>
                ))}

              {reportType === 'khata' &&
                (reportData.records || []).map(r => (
                  <tr key={r.id} className="hover:bg-paper transition-colors">
                    <td className="font-bold text-xs text-ink">{r.name}</td>
                    <td className="font-mono text-xs font-medium text-ink">{r.mobile}</td>
                    <td className="capitalize text-xs font-semibold text-ink">{r.type}</td>
                    <td>
                      <span className="uppercase text-[11px] font-bold text-ink bg-paper-sunken border border-border px-2 py-0.5 rounded-control inline-block">
                        {r.priceTier} tier
                      </span>
                    </td>
                    <td className="text-right font-mono font-bold text-rose-700 dark:text-rose-400 tabular-nums text-xs">
                      {formatINR(r.balancePaise)}
                    </td>
                  </tr>
                ))}

              {reportType === 'gst' &&
                (reportData.records || []).map(r => (
                  <tr key={r.rate} className="hover:bg-paper transition-colors">
                    <td className="font-bold text-xs text-ink">{r.rate}% GST Slab</td>
                    <td className="text-right font-mono tabular-nums text-xs font-medium text-ink">{formatINR(r.taxable)}</td>
                    <td className="text-right font-mono tabular-nums text-xs text-ink">{formatINR(r.cgst)}</td>
                    <td className="text-right font-mono tabular-nums text-xs text-ink">{formatINR(r.sgst)}</td>
                    <td className="text-right font-mono font-bold text-primary tabular-nums text-xs">
                      {formatINR(r.cgst + r.sgst)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Save Template Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-paper-surface border border-border rounded-panel text-xs shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Bookmark className="h-4 w-4 text-primary" />
          <input
            type="text"
            placeholder="Save current filters as template name..."
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            className="rounded-control border border-border bg-paper px-3 py-1.5 text-xs w-64 text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none font-medium"
          />
          <button
            onClick={handleSaveTemplate}
            className="px-3.5 py-1.5 bg-primary text-primary-foreground font-bold rounded-control hover:bg-primary-hover whitespace-nowrap shadow-sm transition-colors"
          >
            Save Template
          </button>
        </div>

        {savedTemplates.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <span className="text-ink font-bold text-xs whitespace-nowrap">Favorites:</span>
            {savedTemplates.slice(0, 3).map(t => (
              <button
                key={t.id}
                onClick={() => handleLoadTemplate(t)}
                className="px-2.5 py-1 bg-paper border border-border rounded-control text-xs text-ink font-semibold hover:bg-paper-sunken whitespace-nowrap transition-colors"
              >
                {t.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
