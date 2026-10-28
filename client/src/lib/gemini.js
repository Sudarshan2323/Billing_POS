import { getProducts, getParties, getInvoices, getSettings } from './storage.js';

const GEMINI_API_KEY_STORAGE = 'billbook_gemini_api_key';
const GEMINI_MODEL_STORAGE = 'billbook_gemini_model';
const DEFAULT_MODEL = (import.meta.env && import.meta.env.VITE_GEMINI_MODEL) || 'gemini-1.5-flash';

/**
 * Retrieve the configured Gemini API key
 */
export function getGeminiApiKey() {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem(GEMINI_API_KEY_STORAGE) ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ''
  );
}

/**
 * Save Gemini API key to local storage
 */
export function saveGeminiApiKey(key) {
  if (typeof window === 'undefined') return;
  if (!key) {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
  } else {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
  }
}

/**
 * Retrieve configured Gemini model name
 */
export function getGeminiModel() {
  if (typeof window === 'undefined') return DEFAULT_MODEL;
  return localStorage.getItem(GEMINI_MODEL_STORAGE) || DEFAULT_MODEL;
}

/**
 * Save preferred Gemini model
 */
export function saveGeminiModel(model) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GEMINI_MODEL_STORAGE, model || DEFAULT_MODEL);
}

/**
 * Compile shop context (catalog, khata debtors, recent sales) for Gemini system prompt
 */
export function buildShopContext() {
  try {
    const settings = getSettings() || {};
    const products = getProducts() || [];
    const parties = getParties() || [];
    const invoices = (getInvoices() || []).slice(0, 15);

    // Summarize inventory items (first 40 items with key metrics)
    const itemsSummary = products.slice(0, 40).map(p => ({
      name: p.name,
      category: p.category,
      unit: p.unit,
      spec: p.sizeSpec,
      rack: p.rackLocation || 'Front Yard',
      stock: p.stockUnits,
      reorder: p.reorderUnits,
      retailPrice: `₹${((p.retailPricePaise || 0) / 100).toFixed(2)}`,
      contractorPrice: `₹${((p.contractorPricePaise || p.retailPricePaise || 0) / 100).toFixed(2)}`,
      gstRate: `${p.gstRate}%`,
    }));

    // Summarize debtors / parties
    const debtorsSummary = parties
      .filter(p => p.balancePaise > 0)
      .map(p => ({
        name: p.name,
        type: p.type,
        tier: p.priceTier,
        mobile: p.mobile,
        due: `₹${((p.balancePaise || 0) / 100).toFixed(2)}`,
        limit: `₹${((p.creditLimitPaise || 0) / 100).toFixed(2)}`,
      }));

    return {
      shopName: settings.shopName || 'Bharat Hardware & Electricals',
      shopAddress: settings.address || 'Shop #4, Market Yard, Pune',
      gstin: settings.gstin || '27AABCB1234F1Z2',
      totalCatalogSKUs: products.length,
      sampleInventory: itemsSummary,
      debtorsList: debtorsSummary,
      recentInvoicesCount: invoices.length,
    };
  } catch (err) {
    console.error('Error building shop context for AI:', err);
    return {};
  }
}

/**
 * Send chat message to Google Gemini API
 * @param {Array<{role: 'user' | 'model', parts: Array<{text: string}>}>} conversationHistory
 * @param {string} customApiKey Optional user-supplied key
 */
