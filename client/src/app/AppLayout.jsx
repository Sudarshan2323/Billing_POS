import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Receipt,
  FileText,
  Package,
  PlusCircle,
  Users,
  BookOpen,
  BarChart3,
  Moon,
  Sun,
  HardHat,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Palette,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { HARDWARE_CATEGORIES, HARDWARE_UNITS, saveProduct } from '../lib/storage';
import { AiChatbot } from '../components/AiChatbot';

export const AppLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      document.documentElement.classList.contains('dark') ||
      (window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false)
    );
  });
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  // Quick Add Item Form State
  const [quickItem, setQuickItem] = useState({
    name: '',
    description: '',
    sizeSpec: '',
    brand: '',
    category: 'Pipes & Fittings',
    unit: 'pcs',
    hsn: '3917',
    retailPriceRupees: '',
    contractorPriceRupees: '',
    purchasePriceRupees: '',
    gstRate: 18,
    stockUnits: '25',
    reorderUnits: '10',
    rackLocation: '',
  });

  const handleSaveQuickItem = e => {
    e.preventDefault();
    if (!quickItem.name || !quickItem.retailPriceRupees) return;

    saveProduct({
      name: quickItem.name,
      description: quickItem.description,
      sizeSpec: quickItem.sizeSpec,
      brand: quickItem.brand,
      category: quickItem.category,
      unit: quickItem.unit,
      hsn: quickItem.hsn || '8481',
      retailPricePaise: Math.round(Number(quickItem.retailPriceRupees) * 100),
      contractorPricePaise: Math.round(
        Number(quickItem.contractorPriceRupees || quickItem.retailPriceRupees) * 100
      ),
      purchasePricePaise: Math.round(Number(quickItem.purchasePriceRupees || 0) * 100),
      gstRate: Number(quickItem.gstRate) || 18,
      stockUnits: Number(quickItem.stockUnits) || 0,
      reorderUnits: Number(quickItem.reorderUnits) || 5,
      rackLocation: quickItem.rackLocation || 'Rack A-1',
    });

    setShowQuickAddModal(false);
    setQuickItem({
      name: '',
      description: '',
      sizeSpec: '',
      brand: '',
      category: 'Pipes & Fittings',
      unit: 'pcs',
      hsn: '3917',
      retailPriceRupees: '',
      contractorPriceRupees: '',
      purchasePriceRupees: '',
      gstRate: 18,
      stockUnits: '25',
      reorderUnits: '10',
      rackLocation: '',
    });

    navigate('/products');
  };

  const navLinks = [
    { to: '/billing', label: 'New Bill (POS)', icon: Receipt, badge: 'F2' },
    { to: '/invoices', label: 'Bills & Estimates', icon: FileText },
    { to: '/products', label: 'Inventory & Items', icon: Package },
    { to: '/parties', label: 'Customers & Khata', icon: Users },
    { to: '/reports', label: 'Reports', icon: BarChart3, adminOnly: true },
    { to: '/dev/ui', label: 'Design Tokens', icon: Palette },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-paper text-ink antialiased">
      {/* ================= DESKTOP PERSISTENT COLLAPSIBLE SIDEBAR ================= */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border bg-paper-surface transition-all duration-200 z-20',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground font-bold text-sm shadow-sm">
              <HardHat className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <span className="font-bold tracking-tight text-ink text-xs sm:text-sm block truncate">
                  Bharat Hardware
                </span>
                <span className="block text-[10px] text-ink-muted leading-none truncate">
                  Electricals & Building Mat.
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-control text-ink-muted hover:text-ink hover:bg-paper-sunken"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navLinks.map((item, idx) => {
            const Icon = item.icon;
            if (item.isButton) {
              return (
                <button
                  key={idx}
                  onClick={item.action}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-control px-3 py-2 text-xs font-semibold text-primary bg-paper-sunken hover:bg-border transition-colors',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                  title={item.label}
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            }

            const isActive =
              location.pathname === item.to ||
              (item.to.includes('?') && location.pathname + location.search === item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-control px-3 py-2.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-ink-muted hover:bg-paper-sunken hover:text-ink',
                  sidebarCollapsed && 'justify-center px-2'
                )}
                title={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1 rounded bg-paper-sunken text-ink-muted">
                        {item.badge}
                      </span>
                    )}
                    {item.adminOnly && (
                      <span className="text-[9px] font-semibold uppercase px-1 rounded bg-accent/20 text-accent font-bold">
                        Admin
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                <CheckCircle2 className="h-3 w-3 text-semantic-positive" />
                <span>Offline Ledger Mode</span>
              </div>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-control border border-border text-ink-muted hover:text-ink hover:bg-paper-sunken"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN COLUMN ================= */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-paper-surface px-3 sm:px-6 z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile/Tablet */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden flex items-center justify-center h-11 w-11 rounded-control text-ink-muted hover:text-ink hover:bg-paper-sunken"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Shop Identity */}
            <div className="flex items-center gap-2">
              <div className="flex md:hidden h-8 w-8 items-center justify-center rounded-control bg-primary text-primary-foreground font-bold">
                <HardHat className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-ink text-xs sm:text-sm">
                  Bharat Hardware & Electricals
                </span>
                <span className="hidden sm:inline text-ink-muted text-xs ml-2 font-mono">
                  GSTIN: 27AABCB1234F1Z2
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="md:hidden p-2 rounded-control border border-border text-ink-muted"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4" />}
            </button>

            <NavLink
              to="/billing"
              className="inline-flex items-center gap-1.5 rounded-control bg-primary text-primary-foreground px-3.5 py-2 text-xs font-bold hover:bg-primary-hover shadow-sm min-h-[44px]"
            >
              <Receipt className="h-4 w-4" />
              <span>+ New Bill</span>
            </NavLink>
          </div>
        </header>

        {/* Routed Content Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ================= MOBILE SLIDE-IN DRAWER (SHEET) ================= */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div
            ref={drawerRef}
            className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-paper-surface shadow-2xl z-50 p-4 justify-between border-r border-border"
          >
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-control bg-primary text-primary-foreground font-bold">
                    <HardHat className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xs text-ink leading-tight">
                      Bharat Hardware
                    </h2>
                    <span className="text-[10px] text-ink-muted">POS & Credit System</span>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-control text-ink-muted hover:text-ink min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="space-y-1">
                {navLinks.map((item, idx) => {
                  const Icon = item.icon;
                  if (item.isButton) {
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setDrawerOpen(false);
                          item.action();
                        }}
                        className="w-full flex items-center gap-3 rounded-control px-3 py-3 text-xs font-semibold text-primary bg-paper-sunken min-h-[44px]"
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{item.label}</span>
                      </button>
                    );
                  }

                  const isActive =
                    location.pathname === item.to ||
                    (item.to.includes('?') && location.pathname + location.search === item.to);

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        'flex items-center justify-between rounded-control px-3 py-3 text-xs font-medium transition-colors min-h-[44px]',
                        isActive
                          ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                          : 'text-ink-muted hover:bg-paper-sunken hover:text-ink'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.adminOnly && (
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                          Admin
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom Status */}
            <div className="border-t border-border pt-3 text-xs text-ink-muted">
              <div className="flex items-center justify-between">
                <span>FY 2026-27</span>
                <span className="text-[10px] text-semantic-positive font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Warm Ledger Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= QUICK ADD NEW ITEM SHEET / MODAL ================= */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
          <div className="bg-paper-surface text-ink border border-border rounded-panel max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink">Add New Hardware Item</h3>
                <p className="text-xs text-ink-muted">Quickly add to catalog and stock</p>
              </div>
              <button
                onClick={() => setShowQuickAddModal(false)}
                className="p-1 rounded-control text-ink-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-ink">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Astral CPVC Pipe 1 inch (3 m)"
                  value={quickItem.name}
                  onChange={e => setQuickItem({ ...quickItem, name: e.target.value })}
                  className="w-full rounded-control border border-border bg-paper p-2 text-xs text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-ink">Size / Specification</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 inch dia, 3m"
                    value={quickItem.sizeSpec}
                    onChange={e => setQuickItem({ ...quickItem, sizeSpec: e.target.value })}
                    className="w-full rounded-control border border-border bg-paper p-2 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Astral / Havells"
                    value={quickItem.brand}
                    onChange={e => setQuickItem({ ...quickItem, brand: e.target.value })}
                    className="w-full rounded-control border border-border bg-paper p-2 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">Detailed Description *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. SDR 11 Class 1 CPVC pressure pipe for hot and cold domestic water"
                  value={quickItem.description}
                  onChange={e => setQuickItem({ ...quickItem, description: e.target.value })}
                  className="w-full rounded-control border border-border bg-paper p-2 text-xs text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-ink">Category</label>
                  <select
                    value={quickItem.category}
                    onChange={e => setQuickItem({ ...quickItem, category: e.target.value })}
                    className="w-full rounded-control border border-border bg-paper p-2 text-xs font-medium text-ink focus:border-primary focus:outline-none"
                  >
                    {HARDWARE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">Unit of Measurement</label>
                  <select
                    value={quickItem.unit}
                    onChange={e => setQuickItem({ ...quickItem, unit: e.target.value })}
                    className="w-full rounded-control border border-border bg-paper p-2 text-xs font-medium text-ink focus:border-primary focus:outline-none"
                  >
                    {HARDWARE_UNITS.map(u => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-ink">Retail Rate (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="450"
                    value={quickItem.retailPriceRupees}
                    onChange={e => setQuickItem({ ...quickItem, retailPriceRupees: e.target.value })}
                    className="w-full rounded-control border border-border bg-paper p-2 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">Contractor (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="410"
                    value={quickItem.contractorPriceRupees}
                    onChange={e => setQuickItem({ ...quickItem, contractorPriceRupees: e.target.value })}
                    className="w-full rounded-control border border-border bg-paper p-2 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">GST Slab %</label>
                  <select
                    value={quickItem.gstRate}
                    onChange={e => setQuickItem({ ...quickItem, gstRate: Number(e.target.value) })}
                    className="w-full rounded-control border border-border bg-paper p-2 text-xs font-medium text-ink focus:border-primary focus:outline-none"
                  >
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard Hardware)</option>
                    <option value={28}>28% (Paint / Cement)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-ink">Initial Stock Units</label>
                  <input
                    type="number"
                    value={quickItem.stockUnits}
                    onChange={e => setQuickItem({ ...quickItem, stockUnits: e.target.value })}
                    className="w-full rounded-control border border-border bg-paper p-2 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">Rack / Storage Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Yard Pipe Rack 2"
                    value={quickItem.rackLocation}
                    onChange={e => setQuickItem({ ...quickItem, rackLocation: e.target.value })}
                    className="w-full rounded-control border border-border bg-paper p-2 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-3 py-2 border border-border rounded-control text-ink hover:bg-paper-sunken min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-control hover:bg-primary-hover min-h-[44px]"
                >
                  Save Item to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Munim AI Chatbot Copilot */}
      <AiChatbot />
    </div>
  );
};

export default AppLayout;
