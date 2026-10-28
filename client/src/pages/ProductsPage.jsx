import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  X,
  Edit2,
  Copy,
  Trash2,
  History,
  HardHat,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatINR } from '../lib/utils';
import {
  getProducts,
  saveProduct,
  bulkSaveProducts,
  adjustProductStock,
  deleteProduct,
  getProductHistory,
  HARDWARE_CATEGORIES,
  HARDWARE_UNITS,
} from '../lib/storage';

export const ProductsPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const paramTab = searchParams.get('tab');

  // Tabs: 'inventory' | 'add_item' | 'import_excel'
  const [activeTab, setActiveTab] = useState(
    paramTab === 'add_item' || paramTab === 'add'
      ? 'add_item'
      : paramTab === 'import' || paramTab === 'import_excel'
      ? 'import_excel'
      : 'inventory'
  );

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'add_item' || tab === 'add') setActiveTab('add_item');
    else if (tab === 'import' || tab === 'import_excel') setActiveTab('import_excel');
  }, [location.search]);

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  // Edit Product Modal
  const [editingProduct, setEditingProduct] = useState(null);

  // Adjust Stock Modal
  const [showAdjustModal, setShowAdjustModal] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock count discrepancy');

  // Stock Movement History Drawer
  const [historyProduct, setHistoryProduct] = useState(null);
  const [productMovements, setProductMovements] = useState([]);

  // Form State for "Add New Item" Tab
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    sizeSpec: '',
    brand: '',
    category: 'Plumbing',
    unit: 'pcs',
    hsn: '3917',
    retailPriceRupees: '',
    contractorPriceRupees: '',
    purchasePriceRupees: '',
    gstRate: 18,
    stockUnits: '20',
    reorderUnits: '5',
    rackLocation: 'Aisle 1',
  });
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // Excel / CSV Bulk Import State
  const [importedRows, setImportedRows] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [importSuccessMessage, setImportSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setProducts(getProducts());
  };

  const handleOpenEditModal = prod => {
    setEditingProduct(prod);
    setItemForm({
      name: prod.name,
      description: prod.description || '',
      sizeSpec: prod.sizeSpec || '',
      brand: prod.brand || '',
      category: prod.category || 'Plumbing',
      unit: prod.unit || 'pcs',
      hsn: prod.hsn || '',
      retailPriceRupees: ((prod.retailPricePaise || 0) / 100).toFixed(2),
      contractorPriceRupees: ((prod.contractorPricePaise || prod.retailPricePaise || 0) / 100).toFixed(2),
      purchasePriceRupees: ((prod.purchasePricePaise || 0) / 100).toFixed(2),
      gstRate: prod.gstRate || 18,
      stockUnits: String(prod.stockUnits || 0),
      reorderUnits: String(prod.reorderUnits || 5),
      rackLocation: prod.rackLocation || '',
    });
  };

  const handleDuplicateProduct = prod => {
    saveProduct({
      ...prod,
      id: undefined,
      name: `${prod.name} (Copy)`,
    });
    loadProducts();
  };

  const handleDeleteProduct = prodId => {
    if (confirm('Are you sure you want to delete this hardware item?')) {
      deleteProduct(prodId);
      loadProducts();
    }
  };

  const handleOpenHistory = prod => {
    setHistoryProduct(prod);
    setProductMovements(getProductHistory(prod.id));
  };

  const handleSaveProduct = e => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.retailPriceRupees) return;

    saveProduct({
      id: editingProduct ? editingProduct.id : undefined,
      name: itemForm.name,
      description: itemForm.description,
      sizeSpec: itemForm.sizeSpec,
      brand: itemForm.brand,
      category: itemForm.category,
      unit: itemForm.unit,
      hsn: itemForm.hsn,
      retailPricePaise: Math.round(Number(itemForm.retailPriceRupees) * 100),
      contractorPricePaise: Math.round(
        Number(itemForm.contractorPriceRupees || itemForm.retailPriceRupees) * 100
      ),
      purchasePricePaise: Math.round(Number(itemForm.purchasePriceRupees || 0) * 100),
      gstRate: Number(itemForm.gstRate) || 18,
      stockUnits: Number(itemForm.stockUnits) || 0,
      reorderUnits: Number(itemForm.reorderUnits) || 5,
      rackLocation: itemForm.rackLocation || 'Front Rack',
    });

    if (editingProduct) {
      setEditingProduct(null);
    } else {
      setFormSuccessMessage(`"${itemForm.name}" added to catalog successfully!`);
      setTimeout(() => setFormSuccessMessage(''), 4000);
      setItemForm({
        name: '',
        description: '',
        sizeSpec: '',
        brand: '',
        category: 'Plumbing',
        unit: 'pcs',
        hsn: '3917',
        retailPriceRupees: '',
        contractorPriceRupees: '',
        purchasePriceRupees: '',
        gstRate: 18,
        stockUnits: '20',
        reorderUnits: '5',
        rackLocation: 'Aisle 1',
      });
      setActiveTab('inventory');
    }
    loadProducts();
  };

  const handleAdjustStock = e => {
    e.preventDefault();
    if (!showAdjustModal || !adjustQty) return;

    adjustProductStock(showAdjustModal.id, Number(adjustQty), adjustReason);
    setShowAdjustModal(null);
    setAdjustQty('');
    loadProducts();
  };

  // Export current catalog as CSV
  const handleExportCSV = () => {
    const rows = [
      ['Item Name', 'Description', 'Spec', 'Brand', 'Category', 'Unit', 'Stock Qty', 'Retail Price', 'Contractor Price', 'Rack'],
    ];
    products.forEach(p => {
      rows.push([
        `"${p.name}"`,
        `"${p.description}"`,
        `"${p.sizeSpec}"`,
        `"${p.brand}"`,
        p.category,
        p.unit,
        p.stockUnits,
        ((p.retailPricePaise || 0) / 100).toFixed(2),
        ((p.contractorPricePaise || 0) / 100).toFixed(2),
        `"${p.rackLocation || ''}"`,
      ]);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bharat_Hardware_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Excel / CSV Import Template
  const handleDownloadTemplate = (format = 'xlsx') => {
    const sampleTemplateData = [
      {
        Name: 'Astral PVC Pipe 1 inch (6 m)',
        Description: 'Heavy duty Schedule 40 pressure pipe',
        SizeSpec: '1 inch dia, 6 m length',
        Brand: 'Astral Pipes',
        Category: 'Pipes & Fittings',
        Unit: 'pcs',
        HSN: '3917',
        RetailPrice: 490,
        ContractorPrice: 440,
        PurchasePrice: 380,
        GSTRate: 18,
        Stock: 50,
        ReorderLevel: 20,
        RackLocation: 'Yard P-1',
      },
      {
        Name: 'Polycab Copper Wire 1.5 sq mm (90 m)',
        Description: 'FR PVC fire-resistant multi-strand cable',
        SizeSpec: '1.5 sq mm, 90 meter roll',
        Brand: 'Polycab',
        Category: 'Electrical',
        Unit: 'roll',
        HSN: '8544',
        RetailPrice: 2250,
        ContractorPrice: 1980,
        PurchasePrice: 1650,
        GSTRate: 18,
        Stock: 25,
        ReorderLevel: 10,
        RackLocation: 'Shelf E-1',
      },
      {
        Name: 'Asian Paints Apex 4 L',
        Description: 'Exterior weather-proof acrylic emulsion',
        SizeSpec: '4 Litre Bucket',
        Brand: 'Asian Paints',
        Category: 'Paint',
        Unit: 'ltr',
        HSN: '3209',
        RetailPrice: 1480,
        ContractorPrice: 1320,
        PurchasePrice: 1100,
        GSTRate: 28,
        Stock: 12,
        ReorderLevel: 5,
        RackLocation: 'Aisle Paint-2',
      },
      {
        Name: 'Hex Bolt M10 x 50 with Nut',
        Description: 'High tensile grade 8.8 galvanized bolt',
        SizeSpec: 'M10 dia, 50 mm length',
        Brand: 'Unbrako',
        Category: 'Fasteners',
        Unit: 'pcs',
        HSN: '7318',
        RetailPrice: 22,
        ContractorPrice: 18,
        PurchasePrice: 12,
        GSTRate: 18,
        Stock: 250,
        ReorderLevel: 100,
        RackLocation: 'Bin F-4',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleTemplateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hardware_Catalog');

    if (format === 'csv') {
      XLSX.writeFile(wb, 'hardware_items_import_template.csv');
    } else {
      XLSX.writeFile(wb, 'hardware_items_import_template.xlsx');
    }
  };

  // Handle Excel / CSV File Upload & Parsing
  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (json.length === 0) {
          alert('Uploaded spreadsheet has no rows or data.');
          return;
        }

        const parsed = json.map((row, idx) => {
          const name = String(row['Name'] || row['Item Name'] || row['name'] || row['Title'] || '').trim();
          const description = String(row['Description'] || row['description'] || row['Desc'] || name).trim();
          const sizeSpec = String(row['SizeSpec'] || row['Size/Spec'] || row['Size'] || row['Spec'] || '').trim();
          const brand = String(row['Brand'] || row['brand'] || row['Manufacturer'] || '').trim();
          const category = String(row['Category'] || row['category'] || 'Tools').trim();
          const unit = String(row['Unit'] || row['unit'] || 'pcs').trim();
          const hsn = String(row['HSN'] || row['hsn'] || '3917').trim();
          const retailPrice = Number(row['RetailPrice'] || row['Retail Price'] || row['retailPrice'] || row['Price'] || row['Rate'] || 0);
          const contractorPrice = Number(row['ContractorPrice'] || row['Contractor Price'] || row['contractorPrice'] || retailPrice);
          const purchasePrice = Number(row['PurchasePrice'] || row['Purchase Price'] || row['purchasePrice'] || 0);
          const gstRate = Number(row['GSTRate'] || row['GST Rate'] || row['gstRate'] || row['GST'] || 18);
          const stock = Number(row['Stock'] || row['StockUnits'] || row['Qty'] || row['stock'] || 0);
          const reorderLevel = Number(row['ReorderLevel'] || row['Reorder Level'] || row['MinStock'] || 5);
          const rackLocation = String(row['RackLocation'] || row['Rack Location'] || row['Rack'] || row['Location'] || '').trim();

          const isValid = Boolean(name) && retailPrice > 0;
          const error = !name ? 'Item name missing' : retailPrice <= 0 ? 'Retail price must be > 0' : null;

          return {
            rowNum: idx + 2,
            name,
            description,
            sizeSpec,
            brand,
            category,
            unit,
            hsn,
            retailPriceRupees: retailPrice,
            contractorPriceRupees: contractorPrice,
            purchasePriceRupees: purchasePrice,
            gstRate,
            stockUnits: stock,
            reorderUnits: reorderLevel,
            rackLocation,
            isValid,
            error,
          };
        });

        setImportedRows(parsed);
        setImportFileName(file.name);
      } catch (err) {
        alert('Failed to parse spreadsheet: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Confirm and Bulk Save Imported Items
  const handleConfirmImport = () => {
    const validItems = importedRows.filter(r => r.isValid);
    if (validItems.length === 0) return;

    const toSave = validItems.map(item => ({
      name: item.name,
      description: item.description,
      sizeSpec: item.sizeSpec,
      brand: item.brand,
      category: item.category,
      unit: item.unit,
      hsn: item.hsn,
      retailPricePaise: Math.round(item.retailPriceRupees * 100),
      contractorPricePaise: Math.round(item.contractorPriceRupees * 100),
      purchasePricePaise: Math.round(item.purchasePriceRupees * 100),
      gstRate: item.gstRate,
      stockUnits: item.stockUnits,
      reorderUnits: item.reorderUnits,
      rackLocation: item.rackLocation || 'Storage Yard',
    }));

    bulkSaveProducts(toSave);
    loadProducts();
    setImportSuccessMessage(`Successfully imported ${validItems.length} items from ${importFileName}!`);
    setTimeout(() => setImportSuccessMessage(''), 5000);
    setImportedRows([]);
    setImportFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveTab('inventory');
  };

  const filtered = products.filter(p => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
      (p.sizeSpec && p.sizeSpec.toLowerCase().includes(search.toLowerCase()));

    const matchCat = !selectedCategory || p.category === selectedCategory;

    let matchStock = true;
    if (stockFilter === 'low') {
      matchStock = p.stockUnits <= p.reorderUnits && p.stockUnits > 0;
    } else if (stockFilter === 'out') {
      matchStock = p.stockUnits <= 0;
    }

    return matchSearch && matchCat && matchStock;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-ink">
              Hardware Inventory & Items
            </h1>
            <span className="bg-paper-sunken border border-border text-ink-muted text-xs px-2 py-0.5 rounded-control font-semibold">
              {products.length} SKUs Catalogued
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Real-time stock balance, dual retail/contractor pricing, specifications, and bulk Excel import
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'inventory' && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-control bg-paper-surface text-ink hover:bg-paper-sunken min-h-[44px]"
            >
              <Download className="h-4 w-4" />
              <span>Export Catalog</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('add_item')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-control bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add New Item</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar: Inventory Catalog vs + Add New Item vs Import Excel */}
      <div className="flex border-b border-border gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'inventory'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Inventory Catalog ({products.length})</span>
        </button>

        <button
          onClick={() => {
            setEditingProduct(null);
            setActiveTab('add_item');
          }}
          className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'add_item'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>+ Add New Item</span>
        </button>

        <button
          onClick={() => setActiveTab('import_excel')}
          className={`pb-2.5 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'import_excel'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Import Excel / CSV</span>
        </button>
      </div>

      {/* Success Messages */}
      {importSuccessMessage && (
        <div className="p-3 bg-paper-sunken border border-border rounded-control text-xs font-semibold text-semantic-positive flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{importSuccessMessage}</span>
        </div>
      )}

      {formSuccessMessage && (
        <div className="p-3 bg-paper-sunken border border-border rounded-control text-xs font-semibold text-semantic-positive flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{formSuccessMessage}</span>
        </div>
      )}

      {/* ================= TAB 1: INVENTORY CATALOG ================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-paper-surface border border-border p-3 rounded-panel">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-muted" />
              <input
                type="text"
                placeholder="Search items, specs, brands..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-control border border-border bg-paper text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="text-xs rounded-control border border-border bg-paper text-ink p-1.5 font-medium focus:border-primary focus:outline-none"
              >
                <option value="">All Categories</option>
                {HARDWARE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Stock Level Filter */}
              <div className="flex rounded-control border border-border overflow-hidden text-xs">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`px-2.5 py-1 font-medium transition-colors ${
                    stockFilter === 'all'
                      ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                      : 'bg-paper text-ink-muted hover:text-ink'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStockFilter('low')}
                  className={`px-2.5 py-1 font-medium transition-colors ${
                    stockFilter === 'low'
                      ? 'bg-semantic-warning text-white font-bold'
                      : 'bg-paper text-ink-muted hover:text-ink'
                  }`}
                >
                  Low Stock
                </button>
                <button
                  onClick={() => setStockFilter('out')}
                  className={`px-2.5 py-1 font-medium transition-colors ${
                    stockFilter === 'out'
                      ? 'bg-semantic-danger text-white font-bold'
                      : 'bg-paper text-ink-muted hover:text-ink'
                  }`}
                >
                  Out of Stock
                </button>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="border border-border rounded-panel bg-paper-surface overflow-x-auto">
            <table className="w-full text-left dense-table">
              <thead>
                <tr>
                  <th>Item Name & Description</th>
                  <th>Category & Brand</th>
                  <th>Stock Status</th>
                  <th className="text-right">Retail Rate</th>
                  <th className="text-right">Contractor Rate</th>
                  <th>Location</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-xs text-ink-muted">
                      No hardware items found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map(item => {
                    const isLow = item.stockUnits <= item.reorderUnits && item.stockUnits > 0;
                    const isOut = item.stockUnits <= 0;

                    return (
                      <tr key={item.id} className="hover:bg-paper">
                        <td className="max-w-xs">
                          <div className="font-bold text-ink text-xs">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-ink-muted leading-snug mt-0.5 break-words">
                            {item.description}
                            {item.sizeSpec ? ` · Spec: ${item.sizeSpec}` : ''}
                          </div>
                        </td>

                        <td>
                          <div className="text-xs font-semibold text-ink">{item.category}</div>
                          <div className="text-[10px] text-ink-muted">{item.brand || 'Generic'}</div>
                        </td>

                        <td>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-ink">
                              {item.stockUnits} {item.unit}
                            </span>
                            {isOut ? (
                              <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded font-bold">
                                Out
                              </span>
                            ) : isLow ? (
                              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-bold">
                                Low
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[10px] text-ink-faint">Min: {item.reorderUnits} {item.unit}</span>
                        </td>

                        <td className="text-right font-mono font-bold tabular-nums text-xs text-ink">
                          {formatINR(item.retailPricePaise)}
                        </td>

                        <td className="text-right font-mono tabular-nums text-xs text-primary font-bold">
                          {formatINR(item.contractorPricePaise || item.retailPricePaise)}
                        </td>

                        <td className="text-xs text-ink-muted font-mono">
                          {item.rackLocation || '-'}
                        </td>

                        <td className="text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setShowAdjustModal(item);
                              setAdjustQty('');
                            }}
                            className="px-2 py-1 border border-border rounded-control text-xs bg-paper hover:bg-paper-sunken font-medium text-ink"
                            title="Adjust Stock Qty"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1 text-ink-muted hover:text-ink"
                            title="Edit Item"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(item)}
                            className="p-1 text-ink-muted hover:text-ink"
                            title="Duplicate Item"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenHistory(item)}
                            className="p-1 text-ink-muted hover:text-ink"
                            title="Stock Movement History"
                          >
                            <History className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(item.id)}
                            className="p-1 text-ink-muted hover:text-semantic-danger"
                            title="Delete Item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ADD NEW ITEM FORM ================= */}
      {activeTab === 'add_item' && (
        <div className="bg-paper-surface border border-border rounded-panel p-6 shadow-sm max-w-3xl">
          <div className="border-b border-border pb-3 mb-4">
            <h2 className="text-base font-bold text-ink">
              Add New Hardware Item
            </h2>
            <p className="text-xs text-ink-muted">
              Add directly to inventory catalog with pricing tiers and specifications
            </p>
          </div>

          <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-ink">Item Title / Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. PVC Pipe 1 inch (6 m)"
                value={itemForm.name}
                onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                className="w-full p-2.5 border border-border rounded-control bg-paper text-ink font-bold focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-ink">Size / Dimension / Spec</label>
                <input
                  type="text"
                  placeholder="e.g. 1 inch dia, 6 m length"
                  value={itemForm.sizeSpec}
                  onChange={e => setItemForm({ ...itemForm, sizeSpec: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-ink">Brand / Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. Astral / Havells / Asian Paints"
                  value={itemForm.brand}
                  onChange={e => setItemForm({ ...itemForm, brand: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-ink">Detailed Description * (Prominent on Bills)</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Heavy duty Schedule 40 plumbing pressure pipe for main line supply"
                value={itemForm.description}
                onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                className="w-full p-2 border border-border rounded-control bg-paper text-ink focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-ink">Category</label>
                <select
                  value={itemForm.category}
                  onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink font-medium focus:border-primary focus:outline-none"
                >
                  {HARDWARE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-ink">Unit</label>
                <select
                  value={itemForm.unit}
                  onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink font-medium focus:border-primary focus:outline-none"
                >
                  {HARDWARE_UNITS.map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-ink">HSN Code</label>
                <input
                  type="text"
                  placeholder="3917"
                  value={itemForm.hsn}
                  onChange={e => setItemForm({ ...itemForm, hsn: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink font-mono focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Pricing Tiers */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-paper-sunken rounded-control border border-border">
              <div>
                <label className="block font-semibold mb-1 text-ink">Retail Rate (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="490.00"
                  value={itemForm.retailPriceRupees}
                  onChange={e => setItemForm({ ...itemForm, retailPriceRupees: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-ink">Contractor Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="440.00"
                  value={itemForm.contractorPriceRupees}
                  onChange={e => setItemForm({ ...itemForm, contractorPriceRupees: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-ink">GST Slab Rate</label>
                <select
                  value={itemForm.gstRate}
                  onChange={e => setItemForm({ ...itemForm, gstRate: Number(e.target.value) })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink font-medium"
                >
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18% (Standard Hardware)</option>
                  <option value={28}>28% (Paints & Cement)</option>
                </select>
              </div>
            </div>

            {/* Stock & Location */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-ink">Opening Stock Units</label>
                <input
                  type="number"
                  value={itemForm.stockUnits}
                  onChange={e => setItemForm({ ...itemForm, stockUnits: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-ink">Reorder Minimum</label>
                <input
                  type="number"
                  value={itemForm.reorderUnits}
                  onChange={e => setItemForm({ ...itemForm, reorderUnits: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-ink">Rack / Bay Location</label>
                <input
                  type="text"
                  placeholder="Yard Rack P-1"
                  value={itemForm.rackLocation}
                  onChange={e => setItemForm({ ...itemForm, rackLocation: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="px-4 py-2 border border-border rounded-control text-ink hover:bg-paper-sunken"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-control hover:bg-primary-hover shadow-sm"
              >
                Save Item to Inventory
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 3: IMPORT EXCEL / CSV ================= */}
      {activeTab === 'import_excel' && (
        <div className="space-y-6">
          {/* Instructions and Template Download */}
          <div className="bg-paper-surface border border-border rounded-panel p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span>Bulk Hardware Inventory Import (Excel & CSV)</span>
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Import hundreds of items in one click. Download the template below, populate your items, and upload.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="px-3 py-1.5 bg-paper-sunken border border-border text-ink hover:bg-border rounded-control text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5 text-primary" />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleDownloadTemplate('csv')}
                  className="px-3 py-1.5 bg-paper-sunken border border-border text-ink hover:bg-border rounded-control text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5 text-accent" />
                  <span>Download CSV (.csv)</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Upload Area */}
            <div className="border-2 border-dashed border-border hover:border-primary rounded-panel p-8 text-center bg-paper transition-colors">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-primary opacity-80 mb-2" />
              <p className="text-xs font-bold text-ink">
                Choose Excel or CSV spreadsheet to upload
              </p>
              <p className="text-[11px] text-ink-muted mt-1">
                Supports .xlsx, .xls, and .csv files. Columns: Name, Description, SizeSpec, Brand, Category, Unit, HSN, RetailPrice, ContractorPrice, Stock
              </p>
              <div className="mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-control file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover file:cursor-pointer cursor-pointer text-ink-muted"
                />
              </div>
            </div>
          </div>

          {/* Parsed Preview Table */}
          {importedRows.length > 0 && (
            <div className="bg-paper-surface border border-border rounded-panel p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-ink">
                    File Preview: <span className="font-mono text-primary">{importFileName}</span>
                  </span>
                  <span className="bg-paper-sunken border border-border px-2 py-0.5 rounded-control text-[11px] font-semibold text-ink">
                    {importedRows.filter(r => r.isValid).length} valid of {importedRows.length} total rows
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setImportedRows([]);
                      setImportFileName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-3 py-1.5 border border-border rounded-control text-xs text-ink hover:bg-paper-sunken"
                  >
                    Clear
                  </button>
                  <button
                    disabled={importedRows.filter(r => r.isValid).length === 0}
                    onClick={handleConfirmImport}
                    className="px-4 py-1.5 bg-primary text-primary-foreground rounded-control text-xs font-bold hover:bg-primary-hover shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Import ({importedRows.filter(r => r.isValid).length} Items)</span>
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto max-h-96 border border-border rounded-control">
                <table className="w-full text-left dense-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Item Name & Description</th>
                      <th>Spec & Brand</th>
                      <th>Category & Unit</th>
                      <th className="text-right">Retail Rate</th>
                      <th className="text-right">Contractor Rate</th>
                      <th>Stock Qty</th>
                      <th>Rack Loc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-paper' : 'bg-rose-50/50'}>
                        <td>
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-semantic-positive">
                              <CheckCircle2 className="h-3 w-3" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-semantic-danger">
                              <AlertCircle className="h-3 w-3" /> {row.error}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="font-bold text-xs text-ink">{row.name}</div>
                          <div className="text-[11px] text-ink-muted truncate max-w-xs">{row.description}</div>
                        </td>
                        <td>
                          <div className="text-xs text-ink">{row.sizeSpec || '-'}</div>
                          <div className="text-[10px] text-ink-muted">{row.brand || 'Generic'}</div>
                        </td>
                        <td>
                          <div className="text-xs text-ink">{row.category}</div>
                          <div className="text-[10px] text-ink-muted">per {row.unit}</div>
                        </td>
                        <td className="text-right font-mono tabular-nums text-xs font-bold text-ink">
                          {formatINR(Math.round(row.retailPriceRupees * 100))}
                        </td>
                        <td className="text-right font-mono tabular-nums text-xs text-primary font-bold">
                          {formatINR(Math.round(row.contractorPriceRupees * 100))}
                        </td>
                        <td className="font-mono text-xs text-ink">{row.stockUnits}</td>
                        <td className="text-xs text-ink-muted">{row.rackLocation || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
          <div className="bg-paper-surface border border-border rounded-panel max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-sm text-ink">
                Edit Hardware Item
              </h3>
              <button onClick={() => setEditingProduct(null)}>
                <X className="h-5 w-5 text-ink-muted hover:text-ink" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-ink">Item Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PVC Pipe 1 inch (6 m)"
                  value={itemForm.name}
                  onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink font-bold focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-ink">Size / Dimension / Spec</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 inch dia, 6 m length"
                    value={itemForm.sizeSpec}
                    onChange={e => setItemForm({ ...itemForm, sizeSpec: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">Brand / Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Astral / Havells / Asian Paints"
                    value={itemForm.brand}
                    onChange={e => setItemForm({ ...itemForm, brand: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">Detailed Description * (Prominent on Bills)</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Heavy duty Schedule 40 plumbing pressure pipe for main line supply"
                  value={itemForm.description}
                  onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-ink">Category</label>
                  <select
                    value={itemForm.category}
                    onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink font-medium focus:border-primary focus:outline-none"
                  >
                    {HARDWARE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">Unit</label>
                  <select
                    value={itemForm.unit}
                    onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink font-medium focus:border-primary focus:outline-none"
                  >
                    {HARDWARE_UNITS.map(u => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">HSN Code</label>
                  <input
                    type="text"
                    placeholder="3917"
                    value={itemForm.hsn}
                    onChange={e => setItemForm({ ...itemForm, hsn: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Pricing Tiers */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-paper-sunken rounded-control border border-border">
                <div>
                  <label className="block font-semibold mb-1 text-ink">Retail Rate (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemForm.retailPriceRupees}
                    onChange={e => setItemForm({ ...itemForm, retailPriceRupees: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">Contractor Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Wholesale rate"
                    value={itemForm.contractorPriceRupees}
                    onChange={e => setItemForm({ ...itemForm, contractorPriceRupees: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">GST Slab Rate</label>
                  <select
                    value={itemForm.gstRate}
                    onChange={e => setItemForm({ ...itemForm, gstRate: Number(e.target.value) })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink font-medium"
                  >
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard Hardware)</option>
                    <option value={28}>28% (Paints & Cement)</option>
                  </select>
                </div>
              </div>

              {/* Stock & Storage */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-ink">Stock Units</label>
                  <input
                    type="number"
                    value={itemForm.stockUnits}
                    onChange={e => setItemForm({ ...itemForm, stockUnits: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">Reorder Minimum</label>
                  <input
                    type="number"
                    value={itemForm.reorderUnits}
                    onChange={e => setItemForm({ ...itemForm, reorderUnits: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">Rack / Bay Location</label>
                  <input
                    type="text"
                    placeholder="Yard Rack P-1"
                    value={itemForm.rackLocation}
                    onChange={e => setItemForm({ ...itemForm, rackLocation: e.target.value })}
                    className="w-full p-2 border border-border rounded-control bg-paper text-ink"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3 py-1.5 border border-border rounded-control text-ink hover:bg-paper-sunken"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded-control hover:bg-primary-hover"
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADJUST STOCK MODAL ================= */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-paper-surface border border-border rounded-panel p-5 max-w-md w-full space-y-3 shadow-2xl">
            <h3 className="font-bold text-sm text-ink">Adjust Stock — {showAdjustModal.name}</h3>
            <p className="text-xs text-ink-muted">
              Current recorded stock: <strong className="text-ink">{showAdjustModal.stockUnits} {showAdjustModal.unit}</strong>
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-ink">Adjustment Delta (e.g. +10 or -5) *</label>
                <input
                  type="number"
                  required
                  placeholder="+5 or -2"
                  value={adjustQty}
                  onChange={e => setAdjustQty(e.target.value)}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">Mandatory Audit Reason *</label>
                <select
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full p-2 border border-border rounded-control bg-paper text-ink font-medium"
                >
                  <option value="Physical count discrepancy">Physical count discrepancy</option>
                  <option value="Damaged / Broken goods">Damaged / Broken goods</option>
                  <option value="Direct supplier unbilled delivery">Direct supplier unbilled delivery</option>
                  <option value="Site contractor return">Site contractor return</option>
                  <option value="Sample / Display piece">Sample / Display piece</option>
                </select>
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
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= STOCK MOVEMENT HISTORY DRAWER ================= */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <div className="bg-paper-surface border-l border-border w-full max-w-md h-full p-5 shadow-xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                <div>
                  <h3 className="font-bold text-sm text-ink">Stock History</h3>
                  <p className="text-xs text-ink-muted">{historyProduct.name}</p>
                </div>
                <button onClick={() => setHistoryProduct(null)}>
                  <X className="h-5 w-5 text-ink-muted hover:text-ink" />
                </button>
              </div>

              {productMovements.length === 0 ? (
                <p className="text-xs text-ink-muted py-6 text-center">
                  No manual adjustments recorded yet. Automatic sales deductions occur upon invoicing.
                </p>
              ) : (
                <div className="space-y-3">
                  {productMovements.map(m => (
                    <div key={m.id} className="border border-border bg-paper p-2.5 rounded-control text-xs space-y-1">
                      <div className="flex justify-between font-bold text-ink">
                        <span>{m.deltaUnits > 0 ? `+${m.deltaUnits}` : m.deltaUnits} units</span>
                        <span className="text-[11px] text-ink-muted">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-ink-muted text-[11px]">{m.reason}</p>
                      <div className="text-[10px] text-ink-faint">
                        Resulting stock: {m.resultingStock}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
