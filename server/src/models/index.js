import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// 1. User
const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 2. Business
const BusinessSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gstin: { type: String, trim: true, uppercase: true },
    stateCode: { type: String, required: true, default: '27' }, // default Maharashtra
    address: {
      line1: { type: String, default: '' },
      city: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    phone: { type: String, default: '' },
    invoiceSettings: {
      prefix: { type: String, default: 'INV' },
      template: { type: String, enum: ['a4', 'thermal80', 'thermal58'], default: 'a4' },
      terms: { type: String, default: 'Goods once sold will not be taken back.' },
      footer: { type: String, default: 'Thank you for your visit!' },
      upiId: { type: String, default: '' },
    },
    financialYearStartMonth: { type: Number, default: 4 },
    allowNegativeStock: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 3. Membership
const MembershipSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['owner', 'manager', 'cashier', 'accountant'], default: 'owner' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);
MembershipSchema.index({ businessId: 1, userId: 1 }, { unique: true });

// 4. Product
const ProductSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true },
    hsn: { type: String, default: '0000' },
    unit: { type: String, default: 'pcs' },
    purchasePricePaise: { type: Number, default: 0 },
    sellingPricePaise: { type: Number, required: true },
    mrpPaise: { type: Number },
    gstRate: { type: Number, default: 5 }, // 0, 5, 12, 18, 28
    taxInclusive: { type: Boolean, default: false },
    reorderLevelMilli: { type: Number, default: 5000 }, // 5 units
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
ProductSchema.index({ businessId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ businessId: 1, barcode: 1 });
ProductSchema.index({ businessId: 1, name: 'text' });

// 5. Stock Movement (Append-only ledger)
const StockMovementSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    type: {
      type: String,
      enum: ['opening', 'sale', 'purchase', 'sale_return', 'purchase_return', 'adjustment'],
      required: true,
    },
    qtyMilli: { type: Number, required: true }, // positive for inbound, negative for outbound
    refType: { type: String },
    refId: { type: Schema.Types.ObjectId },
    unitCostPaise: { type: Number, default: 0 },
    reason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
StockMovementSchema.index({ businessId: 1, productId: 1, createdAt: -1 });

// 6. Stock Balance (Denormalized)
const StockBalanceSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    qtyMilli: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
StockBalanceSchema.index({ businessId: 1, productId: 1 }, { unique: true });

// 7. Party (Customer / Supplier)
const PartySchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    type: { type: String, enum: ['customer', 'supplier', 'both'], default: 'customer' },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, default: '' },
    gstin: { type: String, uppercase: true, trim: true },
    stateCode: { type: String, default: '27' },
    address: { type: String, default: '' },
    creditLimitPaise: { type: Number, default: 0 },
    openingBalancePaise: { type: Number, default: 0 },
    isWalkIn: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
PartySchema.index({ businessId: 1, mobile: 1 });

// 8. Invoice
const InvoiceItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    nameSnapshot: { type: String, required: true },
    hsn: { type: String, default: '' },
    unit: { type: String, default: 'pcs' },
    qtyMilli: { type: Number, required: true },
    ratePaise: { type: Number, required: true },
    discountPaise: { type: Number, default: 0 },
    taxableValuePaise: { type: Number, required: true },
    gstRate: { type: Number, required: true },
    cgstPaise: { type: Number, default: 0 },
    sgstPaise: { type: Number, default: 0 },
    igstPaise: { type: Number, default: 0 },
    totalPaise: { type: Number, required: true },
  },
  { _id: false }
);

const InvoiceSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    number: { type: String, required: true },
    seq: { type: Number, required: true },
    fy: { type: String, required: true },
    status: { type: String, enum: ['draft', 'issued', 'cancelled'], default: 'issued' },
    partyId: { type: Schema.Types.ObjectId, ref: 'Party' },
    partySnapshot: {
      name: { type: String, default: 'Walk-in Customer' },
      mobile: { type: String, default: '' },
      gstin: { type: String, default: '' },
      stateCode: { type: String, default: '27' },
      address: { type: String, default: '' },
    },
    placeOfSupplyState: { type: String, default: '27' },
    isInterState: { type: Boolean, default: false },
    items: [InvoiceItemSchema],
    discountPaise: { type: Number, default: 0 },
    otherChargesPaise: { type: Number, default: 0 },
    totals: {
      taxableValuePaise: { type: Number, required: true },
      cgstPaise: { type: Number, default: 0 },
      sgstPaise: { type: Number, default: 0 },
      igstPaise: { type: Number, default: 0 },
      roundOffPaise: { type: Number, default: 0 },
      grandTotalPaise: { type: Number, required: true },
    },
    payments: [
      {
        mode: { type: String, enum: ['cash', 'upi', 'card', 'credit'], required: true },
        amountPaise: { type: Number, required: true },
        ref: { type: String, default: '' },
      },
    ],
    paidPaise: { type: Number, default: 0 },
    duePaise: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    idempotencyKey: { type: String, index: true },
    issuedAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
InvoiceSchema.index({ businessId: 1, fy: 1, seq: 1 }, { unique: true });
InvoiceSchema.index({ businessId: 1, createdAt: -1 });

// 9. Payment
const PaymentSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    partyId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
    direction: { type: String, enum: ['in', 'out'], default: 'in' },
    mode: { type: String, enum: ['cash', 'upi', 'card', 'bank'], default: 'cash' },
    amountPaise: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// 10. Counter (Sequential numbering per business & FY)
const CounterSchema = new Schema(
  {
    _id: { type: String, required: true }, // "{businessId}:{docType}:{fy}"
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

// 11. Audit Log
const AuditLogSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const User = model('User', UserSchema);
export const Business = model('Business', BusinessSchema);
export const Membership = model('Membership', MembershipSchema);
export const Product = model('Product', ProductSchema);
export const StockMovement = model('StockMovement', StockMovementSchema);
export const StockBalance = model('StockBalance', StockBalanceSchema);
export const Party = model('Party', PartySchema);
export const Invoice = model('Invoice', InvoiceSchema);
export const Payment = model('Payment', PaymentSchema);
export const Counter = model('Counter', CounterSchema);
export const AuditLog = model('AuditLog', AuditLogSchema);
