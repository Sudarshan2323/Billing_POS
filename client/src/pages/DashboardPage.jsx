import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ArrowDownRight,
  Receipt,
  HardHat,
  Package,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatINR } from '../lib/utils';
import { getDashboardStats, getParties } from '../lib/storage';

export const DashboardPage = () => {
  const [stats, setStats] = useState({
    todaySalesPaise: 758700,
    cashPaise: 250000,
    upiPaise: 508700,
    receivablesPaise: 14840000,
    lowStockCount: 2,
    lowStockItems: [],
  });

  const [topDues, setTopDues] = useState([]);

  useEffect(() => {
    const data = getDashboardStats();
    setStats(data);

    const parties = getParties();
    const dues = parties
      .filter(p => p.balancePaise > 0)
      .sort((a, b) => b.balancePaise - a.balancePaise);
    setTopDues(dues);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Bill Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Bharat Hardware Dashboard
            </h1>
            <span className="bg-paper-sunken text-semantic-positive text-xs px-2 py-0.5 rounded-control font-semibold border border-border">
              Live POS
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Real-time daily retail counter, contractor credit ledger, and stock alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/billing"
            className="inline-flex items-center gap-1.5 rounded-control bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary-hover shadow-sm min-h-[44px]"
          >
            <Receipt className="h-4 w-4" />
            <span>New POS Bill (F2)</span>
          </Link>
        </div>
      </div>

      {/* Top Stat Row (Dense Ledger Book Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border border border-border rounded-panel bg-paper-surface">
        <div className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Today's Sales
          </span>
          <div className="mt-1 text-2xl font-bold tabular-nums text-ink font-mono">
            {formatINR(stats.todaySalesPaise)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-semantic-positive font-medium">
            <TrendingUp className="h-3 w-3" />
            <span>Retail counter active</span>
          </div>
        </div>

        <div className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            UPI / Cash Breakdown
          </span>
          <div className="mt-1 flex items-baseline gap-2 text-sm tabular-nums text-ink">
            <span className="font-bold text-base font-mono">{formatINR(stats.upiPaise)}</span>
            <span className="text-xs text-ink-muted font-medium">UPI</span>
          </div>
          <div className="text-xs tabular-nums text-ink-muted mt-0.5 font-medium font-mono">
            {formatINR(stats.cashPaise)} Cash
          </div>
        </div>

        <div className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Contractor Receivables (Udhaar)
          </span>
          <div className="mt-1 text-2xl font-bold tabular-nums text-semantic-warning font-mono">
            {formatINR(stats.receivablesPaise)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-ink-muted">
            <ArrowDownRight className="h-3 w-3 text-semantic-warning" />
            <span>Customer dues pending</span>
          </div>
        </div>

        <div className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Low Stock Alerts
          </span>
          <div className="mt-1 text-2xl font-bold tabular-nums text-semantic-danger">
            {stats.lowStockCount} Items
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-ink-muted">
            <AlertTriangle className="h-3 w-3 text-semantic-danger" />
            <span>Below reorder level</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Top Contractor Dues & Reorder Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contractor Credit Dues (Khata) */}
        <div className="border border-border rounded-panel bg-paper-surface p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <HardHat className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
                Top Contractor Dues (Khata)
              </h2>
            </div>
            <Link
              to="/parties?tab=khata"
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {topDues.slice(0, 5).map(party => (
              <div key={party.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-paper">
                <div>
                  <span className="font-bold text-ink">{party.name}</span>
                  <div className="text-[11px] text-ink-muted font-mono">{party.mobile} · {party.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-semantic-danger tabular-nums">
                    {formatINR(party.balancePaise)}
                  </div>
                  <Link
                    to={`/parties?tab=khata`}
                    className="text-[10px] text-primary hover:underline font-semibold"
                  >
                    Settle / Statement
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="border border-border rounded-panel bg-paper-surface p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-accent" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
                Reorder Warnings
              </h2>
            </div>
            <Link
              to="/products"
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              <span>Manage Stock</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {(stats.lowStockItems || []).slice(0, 5).map(item => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-paper">
                <div>
                  <span className="font-bold text-ink">{item.name}</span>
                  <div className="text-[11px] text-ink-muted">
                    Loc: {item.rackLocation || 'Front'} · Min: {item.reorderUnits} {item.unit}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-semantic-warning tabular-nums">
                    {item.stockUnits} {item.unit} left
                  </span>
                  <div className="text-[10px] text-ink-muted font-mono">
                    Buy: {formatINR(item.purchasePricePaise)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
