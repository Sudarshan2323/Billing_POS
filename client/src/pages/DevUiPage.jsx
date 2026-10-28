import React from 'react';
import { formatINR } from '../lib/utils';
import { CheckCircle2, AlertTriangle, ShieldCheck, HardHat, FileText, Receipt } from 'lucide-react';

export const DevUiPage = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Ledger Book Modern Design System
        </h1>
        <p className="text-xs text-ink-muted mt-1">
          Verification page for "Ledger Book Modern" design aesthetic (Docs/06_DESIGN_PROMPT.md)
        </p>
      </div>

      {/* 1. Palette Swatches */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Color Swatches & Tokens
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <div className="rounded-panel border border-border p-3 bg-paper">
            <div className="text-xs font-semibold text-ink">Warm Paper</div>
            <div className="text-[10px] text-ink-muted font-mono">#FAF6EE</div>
          </div>
          <div className="rounded-panel border border-border p-3 bg-paper-surface">
            <div className="text-xs font-semibold text-ink">Surface</div>
            <div className="text-[10px] text-ink-muted font-mono">#FFFDF8</div>
          </div>
          <div className="rounded-panel border border-border p-3 bg-paper-sunken">
            <div className="text-xs font-semibold text-ink">Sunken</div>
            <div className="text-[10px] text-ink-muted font-mono">#F1EBDD</div>
          </div>
          <div className="rounded-panel border border-border p-3 bg-primary text-primary-foreground">
            <div className="text-xs font-semibold">Deep Teal</div>
            <div className="text-[10px] opacity-80 font-mono">#0F4C5C</div>
          </div>
          <div className="rounded-panel border border-border p-3 bg-accent text-accent-foreground">
            <div className="text-xs font-semibold">Amber Accent</div>
            <div className="text-[10px] font-mono">#E09F3E</div>
          </div>
          <div className="rounded-panel border border-border p-3 bg-semantic-positive text-white">
            <div className="text-xs font-semibold">Positive</div>
            <div className="text-[10px] opacity-80 font-mono">#2F7D4F</div>
          </div>
        </div>
      </section>

      {/* 2. Status Chips */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Document & Khata Status Badges
        </h2>
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-semibold border border-border bg-paper-sunken text-semantic-positive">
            <CheckCircle2 className="h-3 w-3 text-semantic-positive" />
            Issued Tax Invoice
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-semibold border border-border bg-paper-sunken text-semantic-warning">
            <AlertTriangle className="h-3 w-3 text-semantic-warning" />
            Partial Khata Due
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-semibold border border-border bg-paper-sunken text-primary">
            <HardHat className="h-3 w-3 text-primary" />
            Contractor Wholesale Tier
          </span>
        </div>
      </section>

      {/* 3. Number Formatting & Tabular Numerals */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Indian Rupee (en-IN) & Tabular Numerals
        </h2>
        <div className="border border-border rounded-panel p-4 bg-paper-surface space-y-2 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-border">
            <span className="text-ink">Astral PVC Pipe 1 inch (6 m):</span>
            <span className="font-mono tabular-nums font-bold text-sm text-ink">{formatINR(49000)}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border">
            <span className="text-ink">Contractor Rate Override:</span>
            <span className="font-mono tabular-nums font-bold text-sm text-primary">{formatINR(44000)}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="font-bold text-ink">Total Khata Balance Due:</span>
            <span className="font-mono tabular-nums font-extrabold text-base text-semantic-danger">
              {formatINR(14840000)}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DevUiPage;
