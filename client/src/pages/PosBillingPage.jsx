import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  X,
  Plus,
  Minus,
  Edit2,
  Clock,
  HardHat,
  FileText,
  Share2,
  Tag,
  AlertCircle,
  Building,
} from 'lucide-react';
import { formatINR } from '../lib/utils';
import { calcInvoice } from '../shared/gst';
import { amountInWordsIndian } from '../shared/money';
import {
  getProducts,
  getParties,
  issueInvoice,
  saveQuotation,
  getHeldBills,
  holdCurrentBill,
  removeHeldBill,
  saveProduct,
  HARDWARE_CATEGORIES,
  HARDWARE_UNITS,
  getSettings,
} from '../lib/storage';

export const PosBillingPage = () => {
  // Catalog & Parties
  const [catalog, setCatalog] = useState([]);
  const [parties, setParties] = useState([]);
  const [settings, setSettings] = useState(getSettings());

  // POS Document Mode: 'invoice' (Tax Invoice) or 'quotation' (Estimate)
  const [docMode, setDocMode] = useState('invoice');

  // Customer & Pricing Tier
  const [selectedPartyId, setSelectedPartyId] = useState('party_walkin');
  const [partyName, setPartyName] = useState('Walk-in Retail Customer');
  const [priceTier, setPriceTier] = useState('retail'); // 'retail' | 'contractor'
  const [siteName, setSiteName] = useState('');

  // Cart State — CRITICAL: MUST ALWAYS INITIALIZE EMPTY
  const [items, setItems] = useState([]);
  const [cartNotes, setCartNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi' | 'credit' | 'bank'
  const [idempotencyKey, setIdempotencyKey] = useState(() => `pos_${Date.now()}_${Math.random()}`);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Settlement & Post-bill Confirmation
  const [settlementSuccess, setSettlementSuccess] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printFormat, setPrintFormat] = useState('80mm'); // '80mm' | '58mm' | 'a4'

  // Held Bills Drawer
  const [showHeldDrawer, setShowHeldDrawer] = useState(false);
  const [heldBills, setHeldBills] = useState([]);

  // Quick Add Item In-Search
  const [showQuickAddItem, setShowQuickAddItem] = useState(false);
  const [quickNewItem, setQuickNewItem] = useState({
    name: '',
    description: '',
    sizeSpec: '',
    brand: '',
    category: 'Plumbing',
    unit: 'pcs',
    retailPriceRupees: '',
    contractorPriceRupees: '',
    gstRate: 18,
  });

  // Editing line item description modal
  const [editingItemDesc, setEditingItemDesc] = useState(null);

  useEffect(() => {
    setCatalog(getProducts());
    setParties(getParties());
    setHeldBills(getHeldBills());
    setSettings(getSettings());
  }, []);

  const handleSelectParty = partyId => {
    setSelectedPartyId(partyId);
    const p = parties.find(party => party.id === partyId);
    if (p) {
      setPartyName(p.name);
      if (p.priceTier) {
        setPriceTier(p.priceTier);
      } else if (p.type === 'contractor' || p.type === 'builder' || p.type === 'plumber') {
        setPriceTier('contractor');
      } else {
        setPriceTier('retail');
      }
    }
  };

  const addItemToCart = product => {
    const ratePaise =
      priceTier === 'contractor'
        ? product.contractorPricePaise || product.retailPricePaise
        : product.retailPricePaise;

    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.productId === product.id);
      if (existingIdx >= 0) {
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, qtyUnits: item.qtyUnits + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          description: product.description || '',
          sizeSpec: product.sizeSpec || '',
          brand: product.brand || '',
          category: product.category || 'Tools',
          hsn: product.hsn || '8481',
          unit: product.unit || 'pcs',
          qtyUnits: 1,
          ratePaise,
          gstRate: product.gstRate || 18,
        },
      ];
    });

    setSearchQuery('');
  };

  const updateQty = (index, delta) => {
    setItems(prev =>
      prev
        .map((item, idx) => {
          if (idx === index) {
            const nextQty = Math.max(1, item.qtyUnits + delta);
            return { ...item, qtyUnits: nextQty };
          }
          return item;
        })
    );
  };

  const updateLineRate = (index, newRateRupees) => {
    const ratePaise = Math.round(Number(newRateRupees) * 100);
    setItems(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, ratePaise } : item))
    );
  };

  const removeItem = index => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveLineDesc = () => {
    if (!editingItemDesc) return;
    setItems(prev =>
      prev.map((item, idx) =>
        idx === editingItemDesc.index
          ? { ...item, description: editingItemDesc.text }
          : item
      )
    );
    setEditingItemDesc(null);
  };

  const calculation = calcInvoice({
    items: items.map(i => ({
      productId: i.productId,
      qtyMilli: Math.round(i.qtyUnits * 1000),
      ratePaise: i.ratePaise,
      gstRate: i.gstRate,
    })),
    isInterState: false,
  });

  const totals = calculation.totals;

  const handleHoldBill = () => {
    if (items.length === 0) return;
    holdCurrentBill({
      items,
      partyId: selectedPartyId,
      partyName,
      siteName,
      paymentMode,
      priceTier,
    });
    setHeldBills(getHeldBills());
    resetPosState();
  };

  const handleResumeBill = heldId => {
    const held = heldBills.find(h => h.id === heldId);
    if (!held) return;
    setItems(held.items);
    setSelectedPartyId(held.partyId || 'party_walkin');
    setPartyName(held.partyName || 'Walk-in Retail Customer');
    setSiteName(held.siteName || '');
    setPaymentMode(held.paymentMode || 'cash');
    setPriceTier(held.priceTier || 'retail');

    removeHeldBill(heldId);
    setHeldBills(getHeldBills());
    setShowHeldDrawer(false);
  };

  const handleDiscardHeldBill = heldId => {
    removeHeldBill(heldId);
    setHeldBills(getHeldBills());
  };

  const resetPosState = () => {
    setItems([]);
    setSelectedPartyId('party_walkin');
    setPartyName('Walk-in Retail Customer');
    setPriceTier('retail');
    setSiteName('');
    setCartNotes('');
    setPaymentMode('cash');
    setIdempotencyKey(`pos_${Date.now()}_${Math.random()}`);
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleCompleteDocument = () => {
    if (items.length === 0) return;

    if (docMode === 'invoice') {
      const savedInvoice = issueInvoice({
        items,
        partyId: selectedPartyId,
        partyName,
        siteName,
        paymentMode,
        priceTier,
        notes: cartNotes || (siteName ? `Site: ${siteName}` : 'Counter Sale'),
      });

      setSettlementSuccess(savedInvoice);
      setShowPrintModal(true);

      setCatalog(getProducts());
      setParties(getParties());
    } else {
      const savedQuote = saveQuotation({
        items,
        partyId: selectedPartyId,
        partyName,
        siteName,
        priceTier,
        notes: cartNotes || (siteName ? `Quotation for site: ${siteName}` : 'Hardware Estimate'),
      });

      setSettlementSuccess(savedQuote);
      setShowPrintModal(true);
    }

    resetPosState();
  };

  const handleQuickAddSubmit = e => {
    e.preventDefault();
    if (!quickNewItem.name || !quickNewItem.retailPriceRupees) return;

    const retailPaise = Math.round(Number(quickNewItem.retailPriceRupees) * 100);
    const contractorPaise = Math.round(
      Number(quickNewItem.contractorPriceRupees || quickNewItem.retailPriceRupees) * 100
    );

    const saved = saveProduct({
      name: quickNewItem.name,
      description: quickNewItem.description || quickNewItem.name,
      sizeSpec: quickNewItem.sizeSpec || '',
      brand: quickNewItem.brand || '',
      category: quickNewItem.category || 'Plumbing',
      unit: quickNewItem.unit || 'pcs',
      retailPricePaise: retailPaise,
      contractorPricePaise: contractorPaise,
      purchasePricePaise: Math.round(retailPaise * 0.75),
      gstRate: Number(quickNewItem.gstRate) || 18,
      stockUnits: 50,
      reorderUnits: 10,
      rackLocation: 'Front Display',
    });

    addItemToCart(saved);
    setCatalog(getProducts());
    setShowQuickAddItem(false);
    setQuickNewItem({
      name: '',
      description: '',
      sizeSpec: '',
      brand: '',
      category: 'Plumbing',
      unit: 'pcs',
      retailPriceRupees: '',
      contractorPriceRupees: '',
      gstRate: 18,
    });
  };

  const filteredCatalog = catalog.filter(
    i =>
      !searchQuery ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (i.sizeSpec && i.sizeSpec.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (i.brand && i.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (i.category && i.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
      {/* ================= LEFT PANE: SEARCH & CATALOG ================= */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Customer & Price Tier Header */}
        <div className="bg-paper-surface border border-border rounded-panel p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Customer & Rate Tier
            </span>
            {/* Document Mode Toggle: Invoice vs Quotation */}
            <div className="flex items-center border border-border rounded-control overflow-hidden text-xs font-semibold">
              <button
                onClick={() => setDocMode('invoice')}
                className={`px-2.5 py-1 transition-colors ${
                  docMode === 'invoice'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-paper text-ink-muted hover:text-ink'
                }`}
              >
                Tax Invoice
              </button>
              <button
                onClick={() => setDocMode('quotation')}
                className={`px-2.5 py-1 transition-colors ${
                  docMode === 'quotation'
                    ? 'bg-accent text-accent-foreground font-bold'
                    : 'bg-paper text-ink-muted hover:text-ink'
                }`}
              >
                Estimate / Quote
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                Select Customer (Khata)
              </label>
              <select
                value={selectedPartyId}
                onChange={e => handleSelectParty(e.target.value)}
                className="w-full text-xs rounded-control border border-border bg-paper p-2 font-medium text-ink focus:border-primary focus:outline-none"
              >
                {parties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.balancePaise > 0 ? `(Due: ${formatINR(p.balancePaise)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                Price Tier (Rate Rule)
              </label>
              <div className="flex rounded-control border border-border overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setPriceTier('retail')}
                  className={`flex-1 py-1.5 font-semibold text-center transition-colors ${
                    priceTier === 'retail'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-paper text-ink-muted hover:text-ink'
                  }`}
                >
                  Retail
                </button>
                <button
                  type="button"
                  onClick={() => setPriceTier('contractor')}
                  className={`flex-1 py-1.5 font-semibold text-center transition-colors ${
                    priceTier === 'contractor'
                      ? 'bg-accent text-accent-foreground font-bold'
                      : 'bg-paper text-ink-muted hover:text-ink'
                  }`}
                >
                  Contractor / Wholesale
                </button>
              </div>
            </div>
          </div>

          {/* Site / Project Name Input */}
          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1">
              Site / Project Name (Optional for Builder / Plumber)
            </label>
            <div className="relative">
              <Building className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-muted" />
              <input
                type="text"
                placeholder="e.g. Green Valley Site #4 / Royal Towers Flat 302"
                value={siteName}
                onChange={e => setSiteName(e.target.value)}
                className="w-full rounded-control border border-border bg-paper pl-8 pr-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Search Input Bar with 'Item not found? Add it' */}
        <div className="bg-paper-surface border border-border rounded-panel p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-ink-muted uppercase">
              Item Search (Name, Brand, Spec) [F2]
            </label>
            <button
              onClick={() => setShowQuickAddItem(true)}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ New Item</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
            <input
              ref={searchInputRef}
              type="text"
              autoFocus
              placeholder="Search PVC Pipe, Wire, Paint, MCB, Bolts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-control border border-border bg-paper pl-9 pr-3 py-2 text-xs font-medium text-ink focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Search Results Catalog (2-Line Row Layout with Bold Name + Wrapped Description) */}
        <div className="bg-paper-surface border border-border rounded-panel p-2 flex-1 overflow-y-auto max-h-[480px]">
          {filteredCatalog.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-muted space-y-3">
              <p>No matching hardware items found for "{searchQuery}".</p>
              <button
                onClick={() => {
                  setQuickNewItem({ ...quickNewItem, name: searchQuery });
                  setShowQuickAddItem(true);
                }}
                className="px-3 py-1.5 bg-paper-sunken text-primary border border-border rounded-control text-xs font-semibold inline-flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add "{searchQuery}" as New Item</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredCatalog.map(product => {
                const effectivePricePaise =
                  priceTier === 'contractor'
                    ? product.contractorPricePaise || product.retailPricePaise
                    : product.retailPricePaise;

                return (
                  <div
                    key={product.id}
                    onClick={() => addItemToCart(product)}
                    className="p-2.5 hover:bg-paper-sunken rounded-control cursor-pointer transition-colors flex items-start justify-between gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Line 1: Item Name in BOLD */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-ink">
                          {product.name}
                        </span>
                        {product.brand && (
                          <span className="text-[10px] bg-paper-sunken text-ink-muted px-1.5 py-0.2 rounded font-medium border border-border">
                            {product.brand}
                          </span>
                        )}
                        <span className="text-[10px] text-ink-faint">HSN: {product.hsn}</span>
                      </div>

                      {/* Line 2: DESCRIPTION + SIZE/SPEC (Wrapped, never truncated) */}
                      <p className="text-[11px] text-ink-muted mt-0.5 leading-snug break-words">
                        {product.description}
                        {product.sizeSpec ? ` · Spec: ${product.sizeSpec}` : ''}
                      </p>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-ink-faint">
                        <span>Stock: {product.stockUnits} {product.unit}</span>
                        <span>· Loc: {product.rackLocation || 'Front'}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-xs tabular-nums text-ink">
                        {formatINR(effectivePricePaise)}
                      </div>
                      <span className="text-[10px] text-ink-muted">per {product.unit}</span>
                      <div className="text-[9px] text-semantic-positive font-semibold mt-0.5">
                        {product.gstRate}% GST incl.
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT PANE: ACTIVE CART & CHECKOUT ================= */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {/* Cart Top Bar */}
        <div className="bg-paper-surface border border-border rounded-panel p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-wider text-ink">
              Current Bill Items
            </span>
            <span className="px-2 py-0.5 bg-paper-sunken text-ink rounded-control text-xs font-semibold border border-border">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
            {docMode === 'quotation' && (
              <span className="bg-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded border border-accent/40">
                Estimate Draft
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {heldBills.length > 0 && (
              <button
                onClick={() => setShowHeldDrawer(true)}
                className="text-xs bg-paper-sunken text-ink border border-border px-2.5 py-1 rounded-control font-semibold flex items-center gap-1 hover:bg-border"
              >
                <Clock className="h-3.5 w-3.5 text-accent" />
                <span>Held Bills ({heldBills.length})</span>
              </button>
            )}
            {items.length > 0 && (
              <>
                <button
                  onClick={handleHoldBill}
                  className="text-xs border border-border px-2.5 py-1 rounded-control font-medium text-ink-muted hover:bg-paper-sunken hover:text-ink"
                >
                  Hold Bill
                </button>
                <button
                  onClick={resetPosState}
                  className="text-xs text-semantic-danger hover:underline font-medium px-2 py-1"
                >
                  Clear Cart
                </button>
              </>
            )}
          </div>
        </div>

        {/* Cart Line Items Table (Prominent Description in Second Line) */}
        <div className="bg-paper-surface border border-border rounded-panel flex-1 overflow-y-auto max-h-[440px]">
          {items.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-muted space-y-2">
              <HardHat className="h-10 w-10 mx-auto text-ink-faint" />
              <p className="font-semibold text-ink">
                Cart is completely empty
              </p>
              <p className="text-[11px] text-ink-muted max-w-sm mx-auto">
                Scan barcode or search hardware items from the catalog to start a clean bill.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 hover:bg-paper space-y-1.5">
                  {/* Line 1: Item Name (Bold) + Qty Controls + Rate + Total */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-xs text-ink flex-1 truncate">
                      {idx + 1}. {item.name}
                    </div>

                    {/* Qty Stepper */}
                    <div className="flex items-center border border-border rounded-control bg-paper">
                      <button
                        onClick={() => updateQty(idx, -1)}
                        className="p-1 text-ink-muted hover:text-ink min-h-[30px] min-w-[30px] flex items-center justify-center"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-xs font-bold px-2 tabular-nums text-ink">
                        {item.qtyUnits} {item.unit}
                      </span>
                      <button
                        onClick={() => updateQty(idx, 1)}
                        className="p-1 text-ink-muted hover:text-ink min-h-[30px] min-w-[30px] flex items-center justify-center"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Rate Input */}
                    <div className="w-20">
                      <input
                        type="number"
                        step="0.01"
                        value={((item.ratePaise || 0) / 100).toFixed(2)}
                        onChange={e => updateLineRate(idx, e.target.value)}
                        className="w-full text-right font-mono text-xs p-1 rounded-control border border-border bg-paper text-ink"
                        title="Override item rate"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="font-mono font-bold text-xs text-right w-24 tabular-nums text-ink">
                      {formatINR(calculation.items[idx]?.totalPaise || item.ratePaise * item.qtyUnits)}
                    </div>

                    {/* Remove Line */}
                    <button
                      onClick={() => removeItem(idx)}
                      className="p-1 text-ink-faint hover:text-semantic-danger transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Line 2: DESCRIPTION + SIZE/SPEC (Wrapped, editable) */}
                  <div className="flex items-center justify-between text-[11px] text-ink-muted pl-4">
                    <p className="break-words leading-tight flex-1">
                      {item.description ? (
                        <span>{item.description}</span>
                      ) : (
                        <span className="italic text-ink-faint">No description entered</span>
                      )}
                      {item.sizeSpec ? ` · Spec: ${item.sizeSpec}` : ''}
                    </p>
                    <button
                      onClick={() => setEditingItemDesc({ index: idx, text: item.description })}
                      className="text-[10px] text-primary font-medium hover:underline shrink-0 ml-2 flex items-center gap-0.5"
                    >
                      <Edit2 className="h-2.5 w-2.5" />
                      <span>Edit note</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bill Summary & GST Breakdown */}
        {items.length > 0 && (
          <div className="bg-paper-surface border border-border rounded-panel p-3 space-y-2 text-xs">
            <div className="flex justify-between text-ink-muted">
              <span>Taxable Value:</span>
              <span className="font-mono tabular-nums text-ink">{formatINR(totals.taxableValuePaise)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>CGST + SGST (Intra-state):</span>
              <span className="font-mono tabular-nums text-ink">
                {formatINR((totals.cgstPaise || 0) + (totals.sgstPaise || 0))}
              </span>
            </div>
            {totals.roundOffPaise !== 0 && (
              <div className="flex justify-between text-ink-faint">
                <span>Round-off:</span>
                <span className="font-mono tabular-nums text-ink">{formatINR(totals.roundOffPaise)}</span>
              </div>
            )}

            <div className="border-t border-border pt-2 flex items-center justify-between text-base font-extrabold text-ink">
              <span>GRAND TOTAL:</span>
              <span className="font-mono text-xl tabular-nums text-primary font-bold">
                {formatINR(totals.grandTotalPaise)}
              </span>
            </div>
          </div>
        )}

        {/* Sticky Checkout Bar */}
        <div className="bg-paper-surface border border-border rounded-panel p-3.5 space-y-3">
          {docMode === 'invoice' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-muted">
                Payment:
              </span>
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'upi', label: 'UPI / QR', icon: QrCode },
                { id: 'credit', label: 'Credit (Khata)', icon: HardHat },
                { id: 'bank', label: 'Bank / Cheque', icon: CreditCard },
              ].map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMode(m.id)}
                    className={`flex-1 py-2 px-1 text-xs font-semibold rounded-control flex items-center justify-center gap-1.5 transition-colors min-h-[44px] ${
                      paymentMode === m.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border border-border bg-paper text-ink hover:bg-paper-sunken'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            disabled={items.length === 0}
            onClick={handleCompleteDocument}
            className={`w-full py-3.5 rounded-control text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all min-h-[48px] ${
              items.length === 0
                ? 'bg-paper-sunken text-ink-faint cursor-not-allowed border border-border'
                : docMode === 'invoice'
                ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                : 'bg-accent text-accent-foreground font-bold hover:opacity-90'
            }`}
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>
              {docMode === 'invoice'
                ? `Issue Tax Invoice (${formatINR(totals.grandTotalPaise)})`
                : `Save & Share Quotation (${formatINR(totals.grandTotalPaise)})`}
            </span>
          </button>
        </div>
      </div>

      {/* ================= EDIT LINE DESCRIPTION MODAL ================= */}
      {editingItemDesc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-paper-surface border border-border rounded-panel p-5 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-ink">Edit Item Description / Note</h3>
            <p className="text-xs text-ink-muted">
              One-off bill note (e.g. "Cut pipe to 3 m length", "Include brass washers", etc.)
            </p>
            <textarea
              rows={3}
              value={editingItemDesc.text}
              onChange={e => setEditingItemDesc({ ...editingItemDesc, text: e.target.value })}
              className="w-full text-xs p-2 rounded-control border border-border bg-paper text-ink focus:border-primary focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingItemDesc(null)}
                className="px-3 py-1.5 border border-border rounded-control text-xs text-ink hover:bg-paper-sunken"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLineDesc}
                className="px-4 py-1.5 bg-primary text-primary-foreground rounded-control text-xs font-bold hover:bg-primary-hover"
              >
                Save to Line
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= HELD BILLS DRAWER ================= */}
      {showHeldDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <div className="bg-paper-surface w-full max-w-sm h-full p-4 shadow-xl flex flex-col justify-between overflow-y-auto border-l border-border">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                <h3 className="font-bold text-sm text-ink">Held Bills Queue</h3>
                <button onClick={() => setShowHeldDrawer(false)}>
                  <X className="h-5 w-5 text-ink-muted hover:text-ink" />
                </button>
              </div>

              {heldBills.length === 0 ? (
                <p className="text-xs text-ink-muted py-6 text-center">No held bills right now.</p>
              ) : (
                <div className="space-y-3">
                  {heldBills.map(hb => (
                    <div
                      key={hb.id}
                      className="border border-border bg-paper p-3 rounded-panel space-y-2 text-xs"
                    >
                      <div className="flex justify-between font-bold text-ink">
                        <span>{hb.partyName}</span>
                        <span className="text-ink-muted text-[11px]">
                          {new Date(hb.heldAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-ink-muted text-[11px]">
                        {hb.itemsCount} items {hb.siteName ? `· Site: ${hb.siteName}` : ''}
                      </p>
                      <div className="flex justify-end gap-2 pt-1 border-t border-border">
                        <button
                          onClick={() => handleDiscardHeldBill(hb.id)}
                          className="text-[11px] text-semantic-danger font-medium px-2 py-1"
                        >
                          Discard
                        </button>
                        <button
                          onClick={() => handleResumeBill(hb.id)}
                          className="text-[11px] bg-primary text-primary-foreground font-bold px-3 py-1 rounded-control hover:bg-primary-hover"
                        >
                          Resume Bill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= POST-SETTLEMENT PRINT / SHARE CONFIRMATION ================= */}
      {showPrintModal && settlementSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
          <div className="bg-paper-surface border border-border rounded-panel max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-semantic-positive">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-bold text-sm">
                  {settlementSuccess.number.startsWith('INV') ? 'Tax Invoice Issued!' : 'Estimate Created!'}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setSettlementSuccess(null);
                }}
                className="p-1 rounded-control text-ink-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Print Format Tabs */}
            <div className="flex rounded-control border border-border overflow-hidden text-xs font-semibold">
              <button
                onClick={() => setPrintFormat('80mm')}
                className={`flex-1 py-1.5 text-center ${
                  printFormat === '80mm'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-paper text-ink-muted hover:text-ink'
                }`}
              >
                80mm Thermal Slip
              </button>
              <button
                onClick={() => setPrintFormat('58mm')}
                className={`flex-1 py-1.5 text-center ${
                  printFormat === '58mm'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-paper text-ink-muted hover:text-ink'
                }`}
              >
                58mm Thermal
              </button>
              <button
                onClick={() => setPrintFormat('a4')}
                className={`flex-1 py-1.5 text-center ${
                  printFormat === 'a4'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-paper text-ink-muted hover:text-ink'
                }`}
              >
                A4 Tax Sheet
              </button>
            </div>

            {/* Bill Preview Paper */}
            <div
              className={`p-4 bg-white text-black border border-slate-300 rounded font-mono text-[11px] space-y-2 shadow-inner ${
                printFormat === '58mm' ? 'max-w-[280px] mx-auto' : 'max-w-md mx-auto'
              }`}
            >
              <div className="text-center border-b pb-2">
                <h4 className="font-bold text-xs uppercase">{settings.shopName}</h4>
                <p className="text-[10px] text-gray-600">{settings.tagline}</p>
                <p className="text-[10px] text-gray-600">{settings.address}</p>
                <p className="text-[10px] font-bold">GSTIN: {settings.gstin}</p>
              </div>

              <div className="flex justify-between border-b pb-1 text-[10px]">
                <span>Doc: {settlementSuccess.number}</span>
                <span>{new Date(settlementSuccess.issuedAt || settlementSuccess.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="text-[10px] border-b pb-1">
                <div>Client: {settlementSuccess.partyName}</div>
                {settlementSuccess.siteName && <div>Site: {settlementSuccess.siteName}</div>}
              </div>

              {/* Items List with TWO-LINE FORMAT */}
              <div className="space-y-1.5 border-b pb-2 pt-1">
                {(settlementSuccess.items || []).map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{it.name}</span>
                      <span>{formatINR(it.totalPaise)}</span>
                    </div>
                    <div className="text-[10px] text-gray-600 break-words leading-tight pl-2">
                      {it.description}
                      {it.sizeSpec ? ` (${it.sizeSpec})` : ''}
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 pl-2">
                      <span>{it.qtyUnits} {it.unit} @ {formatINR(it.ratePaise)}</span>
                      <span>GST {it.gstRate}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right pt-1 font-bold">
                <div className="flex justify-between">
                  <span>Grand Total:</span>
                  <span className="text-xs">{formatINR(settlementSuccess.totals?.grandTotalPaise || 0)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="py-2.5 bg-primary text-primary-foreground font-bold rounded-control text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover"
              >
                <Printer className="h-4 w-4" />
                <span>Print Slip</span>
              </button>

              <a
                target="_blank"
                rel="noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Bharat Hardware Bill ${settlementSuccess.number} for ${settlementSuccess.partyName}. Amount: INR ${(
                    (settlementSuccess.totals?.grandTotalPaise || 0) / 100
                  ).toFixed(2)}. Thank you for your business!`
                )}`}
                className="py-2.5 bg-semantic-positive text-white font-bold rounded-control text-xs flex items-center justify-center gap-1.5 hover:opacity-90"
              >
                <Share2 className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setSettlementSuccess(null);
                  resetPosState();
                }}
                className="py-2.5 bg-accent text-accent-foreground font-bold rounded-control text-xs flex items-center justify-center gap-1.5 hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                <span>+ New Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= QUICK ADD NEW ITEM IN-SEARCH SHEET ================= */}
      {showQuickAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-paper-surface border border-border rounded-panel p-5 max-w-md w-full space-y-3 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-bold text-sm text-ink">Quick Add Item Directly into Bill</h3>
              <button onClick={() => setShowQuickAddItem(false)}>
                <X className="h-4 w-4 text-ink-muted hover:text-ink" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-2 text-xs">
              <div>
                <label className="block font-semibold mb-0.5 text-ink">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hex Bolt M12 x 75"
                  value={quickNewItem.name}
                  onChange={e => setQuickNewItem({ ...quickNewItem, name: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                />
              </div>

              <div>
                <label className="block font-semibold mb-0.5 text-ink">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High tensile grade 8.8 galvanized bolt"
                  value={quickNewItem.description}
                  onChange={e => setQuickNewItem({ ...quickNewItem, description: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-0.5 text-ink">Retail Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quickNewItem.retailPriceRupees}
                    onChange={e => setQuickNewItem({ ...quickNewItem, retailPriceRupees: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-0.5 text-ink">Contractor Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quickNewItem.contractorPriceRupees}
                    onChange={e => setQuickNewItem({ ...quickNewItem, contractorPriceRupees: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowQuickAddItem(false)}
                  className="px-3 py-1.5 border border-border rounded-control text-ink hover:bg-paper-sunken"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded-control hover:bg-primary-hover"
                >
                  Add Straight to Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosBillingPage;
