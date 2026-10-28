import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  BookOpen,
  DollarSign,
  AlertTriangle,
  Clock,
  Printer,
  Share2,
  Trash2,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  ShieldAlert,
  HardHat,
} from 'lucide-react';
import { formatINR } from '../lib/utils';
import {
  getParties,
  saveParty,
  getPartyLedger,
  recordKhataPayment,
  addManualKhataEntry,
  voidKhataEntry,
  closePartyKhata,
  getAuditLogs,
  getSettings,
} from '../lib/storage';

export const PartiesPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'khata' ? 'khata' : 'customers';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState('');
  const [agingFilter, setAgingFilter] = useState('all');
  const [settings, setSettings] = useState(getSettings());

  const [selectedParty, setSelectedParty] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [showDeletedAudit, setShowDeletedAudit] = useState(false);

  const [showSettleModal, setShowSettleModal] = useState(null);
  const [settleAmountRupees, setSettleAmountRupees] = useState('');
  const [settleMode, setSettleMode] = useState('cash');
  const [settleNote, setSettleNote] = useState('');

  const [showAdjustModal, setShowAdjustModal] = useState(null);
  const [adjustType, setAdjustType] = useState('debit');
  const [adjustAmountRupees, setAdjustAmountRupees] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newParty, setNewParty] = useState({
    name: '',
    mobile: '',
    type: 'contractor',
    priceTier: 'contractor',
    gstin: '',
    creditLimitRupees: '100000',
    openingBalanceRupees: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setParties(getParties());
    setSettings(getSettings());
  };

  const handleOpenStatement = party => {
    setSelectedParty(party);
    const ledger = getPartyLedger(party.id);
    setLedgerEntries(ledger);
  };

  const refreshStatement = partyId => {
    const updatedParties = getParties();
    setParties(updatedParties);
    const p = updatedParties.find(x => x.id === partyId);
    if (p) {
      setSelectedParty(p);
      setLedgerEntries(getPartyLedger(partyId));
    }
  };

  const handleAddParty = e => {
    e.preventDefault();
    if (!newParty.name || !newParty.mobile) return;

    saveParty({
      name: newParty.name,
      mobile: newParty.mobile,
      type: newParty.type,
      priceTier: newParty.priceTier,
      gstin: newParty.gstin || '',
      creditLimitPaise: Math.round(Number(newParty.creditLimitRupees || 50000) * 100),
      balancePaise: Math.round(Number(newParty.openingBalanceRupees || 0) * 100),
      initialBalancePaise: Math.round(Number(newParty.openingBalanceRupees || 0) * 100),
      createdAt: new Date().toISOString(),
    });

    loadData();
    setShowAddModal(false);
    setNewParty({
      name: '',
      mobile: '',
      type: 'contractor',
      priceTier: 'contractor',
      gstin: '',
      creditLimitRupees: '100000',
      openingBalanceRupees: '',
    });
  };

  const handleConfirmSettle = e => {
    e.preventDefault();
    if (!showSettleModal || !settleAmountRupees) return;

    const amtPaise = Math.round(Number(settleAmountRupees) * 100);
    recordKhataPayment({
      partyId: showSettleModal.id,
      amountPaise: amtPaise,
      paymentMode: settleMode,
      note: settleNote || `Khata payment received via ${settleMode.toUpperCase()}`,
    });

    refreshStatement(showSettleModal.id);
    setShowSettleModal(null);
    setSettleAmountRupees('');
    setSettleNote('');
  };

  const handleConfirmAdjust = e => {
    e.preventDefault();
    if (!showAdjustModal || !adjustAmountRupees) return;

    const amtPaise = Math.round(Number(adjustAmountRupees) * 100);
    addManualKhataEntry({
      partyId: showAdjustModal.id,
      type: adjustType,
      amountPaise: amtPaise,
      note: adjustNote || 'Manual ledger balance adjustment',
    });

    refreshStatement(showAdjustModal.id);
    setShowAdjustModal(null);
    setAdjustAmountRupees('');
    setAdjustNote('');
  };

  const handleConfirmVoid = e => {
    e.preventDefault();
    if (!voidTarget || !voidReason) return;

    voidKhataEntry({
      entryId: voidTarget.id,
      reason: voidReason,
      author: 'Owner / Admin',
    });

    if (selectedParty) {
      refreshStatement(selectedParty.id);
    } else {
      loadData();
    }
    setVoidTarget(null);
    setVoidReason('');
  };

  const handleCloseCustomer = partyId => {
    if (confirm('Are you sure you want to close this Khata account? Balance must be zero or settled.')) {
      closePartyKhata(partyId, 'Customer requested closure');
      loadData();
      if (selectedParty && selectedParty.id === partyId) {
        setSelectedParty(null);
      }
    }
  };

  const getAgingCategory = p => {
    if (!p.lastTxnDate) return '0-30';
    const days = Math.floor((Date.now() - new Date(p.lastTxnDate).getTime()) / (1000 * 3600 * 24));
    if (days > 60) return '61+';
    if (days > 30) return '31-60';
    return '0-30';
  };

  const totalOutstandingPaise = parties
    .filter(p => p.balancePaise > 0)
    .reduce((acc, p) => acc + p.balancePaise, 0);

  const dues_0_30 = parties
    .filter(p => p.balancePaise > 0 && getAgingCategory(p) === '0-30')
    .reduce((acc, p) => acc + p.balancePaise, 0);

  const dues_31_60 = parties
    .filter(p => p.balancePaise > 0 && getAgingCategory(p) === '31-60')
    .reduce((acc, p) => acc + p.balancePaise, 0);

  const dues_61_plus = parties
    .filter(p => p.balancePaise > 0 && getAgingCategory(p) === '61+')
    .reduce((acc, p) => acc + p.balancePaise, 0);

  const filteredParties = parties.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mobile.includes(search) ||
      (p.type && p.type.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;
    if (activeTab === 'khata' && p.balancePaise <= 0) return false;

    if (agingFilter !== 'all') {
      return getAgingCategory(p) === agingFilter;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Customers & Khata Ledger
            </h1>
            <span className="bg-paper-sunken border border-border text-ink-muted text-xs px-2 py-0.5 rounded-control font-semibold">
              Credit System
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Credit limits, aging buckets, running statement balance, and full/partial settlement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-control bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Customer / Contractor</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('khata')}
          className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'khata'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Khata Dues Register ({parties.filter(p => p.balancePaise > 0).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'customers'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>All Parties Directory ({parties.length})</span>
        </button>
      </div>

      {/* Aging KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-paper-surface border border-border rounded-panel">
          <span className="text-[11px] font-semibold uppercase text-ink-muted">Total Outstanding</span>
          <div className="text-xl font-bold mt-1 font-mono tabular-nums text-ink">
            {formatINR(totalOutstandingPaise)}
          </div>
          <span className="text-[10px] text-ink-faint mt-0.5 block">Across all credit accounts</span>
        </div>

        <div className="p-4 bg-paper-surface border border-border rounded-panel">
          <span className="text-[11px] font-semibold uppercase text-ink-muted">0 - 30 Days Aging</span>
          <div className="text-xl font-bold mt-1 font-mono tabular-nums text-semantic-positive">
            {formatINR(dues_0_30)}
          </div>
          <span className="text-[10px] text-semantic-positive block">Normal credit cycle</span>
        </div>

        <div className="p-4 bg-paper-surface border border-border rounded-panel">
          <span className="text-[11px] font-semibold uppercase text-ink-muted">31 - 60 Days Aging</span>
          <div className="text-xl font-bold mt-1 font-mono tabular-nums text-semantic-warning">
            {formatINR(dues_31_60)}
          </div>
          <span className="text-[10px] text-semantic-warning block">Follow-up suggested</span>
        </div>

        <div className="p-4 bg-paper-surface border border-border rounded-panel">
          <span className="text-[11px] font-semibold uppercase text-ink-muted">61+ Days (Overdue)</span>
          <div className="text-xl font-bold mt-1 font-mono tabular-nums text-semantic-danger">
            {formatINR(dues_61_plus)}
          </div>
          <span className="text-[10px] text-semantic-danger block">Immediate recovery needed</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-paper-surface border border-border p-3 rounded-panel">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by name, phone, trade..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-control border border-border bg-paper text-ink focus:border-primary focus:outline-none"
          />
        </div>

        {activeTab === 'khata' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-ink-muted text-[11px] font-semibold">Aging:</span>
            {['all', '0-30', '31-60', '61+'].map(ag => (
              <button
                key={ag}
                onClick={() => setAgingFilter(ag)}
                className={`px-2.5 py-1 rounded-control text-xs font-medium transition-colors ${
                  agingFilter === ag
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'bg-paper-sunken border border-border text-ink-muted hover:text-ink'
                }`}
              >
                {ag === 'all' ? 'All Dues' : `${ag} Days`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Customers & Khata Table */}
      <div className="border border-border rounded-panel bg-paper-surface overflow-x-auto">
        <table className="w-full text-left dense-table">
          <thead>
            <tr>
              <th>Customer / Contractor</th>
              <th>Trade & Tier</th>
              <th>Phone</th>
              <th>Last Transaction</th>
              {activeTab === 'khata' && <th>Aging</th>}
              <th className="text-right">Balance Due</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredParties.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-xs text-ink-muted">
                  No parties matching your filters.
                </td>
              </tr>
            ) : (
              filteredParties.map(party => {
                const aging = getAgingCategory(party);
                return (
                  <tr key={party.id} className="hover:bg-paper">
                    <td>
                      <div className="font-bold text-ink flex items-center gap-1.5">
                        <HardHat className="h-3.5 w-3.5 text-ink-muted" />
                        <span>{party.name}</span>
                      </div>
                      {party.gstin && (
                        <div className="text-[10px] text-ink-faint font-mono">
                          GSTIN: {party.gstin}
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="capitalize font-medium text-xs text-ink">{party.type}</div>
                      <span className="text-[10px] text-ink-muted uppercase font-semibold">
                        {party.priceTier} tier
                      </span>
                    </td>

                    <td className="font-mono text-xs text-ink">{party.mobile}</td>

                    <td className="text-xs text-ink-muted">
                      {party.lastTxnDate
                        ? new Date(party.lastTxnDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })
                        : 'No recent txns'}
                    </td>

                    {activeTab === 'khata' && (
                      <td>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-control border ${
                            aging === '61+'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : aging === '31-60'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {aging} Days
                        </span>
                      </td>
                    )}

                    <td className="text-right font-mono font-bold tabular-nums text-xs">
                      <span
                        className={
                          party.balancePaise > 0
                            ? 'text-semantic-danger'
                            : 'text-ink-muted'
                        }
                      >
                        {formatINR(party.balancePaise)}
                      </span>
                    </td>

                    <td className="text-right space-x-1 whitespace-nowrap">
                      {party.balancePaise > 0 && (
                        <button
                          onClick={() => {
                            setShowSettleModal(party);
                            setSettleAmountRupees(((party.balancePaise || 0) / 100).toFixed(2));
                          }}
                          className="px-2.5 py-1 bg-primary text-primary-foreground rounded-control text-xs font-semibold hover:bg-primary-hover shadow-sm"
                        >
                          Settle
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenStatement(party)}
                        className="px-2.5 py-1 border border-border text-ink bg-paper rounded-control text-xs font-medium hover:bg-paper-sunken"
                      >
                        Statement
                      </button>

                      {party.balancePaise > 0 && (
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={`https://wa.me/91${party.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Namaste ${party.name}, gentle reminder from ${settings.shopName}. Your outstanding Khata balance is INR ${(
                              party.balancePaise / 100
                            ).toFixed(2)}. Kindly settle at your earliest convenience.`
                          )}`}
                          className="px-2 py-1 bg-paper-sunken text-primary border border-border rounded-control text-xs font-medium hover:bg-border"
                          title="Send WhatsApp Reminder"
                        >
                          Reminder
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= CUSTOMER KHATA STATEMENT MODAL ================= */}
      {selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
          <div className="bg-paper-surface border border-border rounded-panel max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            {/* Statement Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">
                  {selectedParty.name} — Customer Ledger
                </h3>
                <p className="text-xs text-ink-muted">
                  Mobile: {selectedParty.mobile} · Type: {selectedParty.type} ({selectedParty.priceTier} tier)
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span>
                    Current Balance Due:{' '}
                    <strong className="text-semantic-danger font-mono">{formatINR(selectedParty.balancePaise)}</strong>
                  </span>
                  <span>
                    Credit Limit:{' '}
                    <strong className="font-mono text-ink">{formatINR(selectedParty.creditLimitPaise || 5000000)}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 border border-border rounded-control text-xs text-ink bg-paper hover:bg-paper-sunken flex items-center gap-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedParty(null)}
                  className="p-1.5 rounded-control text-ink-muted hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-paper rounded-control border border-border text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowSettleModal(selectedParty);
                    setSettleAmountRupees(((selectedParty.balancePaise || 0) / 100).toFixed(2));
                  }}
                  className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-control flex items-center gap-1 shadow-sm hover:bg-primary-hover"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Record Payment / Settle</span>
                </button>

                <button
                  onClick={() => setShowAdjustModal(selectedParty)}
                  className="px-3 py-1.5 border border-border text-ink bg-paper-surface font-medium rounded-control hover:bg-paper-sunken"
                >
                  + Manual Adjustment / Discount
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-[11px] text-ink-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDeletedAudit}
                    onChange={e => setShowDeletedAudit(e.target.checked)}
                  />
                  <span>Show Voided Entries</span>
                </label>

                <button
                  onClick={() => handleCloseCustomer(selectedParty.id)}
                  className="text-[11px] text-semantic-danger hover:underline"
                >
                  Close Account
                </button>
              </div>
            </div>

            {/* Ledger Statement Table */}
            <div className="border border-border rounded-panel overflow-x-auto bg-paper-surface">
              <table className="w-full text-left dense-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference / Document</th>
                    <th>Site / Note</th>
                    <th className="text-right">Debit (+)</th>
                    <th className="text-right">Credit (-)</th>
                    <th className="text-right">Running Balance</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries
                    .filter(e => showDeletedAudit || !e.isVoided)
                    .map((entry, idx) => (
                      <tr
                        key={entry.id || idx}
                        className={entry.isVoided ? 'opacity-40 line-through bg-paper-sunken' : 'hover:bg-paper'}
                      >
                        <td className="text-xs text-ink-muted">
                          {new Date(entry.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: '2-digit',
                          })}
                        </td>
                        <td>
                          <div className="font-semibold text-xs text-ink">{entry.ref}</div>
                          {entry.isVoided && (
                            <span className="text-[9px] text-semantic-danger font-bold">VOIDED</span>
                          )}
                        </td>
                        <td className="text-xs text-ink-muted">
                          {entry.siteName || entry.note || '-'}
                        </td>
                        <td className="text-right font-mono tabular-nums text-xs text-ink">
                          {entry.debitPaise > 0 ? formatINR(entry.debitPaise) : '-'}
                        </td>
                        <td className="text-right font-mono tabular-nums text-xs text-semantic-positive">
                          {entry.creditPaise > 0 ? formatINR(entry.creditPaise) : '-'}
                        </td>
                        <td className="text-right font-mono font-bold tabular-nums text-xs text-ink">
                          {entry.isVoided ? '-' : formatINR(entry.runningBalancePaise)}
                        </td>
                        <td className="text-center">
                          {!entry.isVoided && entry.type !== 'opening' && (
                            <button
                              onClick={() => setVoidTarget(entry)}
                              className="text-ink-faint hover:text-semantic-danger p-1"
                              title="Void / Delete Entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= RECORD PAYMENT / SETTLE MODAL ================= */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-paper-surface border border-border rounded-panel p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-sm text-ink">Record Khata Payment (Settlement)</h3>
                <p className="text-xs text-ink-muted">{showSettleModal.name}</p>
              </div>
              <button onClick={() => setShowSettleModal(null)}>
                <X className="h-5 w-5 text-ink-muted hover:text-ink" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-3 text-xs">
              <div className="bg-paper-sunken p-2.5 rounded-control border border-border text-ink">
                Current Outstanding Due: <strong className="text-semantic-danger">{formatINR(showSettleModal.balancePaise)}</strong>
              </div>

              <div>
                <div className="flex justify-between mb-1 font-semibold text-ink">
                  <span>Amount to Settle (₹) *</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSettleAmountRupees(((showSettleModal.balancePaise || 0) / 100).toFixed(2))
                    }
                    className="text-primary font-bold hover:underline"
                  >
                    Settle Full Amount
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleAmountRupees}
                  onChange={e => setSettleAmountRupees(e.target.value)}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink font-mono text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">Payment Mode</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['cash', 'upi', 'bank', 'cheque'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSettleMode(m)}
                      className={`p-1.5 uppercase font-bold text-[11px] rounded-control border transition-colors ${
                        settleMode === m
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-paper text-ink-muted hover:text-ink'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">Payment Note / Cheque No</label>
                <input
                  type="text"
                  placeholder="e.g. Received via GPay, Ref #8372"
                  value={settleNote}
                  onChange={e => setSettleNote(e.target.value)}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div className="text-[11px] text-ink-muted">
                FIFO Allocation: Payments are automatically allocated to the oldest unpaid invoices first.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(null)}
                  className="px-3 py-1.5 border border-border rounded-control text-ink hover:bg-paper-sunken"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded-control hover:bg-primary-hover"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MANUAL ADJUSTMENT MODAL ================= */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-paper-surface border border-border rounded-panel p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-sm text-ink">Manual Khata Entry / Adjustment</h3>
              <button onClick={() => setShowAdjustModal(null)}>
                <X className="h-5 w-5 text-ink-muted hover:text-ink" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-ink">Adjustment Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('debit')}
                    className={`flex-1 py-1.5 font-bold rounded-control border ${
                      adjustType === 'debit'
                        ? 'bg-semantic-danger text-white'
                        : 'border-border bg-paper text-ink-muted'
                    }`}
                  >
                    Debit (Owes More)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('credit_discount')}
                    className={`flex-1 py-1.5 font-bold rounded-control border ${
                      adjustType === 'credit_discount'
                        ? 'bg-semantic-positive text-white'
                        : 'border-border bg-paper text-ink-muted'
                    }`}
                  >
                    Discount / Write-off
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adjustAmountRupees}
                  onChange={e => setAdjustAmountRupees(e.target.value)}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">Reason / Note *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Contractor discount approved by owner / Transport fee addition"
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(null)}
                  className="px-3 py-1.5 border border-border rounded-control text-ink hover:bg-paper-sunken"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded-control hover:bg-primary-hover"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VOID / DELETE ENTRY CONFIRMATION ================= */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-paper-surface border border-border rounded-panel p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-semantic-danger">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="font-bold text-sm text-ink">Void Khata Entry (Reversing Entry)</h3>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              You are about to void: <strong className="text-ink">{voidTarget.ref}</strong> (
              {formatINR(voidTarget.creditPaise || voidTarget.debitPaise)}). This action is audited.
              The customer's running balance will be immediately recalculated and reversed.
            </p>

            <form onSubmit={handleConfirmVoid} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-ink">Mandatory Audit Reason *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Accidental payment entry / Cheque bounced / Entry recorded on wrong party"
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setVoidTarget(null)}
                  className="px-3 py-1.5 border border-border rounded-control text-ink hover:bg-paper-sunken"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-semantic-danger text-white font-bold rounded-control hover:opacity-90"
                >
                  Confirm Void & Recompute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD NEW PARTY MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-paper-surface border border-border rounded-panel p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-sm text-ink">Add New Contractor / Customer</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="h-5 w-5 text-ink-muted hover:text-ink" />
              </button>
            </div>

            <form onSubmit={handleAddParty} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-ink">Full Name / Trade Entity *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patil (Electrical Contractor)"
                  value={newParty.name}
                  onChange={e => setNewParty({ ...newParty, name: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-ink">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9822012345"
                    value={newParty.mobile}
                    onChange={e => setNewParty({ ...newParty, mobile: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">Party Type</label>
                  <select
                    value={newParty.type}
                    onChange={e => setNewParty({ ...newParty, type: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink font-medium"
                  >
                    <option value="contractor">Building Contractor</option>
                    <option value="plumber">Plumber</option>
                    <option value="electrician">Electrician</option>
                    <option value="builder">Builder / Developer</option>
                    <option value="customer">Retail Walk-in Customer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-ink">Rate Tier</label>
                  <select
                    value={newParty.priceTier}
                    onChange={e => setNewParty({ ...newParty, priceTier: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink font-medium"
                  >
                    <option value="contractor">Wholesale / Contractor</option>
                    <option value="retail">Standard Retail</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newParty.creditLimitRupees}
                    onChange={e => setNewParty({ ...newParty, creditLimitRupees: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">GSTIN (Optional)</label>
                <input
                  type="text"
                  placeholder="27AABCB1234F1Z2"
                  value={newParty.gstin}
                  onChange={e => setNewParty({ ...newParty, gstin: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">Opening Balance Due (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newParty.openingBalanceRupees}
                  onChange={e => setNewParty({ ...newParty, openingBalanceRupees: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-border rounded-control text-ink hover:bg-paper-sunken"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded-control hover:bg-primary-hover"
                >
                  Create Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartiesPage;