export async function sendGeminiChatMessage(conversationHistory, customApiKey = '') {
  const apiKey = (customApiKey || getGeminiApiKey()).trim();

  if (!apiKey) {
    throw new Error(
      'Gemini API Key is missing. Please click the Settings gear icon in the chat header to enter your API key.'
    );
  }

  const model = getGeminiModel();
  const context = buildShopContext();

  const systemInstruction = `
You are "Munim AI", the expert, friendly, and lightning-fast AI Shop Assistant & Copilot for "${context.shopName || 'Bharat Hardware & Electricals'}" (GSTIN: ${context.gstin || '27AABCB1234F1Z2'}, Address: ${context.shopAddress || 'Market Yard, Pune'}).
The shop sells plumbing pipes & fittings, electricals, paints, fasteners, sanitaryware, adhesives, tools, and construction building material.

You have LIVE ACCESS to the shop's database:
- Inventory Catalog (${context.totalCatalogSKUs || 0} total SKUs). Sample items: ${JSON.stringify(context.sampleInventory || [])}
- Contractors & Khata Ledger Debtors: ${JSON.stringify(context.debtorsList || [])}

Your capabilities:
1. Inventory & Rack Lookup: Tell users the exact stock, rack location, specifications, and retail vs contractor wholesale prices.
2. Khata & Outstanding Dues: Summarize who owes money, identify overdue accounts, and alert if anyone is near their credit limit.
3. Polite Payment Reminders: Draft polite, effective WhatsApp payment collection messages in English, Hindi, or Hinglish for any contractor/debtor with their exact balance.
4. POS Pricing & Bill Estimation: Calculate totals with GST and dual pricing tiers (Retail vs Contractor).
5. If the user asks you to add or calculate items for a bill, summarize them cleanly with rates, quantities, and GST.

Rules:
- Be concise, clear, and business-focused. Shopkeepers and contractors need quick, crisp answers without fluff.
- Always use Indian Rupee currency format (₹).
- Format lists and tables using clear markdown formatting.
- If an item or customer is not found in the sample inventory or database, inform the user politely and offer the closest matching hardware item.
`.trim();

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: conversationHistory,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
      topP: 0.95,
    },
  };

  let apiError = null;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      const candidate = data.candidates?.[0];
      if (candidate?.content?.parts?.[0]?.text) {
        return candidate.content.parts[0].text;
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      apiError =
        errorData.error?.message ||
        `Gemini API returned status ${response.status} (${response.statusText})`;
    }
  } catch (err) {
    apiError = err.message || 'Network error connecting to Gemini API';
  }

  // Check if query can be answered using Local Shop Engine
  const lastUserMsg = conversationHistory
    .slice()
    .reverse()
    .find(m => m.role === 'user')?.parts?.[0]?.text || '';

  const localAnswer = executeLocalShopQuery(lastUserMsg);

  if (localAnswer) {
    if (apiError && apiError.includes('denied access')) {
      return `${localAnswer}\n\n---\n> ℹ️ *Answer computed via Local Munim Engine. Note: The configured Google Cloud key returned 403 ("Your project has been denied access"). For full arbitrary generative chat, verify Google Cloud Console project permissions or use a key from https://aistudio.google.com/app/apikey.*`;
    }
    return localAnswer;
  }

  if (apiError) {
    if (apiError.includes('denied access')) {
      throw new Error(
        `Gemini Access Error (403): "Your project has been denied access." Please verify Google Cloud Console permissions or generate a key from https://aistudio.google.com/app/apikey.`
      );
    }
    throw new Error(apiError);
  }

  throw new Error('No response text received from Gemini API.');
}

/**
 * Local offline query resolution engine using live shop localStorage data
 */
