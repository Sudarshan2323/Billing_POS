import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Printer,
  FileText,
  CheckCircle2,
  Eye,
  X,
  Share2,
  ArrowRight,
  Clock,
  Receipt,
  Layers,
  Sparkles,
  Building,
  Check,
} from 'lucide-react';
import { formatINR } from '../lib/utils';
import { amountInWordsIndian } from '../shared/money';
import {
  getInvoices,
  getQuotations,
  convertQuotationToInvoice,
  getSettings,
} from '../lib/storage';

export const InvoicesPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const paramTab = searchParams.get('tab');

  // Active Tab: 'invoices' | 'quotations'
  const [activeTab, setActiveTab] = useState(
    paramTab === 'quotations' || paramTab === 'estimates' ? 'quotations' : 'invoices'
  );

  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState(getSettings());

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [printFormat, setPrintFormat] = useState('80mm'); // '80mm' | '58mm' | 'a4'

  // Listen for navigation search param changes
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'quotations' || tab === 'estimates') {
      setActiveTab('quotations');
    } else if (tab === 'invoices' || tab === 'bills') {
      setActiveTab('invoices');
    }
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setInvoices(getInvoices());
    setQuotations(getQuotations());
    setSettings(getSettings());
  };

  const handleConvertQuotation = quoteId => {
    try {
      const inv = convertQuotationToInvoice(quoteId, 'cash');
      loadData();
      setSelectedDoc(inv);
      setActiveTab('invoices');
    } catch (e) {
      alert(e.message);
    }
  };

  const filteredInvoices = invoices.filter(
    inv =>
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.partyName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.siteName && inv.siteName.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredQuotations = quotations.filter(
    q =>
      q.number.toLowerCase().includes(search.toLowerCase()) ||
      q.partyName.toLowerCase().includes(search.toLowerCase()) ||
      (q.siteName && q.siteName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Bills & Estimates Register
            </h1>
            <span className="bg-paper-sunken border border-border text-ink font-semibold text-xs px-2.5 py-0.5 rounded-control">
              GST Compliant
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Immutable tax invoices, customer quotations, thermal receipts & A4 tax sheet generation
          </p>
        </div>

        {/* Unified Segmented Toggle Switch */}
        <div className="inline-flex p-1 bg-paper-sunken border border-border rounded-panel text-xs font-bold gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-control transition-all ${
              activeTab === 'invoices'
                ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                : 'text-ink-muted hover:text-ink font-semibold hover:bg-paper'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Tax Invoices ({invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quotations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-control transition-all ${
              activeTab === 'quotations'
                ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                : 'text-ink-muted hover:text-ink font-semibold hover:bg-paper'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Estimates & Quotations ({quotations.length})</span>
          </button>
        </div>
      </div>

      {/* Search & Counter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-paper-surface border border-border p-3 rounded-panel">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-muted" />
          <input
            type="text"
            placeholder={
              activeTab === 'invoices'
                ? 'Search by invoice number, customer, site name...'
                : 'Search by estimate number, contractor, site...'
            }
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-control border border-border bg-paper text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none font-medium"
          />
        </div>
        <div className="text-xs text-ink">
          Showing <strong className="font-bold text-primary">{activeTab === 'invoices' ? filteredInvoices.length : filteredQuotations.length}</strong> {activeTab === 'invoices' ? 'invoices' : 'estimates'}
        </div>
      </div>

      {/* ================= TAX INVOICES TABLE ================= */}
      {activeTab === 'invoices' && (
        <div className="border border-border rounded-panel bg-paper-surface overflow-x-auto shadow-sm">
          <table className="w-full text-left dense-table">
            <thead>
              <tr>
                <th className="font-bold text-ink">Invoice Number</th>
                <th className="font-bold text-ink">Date & Time</th>
                <th className="font-bold text-ink">Customer & Site</th>
                <th className="font-bold text-ink">Payment Mode</th>
                <th className="font-bold text-ink">Items Count</th>
                <th className="text-right font-bold text-ink">Grand Total</th>
                <th className="text-center font-bold text-ink">Status</th>
                <th className="text-center font-bold text-ink">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-xs font-medium text-ink-muted">
                    No tax invoices found. Generate a new bill from POS to see it recorded here.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-paper transition-colors">
                    <td className="font-mono text-xs font-bold text-primary">
                      {inv.number}
                    </td>
                    <td className="text-xs font-medium text-ink">
                      {new Date(inv.issuedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <div className="font-bold text-xs text-ink">{inv.partyName}</div>
                      {inv.siteName && (
                        <div className="text-[11px] font-medium text-ink-muted">Site: {inv.siteName}</div>
                      )}
                    </td>
                    <td>
                      <span className="uppercase text-[11px] font-bold text-ink bg-paper-sunken border border-border px-2 py-0.5 rounded-control inline-block">
                        {inv.paymentMode}
                      </span>
                    </td>
                    <td className="text-xs font-semibold text-ink">{(inv.items || []).length} items</td>
                    <td className="text-right font-mono font-bold tabular-nums text-xs text-ink">
                      {formatINR(inv.totals?.grandTotalPaise || 0)}
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 dark:text-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-700 px-2.5 py-0.5 rounded-control">
                        <CheckCircle2 className="h-3 w-3" /> Issued
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => setSelectedDoc(inv)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-control border border-border bg-paper text-ink hover:bg-paper-sunken shadow-sm transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= ESTIMATES & QUOTATIONS TABLE ================= */}
      {activeTab === 'quotations' && (
        <div className="border border-border rounded-panel bg-paper-surface overflow-x-auto shadow-sm">
          <table className="w-full text-left dense-table">
            <thead>
              <tr>
                <th className="font-bold text-ink">Estimate Number</th>
                <th className="font-bold text-ink">Created Date</th>
                <th className="font-bold text-ink">Customer & Site</th>
                <th className="font-bold text-ink">Rate Tier</th>
                <th className="font-bold text-ink">Items Count</th>
                <th className="text-right font-bold text-ink">Estimate Total</th>
                <th className="text-center font-bold text-ink">Status</th>
                <th className="text-right font-bold text-ink">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-xs font-medium text-ink-muted">
                    No quotations generated yet. Create an estimate in New Bill (POS) by saving as Quotation.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map(quote => (
                  <tr key={quote.id} className="hover:bg-paper transition-colors">
                    <td className="font-mono text-xs font-bold text-primary">{quote.number}</td>
                    <td className="text-xs font-medium text-ink">
                      {new Date(quote.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className="font-bold text-xs text-ink">{quote.partyName}</div>
                      {quote.siteName && (
                        <div className="text-[11px] font-medium text-ink-muted">Site: {quote.siteName}</div>
                      )}
                    </td>
                    <td>
                      <span className="uppercase text-[11px] font-bold text-ink bg-paper-sunken border border-border px-2 py-0.5 rounded-control inline-block">
                        {quote.priceTier} tier
                      </span>
                    </td>
                    <td className="text-xs font-semibold text-ink">{(quote.items || []).length} items</td>
                    <td className="text-right font-mono font-bold tabular-nums text-xs text-ink">
                      {formatINR(quote.totals?.grandTotalPaise || 0)}
                    </td>
                    <td className="text-center">
                      {quote.status === 'converted' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 dark:text-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-700 px-2.5 py-0.5 rounded-control">
                          <Check className="h-3 w-3" /> Converted ({quote.convertedInvoiceNumber})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 dark:text-amber-200 dark:bg-amber-950/60 dark:border-amber-700 px-2.5 py-0.5 rounded-control">
                          <Clock className="h-3 w-3" /> Active Estimate
                        </span>
                      )}
                    </td>
                    <td className="text-right space-x-1.5 whitespace-nowrap">
                      {quote.status !== 'converted' && (
                        <button
                          onClick={() => handleConvertQuotation(quote.id)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-control text-xs font-bold hover:bg-primary-hover inline-flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <span>Convert to Invoice</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedDoc(quote)}
                        className="px-3 py-1.5 border border-border text-ink bg-paper rounded-control text-xs font-bold hover:bg-paper-sunken shadow-sm transition-colors"
                      >
                        View / Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= DOCUMENT DETAIL & PRINT MODAL ================= */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-sm">
          <div className="bg-paper-surface border border-border rounded-panel max-w-4xl w-full max-h-[94vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-control bg-primary text-primary-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink">
                    {selectedDoc.number.startsWith('INV') ? 'Tax Invoice Details' : 'Quotation / Estimate Details'}
                  </h3>
                  <p className="text-xs text-ink-muted font-medium font-mono">
                    Ref: {selectedDoc.number} · Client: {selectedDoc.partyName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 rounded-control text-ink-muted hover:text-ink hover:bg-paper-sunken transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Print Format Toggle Switch */}
            <div className="flex rounded-control border border-border bg-paper-sunken p-1 text-xs font-bold gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setPrintFormat('80mm')}
                className={`flex-1 py-2 px-3 rounded-control text-center transition-all ${
                  printFormat === '80mm'
                    ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                    : 'text-ink-muted hover:text-ink font-semibold hover:bg-paper'
                }`}
              >
                80mm Thermal Receipt
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('58mm')}
                className={`flex-1 py-2 px-3 rounded-control text-center transition-all ${
                  printFormat === '58mm'
                    ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                    : 'text-ink-muted hover:text-ink font-semibold hover:bg-paper'
                }`}
              >
                58mm Thermal Slip
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`flex-1 py-2 px-3 rounded-control text-center transition-all ${
                  printFormat === 'a4'
                    ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                    : 'text-ink-muted hover:text-ink font-semibold hover:bg-paper'
                }`}
              >
                A4 Tax Sheet (Full Page)
              </button>
            </div>

            {/* ================= PREVIEW AREA ================= */}
            {printFormat === 'a4' ? (
              /* A4 TAX INVOICE FORMAT PREVIEW */
              <div className="p-6 bg-white text-zinc-950 border border-zinc-300 rounded shadow font-sans text-xs space-y-4 max-w-3xl mx-auto">
                {/* Header */}
                <div className="border-b-2 border-zinc-950 pb-3 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-zinc-950">{settings.shopName}</h2>
                    <p className="text-[11px] text-zinc-600 font-medium">{settings.tagline}</p>
                    <p className="text-[11px] text-zinc-700 mt-1">{settings.address}</p>
                    <p className="text-xs font-bold text-zinc-900 mt-0.5">
                      GSTIN: <span className="font-mono">{settings.gstin}</span> · State Code: 27 (Maharashtra)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-block bg-zinc-900 text-white font-bold text-xs uppercase px-3 py-1 rounded">
                      {selectedDoc.number.startsWith('INV') ? 'TAX INVOICE' : 'ESTIMATE / QUOTATION'}
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-1">Original for Recipient</div>
                    <div className="font-mono font-bold text-sm text-zinc-950 mt-1">{selectedDoc.number}</div>
                    <div className="text-xs text-zinc-700">
                      Date: {new Date(selectedDoc.issuedAt || selectedDoc.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                {/* Buyer / Delivery Details */}
                <div className="grid grid-cols-2 gap-4 border border-zinc-300 p-3 rounded bg-zinc-50 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Billed To (Customer):</span>
                    <strong className="text-sm text-zinc-900 block mt-0.5">{selectedDoc.partyName}</strong>
                    {selectedDoc.siteName && (
                      <div className="text-zinc-700 mt-0.5">Site / Project: <strong className="text-zinc-900">{selectedDoc.siteName}</strong></div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Payment & Terms:</span>
                    <div className="font-bold uppercase text-zinc-900 mt-0.5">Mode: {selectedDoc.paymentMode || 'Credit'}</div>
                    <div className="text-[11px] text-zinc-600">Rate Tier: {selectedDoc.priceTier || 'Contractor'}</div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border border-zinc-300 text-xs">
                  <thead className="bg-zinc-100 border-b border-zinc-300 font-bold text-zinc-900">
                    <tr>
                      <th className="p-2 border-r border-zinc-300 w-8 text-center">#</th>
                      <th className="p-2 border-r border-zinc-300">Description of Goods</th>
                      <th className="p-2 border-r border-zinc-300 text-center">HSN</th>
                      <th className="p-2 border-r border-zinc-300 text-right">Qty</th>
                      <th className="p-2 border-r border-zinc-300 text-right">Rate (₹)</th>
                      <th className="p-2 border-r border-zinc-300 text-center">GST</th>
                      <th className="p-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedDoc.items || []).map((it, idx) => (
                      <tr key={idx} className="border-b border-zinc-200">
                        <td className="p-2 border-r border-zinc-200 text-center text-zinc-500">{idx + 1}</td>
                        <td className="p-2 border-r border-zinc-200">
                          <div className="font-bold text-zinc-950">{it.name}</div>
                          {it.description && (
                            <div className="text-[10px] text-zinc-600 leading-tight">
                              {it.description} {it.sizeSpec ? `(${it.sizeSpec})` : ''}
                            </div>
                          )}
                        </td>
                        <td className="p-2 border-r border-zinc-200 text-center font-mono text-zinc-700">{it.hsn || '8481'}</td>
                        <td className="p-2 border-r border-zinc-200 text-right font-mono font-medium">
                          {it.qtyUnits} {it.unit}
                        </td>
                        <td className="p-2 border-r border-zinc-200 text-right font-mono">
                          {formatINR(it.ratePaise)}
                        </td>
                        <td className="p-2 border-r border-zinc-200 text-center font-mono font-medium">{it.gstRate}%</td>
                        <td className="p-2 text-right font-mono font-bold">{formatINR(it.totalPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Calculation Totals */}
                <div className="flex justify-between items-start pt-2">
                  <div className="max-w-md space-y-2">
                    <div className="p-2 bg-zinc-100 rounded border border-zinc-200 text-[11px] text-zinc-800">
                      <strong>Amount in Words:</strong> {amountInWordsIndian(selectedDoc.totals?.grandTotalPaise || 0)}
                    </div>
                    <div className="text-[10px] text-zinc-600 space-y-0.5">
                      <p>• Goods once sold cannot be returned after 7 days.</p>
                      <p>• Payment terms as per agreed Khata ledger cycle.</p>
                      <p>• Jurisdiction: Pune / Maharashtra courts only.</p>
                    </div>
                  </div>

                  <div className="w-64 border border-zinc-300 rounded p-2.5 bg-zinc-50 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-zinc-700">
                      <span>Taxable Value:</span>
                      <span>{formatINR(selectedDoc.totals?.taxableValuePaise || 0)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-700">
                      <span>CGST:</span>
                      <span>{formatINR(selectedDoc.totals?.cgstPaise || 0)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-700">
                      <span>SGST:</span>
                      <span>{formatINR(selectedDoc.totals?.sgstPaise || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-zinc-950 border-t-2 border-zinc-950 pt-1.5">
                      <span>Grand Total:</span>
                      <span>{formatINR(selectedDoc.totals?.grandTotalPaise || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Signatory Footer */}
                <div className="flex justify-between items-end pt-6 border-t border-zinc-300 text-[11px]">
                  <div>Customer Signature</div>
                  <div className="text-right">
                    <div className="font-bold">{settings.shopName}</div>
                    <div className="mt-8 border-t border-zinc-400 pt-1 text-[10px] text-zinc-600">Authorized Signatory</div>
                  </div>
                </div>
              </div>
            ) : (
              /* THERMAL RECEIPT (80mm & 58mm) */
              <div
                className={`p-4 bg-white text-zinc-950 border border-zinc-300 rounded shadow-inner font-mono text-[11px] space-y-2 mx-auto ${
                  printFormat === '58mm' ? 'max-w-[270px]' : 'max-w-md'
                }`}
              >
                <div className="text-center border-b border-zinc-300 pb-2">
                  <h4 className="font-bold text-xs uppercase text-zinc-950">{settings.shopName}</h4>
                  <p className="text-[10px] text-zinc-600">{settings.tagline}</p>
                  <p className="text-[10px] text-zinc-600">{settings.address}</p>
                  <p className="text-[10px] font-bold text-zinc-900">GSTIN: {settings.gstin}</p>
                </div>

                <div className="flex justify-between border-b border-zinc-300 pb-1 text-[10px] text-zinc-700">
                  <span className="font-bold text-zinc-950">Doc: {selectedDoc.number}</span>
                  <span>
                    {new Date(selectedDoc.issuedAt || selectedDoc.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-[10px] border-b border-zinc-300 pb-1 text-zinc-800">
                  <div>Client: <strong className="text-zinc-950">{selectedDoc.partyName}</strong></div>
                  {selectedDoc.siteName && <div>Site: {selectedDoc.siteName}</div>}
                  <div className="uppercase">Mode: {selectedDoc.paymentMode || 'Credit'}</div>
                </div>

                {/* Items List with TWO-LINE FORMAT */}
                <div className="space-y-1.5 border-b border-zinc-300 pb-2 pt-1">
                  {(selectedDoc.items || []).map((it, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between font-bold text-zinc-950">
                        <span>{it.name}</span>
                        <span>{formatINR(it.totalPaise)}</span>
                      </div>
                      <div className="text-[10px] text-zinc-600 break-words leading-tight pl-2">
                        {it.description}
                        {it.sizeSpec ? ` (${it.sizeSpec})` : ''}
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-600 pl-2">
                        <span>
                          {it.qtyUnits} {it.unit} @ {formatINR(it.ratePaise)}
                        </span>
                        <span>GST {it.gstRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-right pt-1 font-bold text-[10px] text-zinc-800">
                  <div className="flex justify-between">
                    <span>Taxable Value:</span>
                    <span>{formatINR(selectedDoc.totals?.taxableValuePaise || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST + SGST:</span>
                    <span>
                      {formatINR(
                        (selectedDoc.totals?.cgstPaise || 0) + (selectedDoc.totals?.sgstPaise || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t-2 border-zinc-950 pt-1 text-zinc-950 font-bold">
                    <span>GRAND TOTAL:</span>
                    <span>{formatINR(selectedDoc.totals?.grandTotalPaise || 0)}</span>
                  </div>
                </div>

                <div className="bg-zinc-100 p-2 rounded text-[10px] text-zinc-800 border border-zinc-200">
                  Amount in Words: {amountInWordsIndian(selectedDoc.totals?.grandTotalPaise || 0)}
                </div>

                <div className="text-center text-[9px] text-zinc-500 pt-1">
                  Thank You for Shopping with Bharat Hardware!
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-2 pt-3 border-t border-border">
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Bharat Hardware ${selectedDoc.number} for ${selectedDoc.partyName}. Grand Total: INR ${(
                    (selectedDoc.totals?.grandTotalPaise || 0) / 100
                  ).toFixed(2)}`
                )}`}
                className="px-3.5 py-2 bg-emerald-600 text-white rounded-control text-xs font-bold inline-flex items-center gap-1.5 hover:bg-emerald-700 shadow-sm transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>Share WhatsApp</span>
              </a>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-control text-xs font-bold inline-flex items-center gap-1.5 hover:bg-primary-hover shadow-sm transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