export function executeLocalShopQuery(query) {
  if (!query) return null;
  const q = query.toLowerCase();
  const products = getProducts() || [];
  const parties = getParties() || [];
  const settings = getSettings() || {};

  // 1. Low stock inquiry
  if (q.includes('low') || q.includes('shortage') || q.includes('out of stock')) {
    const low = products.filter(p => p.stockUnits <= p.reorderUnits);
    if (low.length === 0) {
      return '✅ **All items have healthy stock!** None are currently below their reorder levels.';
    }
    const lines = low
      .slice(0, 8)
      .map(
        p =>
          `• **${p.name}**: **${p.stockUnits} ${p.unit}** remaining (Reorder at ${p.reorderUnits}) — Rack: \`${p.rackLocation || 'Storage Yard'}\``
      );
    return `⚠️ **Low Stock Alert (${low.length} SKUs require replenishment)**:\n\n${lines.join(
      '\n'
    )}\n\n*Action: Suggested to initiate procurement with suppliers.*`;
  }

  // 2. Khata / Debtors inquiry
  if (
    q.includes('khata') ||
    q.includes('owe') ||
    q.includes('due') ||
    q.includes('debt') ||
    q.includes('balance') ||
    q.includes('highest') ||
    q.includes('overdue')
  ) {
    const debtors = parties
      .filter(p => p.balancePaise > 0)
      .sort((a, b) => b.balancePaise - a.balancePaise);
    if (debtors.length === 0) {
      return '🎉 **Zero Outstanding Dues!** All customer and contractor ledger balances are completely settled.';
    }
    const lines = debtors
      .slice(0, 6)
      .map(
        (p, idx) =>
          `${idx + 1}. **${p.name}** (${p.type || 'Contractor'}): **₹${(
            (p.balancePaise || 0) / 100
          ).toFixed(2)}** due — 📞 \`${p.mobile}\``
      );
    const totalDue = debtors.reduce((sum, p) => sum + p.balancePaise, 0);
    return `💰 **Top Outstanding Khata Balances (Total: ₹${(totalDue / 100).toFixed(
      2
    )})**:\n\n${lines.join('\n')}\n\n*Tip: Say "draft reminder for [name]" to generate a WhatsApp collection message.*`;
  }

  // 3. Payment reminder drafting
  if (q.includes('reminder') || q.includes('whatsapp') || q.includes('message')) {
    const matched =
      parties.find(p => q.includes(p.name.toLowerCase().split(' ')[0])) ||
      parties.find(p => p.balancePaise > 0) || {
        name: 'Contractor',
        balancePaise: 1250000,
        mobile: '9822012345',
      };
    const dueRupees = ((matched.balancePaise || 0) / 100).toFixed(2);
    return `📱 **WhatsApp Collection Reminder for ${matched.name}**:\n\n> *"Namaste ${
      matched.name
    } ji, polite reminder from ${
      settings.shopName || 'Bharat Hardware & Electricals'
    }. Your outstanding ledger balance is **₹${dueRupees}**. Kindly arrange payment settlement via UPI or NEFT at your earliest convenience. Thank you!"*\n\n📞 Send to: \`${
      matched.mobile
    }\``;
  }

  // 4. Rack / location inquiry
  if (
    q.includes('where') ||
    q.includes('rack') ||
    q.includes('locate') ||
    q.includes('find') ||
    q.includes('stored')
  ) {
    const words = q.split(/\s+/).filter(w => w.length > 2 && !['where', 'the', 'is', 'item', 'rack', 'stored', 'and'].includes(w));
    const matched = products.find(p =>
      words.some(word => p.name.toLowerCase().includes(word) || (p.description && p.description.toLowerCase().includes(word)))
    );
    if (matched) {
      return `📍 **Storage Location for ${matched.name}**:\n• **Rack / Yard**: **${
        matched.rackLocation || 'Front Yard Shelf'
      }**\n• **Current Stock**: ${matched.stockUnits} ${matched.unit}\n• **Retail Price**: ₹${(
        (matched.retailPricePaise || 0) / 100
      ).toFixed(2)}\n• **Contractor Wholesale Rate**: ₹${(
        (matched.contractorPricePaise || matched.retailPricePaise || 0) / 100
      ).toFixed(2)}`;
    }
  }

  // 5. Rates & pricing comparison
  if (q.includes('rate') || q.includes('price') || q.includes('cost') || q.includes('compare')) {
    const words = q.split(/\s+/).filter(w => w.length > 2 && !['rate', 'price', 'cost', 'compare', 'for', 'the', 'what', 'is'].includes(w));
    const matched = products.find(p =>
      words.some(word => p.name.toLowerCase().includes(word))
    ) || products[0];
    if (matched) {
      const retail = Number(((matched.retailPricePaise || 0) / 100).toFixed(2));
      const contractor = Number(((matched.contractorPricePaise || matched.retailPricePaise || 0) / 100).toFixed(2));
      return `🏷️ **Dual Price Tiers for ${matched.name}**:\n• **Retail Customer Rate**: **₹${retail.toFixed(2)}** per ${matched.unit}\n• **Contractor / Wholesale Rate**: **₹${contractor.toFixed(2)}** per ${matched.unit} *(Savings: ₹${(retail - contractor).toFixed(2)})*\n• **GST Rate**: ${matched.gstRate || 18}%\n• **Physical Stock**: ${matched.stockUnits} ${matched.unit} at \`${matched.rackLocation || 'Main Aisle'}\``;
    }
  }

  return null;
}

/**
 * Validate an API key by sending a ping request
 */
export async function testGeminiApiKey(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'API key is empty.' };
  }

  try {
    const model = getGeminiModel();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Ping. Reply with: OK' }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        message: err.error?.message || `Validation failed (${response.status})`,
      };
    }

    return { success: true, message: 'Gemini API Key is valid and working!' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
