// WARUNG OS Data Store & LocalStorage Persistence
const STORAGE_KEY = 'WARUNG_OS_DATA_V1';

export function formatRupiah(amount) {
  const num = Math.round(Number(amount) || 0);
  return 'Rp' + num.toLocaleString('id-ID');
}

export function parseRupiahInput(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  // Remove non-digit characters
  const clean = value.toString().replace(/[^\d]/g, '');
  return parseInt(clean, 10) || 0;
}

let idCounter = 0;
export function generateId(prefix = 'id') {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

// Generate Realistic Demo Data matching user specs
export function getInitialDemoData() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayHour = (h, m = 0) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).toISOString();

  return {
    isOnboarded: true,
    warung: {
      id: 'warung-1',
      name: 'Warung Bu Siti',
      category: 'Sembako & Makanan',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    products: [
      {
        id: 'prod-1',
        name: 'Indomie Goreng',
        emoji: '🍜',
        sellingPrice: 3500,
        costPrice: 2800,
        stock: 20,
        unit: 'bungkus',
        lowStockThreshold: 5
      },
      {
        id: 'prod-2',
        name: 'Indomie Soto',
        emoji: '🍲',
        sellingPrice: 3500,
        costPrice: 2800,
        stock: 15,
        unit: 'bungkus',
        lowStockThreshold: 5
      },
      {
        id: 'prod-3',
        name: 'Telur',
        emoji: '🥚',
        sellingPrice: 3000,
        costPrice: 2400,
        stock: 12,
        unit: 'butir',
        lowStockThreshold: 5
      },
      {
        id: 'prod-4',
        name: 'Es Teh',
        emoji: '🥤',
        sellingPrice: 4000,
        costPrice: 1500,
        stock: 20,
        unit: 'gelas',
        lowStockThreshold: 5
      },
      {
        id: 'prod-5',
        name: 'Kopi',
        emoji: '☕',
        sellingPrice: 5000,
        costPrice: 3000,
        stock: 10,
        unit: 'cangkir',
        lowStockThreshold: 4
      }
    ],
    // 24 transactions today totaling Rp487.000
    sales: [
      {
        id: 'sale-1',
        total: 45000,
        cashReceived: 50000,
        change: 5000,
        isDebt: false,
        debtorId: null,
        items: [
          { productId: 'prod-1', name: 'Indomie Goreng', quantity: 6, price: 3500, subtotal: 21000 },
          { productId: 'prod-3', name: 'Telur', quantity: 8, price: 3000, subtotal: 24000 }
        ],
        createdAt: todayHour(7, 0)
      },
      {
        id: 'sale-2',
        total: 35000,
        cashReceived: 50000,
        change: 15000,
        isDebt: false,
        debtorId: null,
        items: [
          { productId: 'prod-5', name: 'Kopi', quantity: 3, price: 5000, subtotal: 15000 },
          { productId: 'prod-4', name: 'Es Teh', quantity: 5, price: 4000, subtotal: 20000 }
        ],
        createdAt: todayHour(8, 0)
      },
      {
        id: 'sale-3',
        total: 70000,
        cashReceived: 100000,
        change: 30000,
        isDebt: false,
        debtorId: null,
        items: [
          { productId: 'prod-1', name: 'Indomie Goreng', quantity: 10, price: 3500, subtotal: 35000 },
          { productId: 'prod-2', name: 'Indomie Soto', quantity: 10, price: 3500, subtotal: 35000 }
        ],
        createdAt: todayHour(9, 0)
      },
      {
        id: 'sale-4',
        total: 62000,
        cashReceived: 100000,
        change: 38000,
        isDebt: false,
        debtorId: null,
        items: [
          { productId: 'prod-3', name: 'Telur', quantity: 14, price: 3000, subtotal: 42000 },
          { productId: 'prod-5', name: 'Kopi', quantity: 4, price: 5000, subtotal: 20000 }
        ],
        createdAt: todayHour(10, 0)
      },
      {
        id: 'sale-5',
        total: 55000,
        cashReceived: 60000,
        change: 5000,
        isDebt: false,
        debtorId: null,
        items: [
          { productId: 'prod-4', name: 'Es Teh', quantity: 5, price: 4000, subtotal: 20000 },
          { productId: 'prod-1', name: 'Indomie Goreng', quantity: 10, price: 3500, subtotal: 35000 }
        ],
        createdAt: todayHour(11, 0)
      },
      {
        id: 'sale-6',
        total: 80000,
        cashReceived: 100000,
        change: 20000,
        isDebt: false,
        debtorId: null,
        items: [
          { productId: 'prod-3', name: 'Telur', quantity: 10, price: 3000, subtotal: 30000 },
          { productId: 'prod-5', name: 'Kopi', quantity: 10, price: 5000, subtotal: 50000 }
        ],
        createdAt: todayHour(12, 0)
      },
      {
        id: 'sale-7',
        total: 60000,
        cashReceived: 100000,
        change: 40000,
        isDebt: false,
        debtorId: null,
        items: [
          { productId: 'prod-2', name: 'Indomie Soto', quantity: 10, price: 3500, subtotal: 35000 },
          { productId: 'prod-5', name: 'Kopi', quantity: 5, price: 5000, subtotal: 25000 }
        ],
        createdAt: todayHour(13, 0)
      },
      {
        id: 'sale-8',
        total: 80000,
        cashReceived: 80000,
        change: 0,
        isDebt: false,
        debtorId: null,
        items: [
          { productId: 'prod-4', name: 'Es Teh', quantity: 10, price: 4000, subtotal: 40000 },
          { productId: 'prod-3', name: 'Telur', quantity: 10, price: 3000, subtotal: 30000 },
          { productId: 'prod-5', name: 'Kopi', quantity: 2, price: 5000, subtotal: 10000 }
        ],
        createdAt: todayHour(14, 0)
      }
    ],
    // Total expenses today: Rp125.000 -> Sisa kas = Rp487.000 - Rp125.000 = Rp362.000
    expenses: [
      {
        id: 'exp-1',
        category: 'Belanja barang',
        description: 'Kulakan telur & mie soto',
        amount: 100000,
        createdAt: todayHour(6, 30)
      },
      {
        id: 'exp-2',
        category: 'Listrik',
        description: 'Beli token listrik warung',
        amount: 25000,
        createdAt: todayHour(10, 30)
      }
    ],
    // 3 Debtors totaling Rp85.000: Budi Rp25k, Bu Siti Rp18k, Pak Joko Rp42k
    debts: [
      {
        id: 'debt-1',
        personName: 'Budi',
        totalDebt: 25000,
        status: 'active',
        createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
        history: [
          {
            id: 'dh-1',
            type: 'debt',
            amount: 25000,
            description: 'Indomie Goreng 4x, Kopi 2x, Es Teh 1x',
            createdAt: new Date(now.getTime() - 2 * 86400000).toISOString()
          }
        ]
      },
      {
        id: 'debt-2',
        personName: 'Bu Siti',
        totalDebt: 18000,
        status: 'active',
        createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
        history: [
          {
            id: 'dh-2',
            type: 'debt',
            amount: 18000,
            description: 'Telur 6 butir',
            createdAt: new Date(now.getTime() - 1 * 86400000).toISOString()
          }
        ]
      },
      {
        id: 'debt-3',
        personName: 'Pak Joko',
        totalDebt: 42000,
        status: 'active',
        createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
        history: [
          {
            id: 'dh-3',
            type: 'debt',
            amount: 42000,
            description: 'Beras 2kg & Kopi 4 cangkir',
            createdAt: new Date(now.getTime() - 3 * 86400000).toISOString()
          }
        ]
      }
    ],
    settings: {
      fontSize: 'normal', // 'normal' | 'large' | 'xlarge'
      speechEnabled: true
    }
  };
}

class Store {
  constructor() {
    this.listeners = [];
    this.memoryStorage = null;
    this.data = this.load();
  }

  load() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } else if (this.memoryStorage) {
        return JSON.parse(this.memoryStorage);
      }
    } catch (e) {
      console.warn('Storage read fallback', e);
    }
    // Default to demo data so the app looks vibrant immediately
    const demo = getInitialDemoData();
    this.save(demo);
    return demo;
  }

  save(data = this.data) {
    this.data = data;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } else {
        this.memoryStorage = JSON.stringify(this.data);
      }
    } catch (e) {
      console.warn('Storage save fallback', e);
    }
    this.notify();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.data);
    }
  }

  // Getters
  getWarung() {
    return this.data.warung || { name: 'Warung Bu Siti', category: 'Sembako' };
  }

  getProducts() {
    return this.data.products || [];
  }

  getProductById(id) {
    return this.data.products.find((p) => p.id === id);
  }

  getLowStockProducts() {
    return this.data.products.filter(
      (p) => (p.stock || 0) <= (p.lowStockThreshold || 5)
    );
  }

  getSales() {
    return this.data.sales || [];
  }

  // All merchandise sales today (excludes debt payments)
  getTodayGoodsSales() {
    const today = new Date().toDateString();
    return (this.data.sales || []).filter((s) => {
      return new Date(s.createdAt).toDateString() === today && !s.isDebtPayment;
    });
  }

  // Total value of all goods sold today (whether cash or debt)
  getTodaySalesTotal() {
    return this.getTodayGoodsSales().reduce((sum, s) => sum + (s.total || 0), 0);
  }

  getTodaySalesCount() {
    return this.getTodayGoodsSales().length;
  }

  // Value of goods sold today that were paid in cash
  getTodaySalesPaid() {
    return this.getTodayGoodsSales()
      .filter((s) => !s.isDebt)
      .reduce((sum, s) => sum + (s.total || 0), 0);
  }

  // Value of goods sold today that were taken on debt (unpaid)
  getTodaySalesDebt() {
    return this.getTodayGoodsSales()
      .filter((s) => s.isDebt)
      .reduce((sum, s) => sum + (s.total || 0), 0);
  }

  // Total cash payments received today from debt settlements
  getTodayDebtPaymentsReceived() {
    const today = new Date().toDateString();
    return (this.data.sales || [])
      .filter((s) => new Date(s.createdAt).toDateString() === today && s.isDebtPayment)
      .reduce((sum, s) => sum + (s.total || 0), 0);
  }

  // Total actual physical cash collected today:
  // = (Cash from today's cash sales) + (Cash from debt repayments received today)
  getTodayCashReceived() {
    return this.getTodaySalesPaid() + this.getTodayDebtPaymentsReceived();
  }

  getExpenses() {
    return this.data.expenses || [];
  }

  getTodayExpenses() {
    const today = new Date().toDateString();
    return (this.data.expenses || []).filter((e) => {
      return new Date(e.createdAt).toDateString() === today;
    });
  }

  getTodayExpensesTotal() {
    return this.getTodayExpenses().reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  // Uang Tersisa: Real cash left in drawer today after expenses
  // = (Total cash collected today) - (Expenses today)
  getTodayUangTersisa() {
    return this.getTodayCashReceived() - this.getTodayExpensesTotal();
  }

  // Kas Awal Warung
  getKasAwal() {
    return (this.data.warung && this.data.warung.initialCash) || 0;
  }

  setKasAwal(amount) {
    if (!this.data.warung) this.data.warung = {};
    this.data.warung.initialCash = Number(amount) || 0;
    this.save();
  }

  // Uang Kas Akhir = Kas Awal + Uang Masuk Hari Ini - Pengeluaran Hari Ini
  getTodayUangKasAkhir() {
    return this.getKasAwal() + this.getTodayCashReceived() - this.getTodayExpensesTotal();
  }

  // Backward compatibility alias for any existing reference
  getTodayProfit() {
    return this.getTodayUangTersisa();
  }

  // ==========================================================================
  // V2.0 — PERIOD-BASED REPORTING METHODS ('today' | 'week' | 'month')
  // ==========================================================================

  isDateInPeriod(dateStr, period = 'today') {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();

    if (period === 'today') {
      return d.toDateString() === now.toDateString();
    }

    if (period === 'week' || period === '7days') {
      // 7 days inclusive: today minus 6 days at 00:00:00 local time
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return d >= weekStart && d <= endOfToday;
    }

    if (period === 'month') {
      // Current calendar month: 1st of month at 00:00:00 local time
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return d >= monthStart && d <= endOfToday;
    }

    return d.toDateString() === now.toDateString();
  }

  // Merchandise sales in period (excludes debt payments)
  getGoodsSalesByPeriod(period = 'today') {
    return (this.data.sales || []).filter((s) => {
      return this.isDateInPeriod(s.createdAt, period) && !s.isDebtPayment;
    });
  }

  // Total value of all goods sold in period (cash + debt)
  getSalesTotalByPeriod(period = 'today') {
    return this.getGoodsSalesByPeriod(period).reduce((sum, s) => sum + (s.total || 0), 0);
  }

  getSalesCountByPeriod(period = 'today') {
    return this.getGoodsSalesByPeriod(period).length;
  }

  // Value of goods sold in period paid in cash
  getSalesPaidByPeriod(period = 'today') {
    return this.getGoodsSalesByPeriod(period)
      .filter((s) => !s.isDebt)
      .reduce((sum, s) => sum + (s.total || 0), 0);
  }

  // Value of goods sold in period on debt
  getSalesDebtByPeriod(period = 'today') {
    return this.getGoodsSalesByPeriod(period)
      .filter((s) => s.isDebt)
      .reduce((sum, s) => sum + (s.total || 0), 0);
  }

  // Debt payments received in period
  getDebtPaymentsByPeriod(period = 'today') {
    return (this.data.sales || [])
      .filter((s) => this.isDateInPeriod(s.createdAt, period) && s.isDebtPayment)
      .reduce((sum, s) => sum + (s.total || 0), 0);
  }

  // Total actual physical cash received in period:
  // = (Cash from cash sales) + (Debt repayments received)
  getCashReceivedByPeriod(period = 'today') {
    return this.getSalesPaidByPeriod(period) + this.getDebtPaymentsByPeriod(period);
  }

  // Expenses in period
  getExpensesByPeriod(period = 'today') {
    return (this.data.expenses || []).filter((e) => {
      return this.isDateInPeriod(e.createdAt, period);
    });
  }

  getExpensesTotalByPeriod(period = 'today') {
    return this.getExpensesByPeriod(period).reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  // Ranking best selling products in period
  getBestSellersByPeriod(period = 'today', limit = 5) {
    const sales = this.getGoodsSalesByPeriod(period);
    const itemCounts = {};
    sales.forEach((s) => {
      (s.items || []).forEach((item) => {
        const key = item.name;
        itemCounts[key] = (itemCounts[key] || 0) + (item.quantity || 0);
      });
    });

    const products = this.getProducts();
    const productMap = new Map((products || []).map((p) => [p.name.toLowerCase().trim(), p]));

    return Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, quantity]) => {
        const p = productMap.get(name.toLowerCase().trim());
        return {
          name,
          quantity,
          emoji: p?.emoji || '🛍️',
          unit: p?.unit || 'barang'
        };
      });
  }

  getDebts() {
    return (this.data.debts || []).filter((d) => (d.totalDebt || 0) > 0);
  }

  getAllDebts() {
    return this.data.debts || [];
  }

  getTotalDebts() {
    return this.getDebts().reduce((sum, d) => sum + (d.totalDebt || 0), 0);
  }

  getSettings() {
    return this.data.settings || { fontSize: 'normal', speechEnabled: true };
  }

  // Actions
  updateWarung(name, category) {
    this.data.warung = {
      ...this.data.warung,
      name: name.trim() || 'Warung Saya',
      category: category || 'Campuran'
    };
    this.data.isOnboarded = true;
    this.save();
  }

  setOnboarded(val) {
    this.data.isOnboarded = !!val;
    this.save();
  }

  // Record a Sale
  recordSale({ items, total, cashReceived, change, isDebt, debtorId, debtorName }) {
    const saleId = generateId('sale');
    const nowIso = new Date().toISOString();

    // 1. Decrement product stock
    items.forEach((item) => {
      const prod = this.data.products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, (prod.stock || 0) - item.quantity);
      }
    });

    // 2. If it's debt, record to debts ledger
    let targetDebtorId = debtorId;
    if (isDebt) {
      if (!targetDebtorId && debtorName) {
        // Find existing debtor by name first to prevent duplicate entries
        const existing = (this.data.debts || []).find(
          (d) => d.personName.trim().toLowerCase() === debtorName.trim().toLowerCase()
        );
        if (existing) {
          targetDebtorId = existing.id;
        } else {
          // Create new debtor
          const newDebtor = {
            id: generateId('debt'),
            personName: debtorName.trim(),
            totalDebt: 0,
            status: 'active',
            createdAt: nowIso,
            history: []
          };
          if (!this.data.debts) this.data.debts = [];
          this.data.debts.unshift(newDebtor);
          targetDebtorId = newDebtor.id;
        }
      }
      if (targetDebtorId) {
        const debtor = this.data.debts.find((d) => d.id === targetDebtorId);
        if (debtor) {
          debtor.totalDebt = (debtor.totalDebt || 0) + total;
          debtor.status = 'active';
          if (!debtor.history) debtor.history = [];
          debtor.history.unshift({
            id: generateId('dh'),
            type: 'debt',
            amount: total,
            description: items.map((i) => `${i.name} × ${i.quantity}`).join(', '),
            createdAt: nowIso
          });
        }
      }
    }

    // 3. Record sale transaction
    const saleRecord = {
      id: saleId,
      total,
      cashReceived: isDebt ? 0 : cashReceived,
      change: isDebt ? 0 : change,
      isDebt: !!isDebt,
      debtorId: targetDebtorId || null,
      items,
      createdAt: nowIso
    };

    this.data.sales.unshift(saleRecord);
    this.save();
    return saleRecord;
  }

  // Add or Edit Product
  addProduct({ name, emoji = '📦', sellingPrice, costPrice = 0, stock = 10, unit = 'buah' }) {
    const newProd = {
      id: generateId('prod'),
      name: name.trim(),
      emoji: emoji || '📦',
      sellingPrice: Number(sellingPrice) || 0,
      costPrice: Number(costPrice) || 0,
      stock: Number(stock) || 0,
      unit: unit || 'buah',
      lowStockThreshold: 5
    };
    this.data.products.push(newProd);
    this.save();
    return newProd;
  }

  updateProduct(id, updates) {
    const prodIndex = this.data.products.findIndex((p) => p.id === id);
    if (prodIndex !== -1) {
      this.data.products[prodIndex] = {
        ...this.data.products[prodIndex],
        ...updates
      };
      this.save();
    }
  }

  deleteProduct(id) {
    this.data.products = this.data.products.filter((p) => p.id !== id);
    this.save();
  }

  // Expense
  addExpense({ category, description, amount }) {
    const newExpense = {
      id: generateId('exp'),
      category: category || 'Lainnya',
      description: (description || category).trim(),
      amount: Number(amount) || 0,
      createdAt: new Date().toISOString()
    };
    this.data.expenses.unshift(newExpense);
    this.save();
    return newExpense;
  }

  // Debt Management
  addDebtor(personName, initialDebt = 0, note = '') {
    const nowIso = new Date().toISOString();
    const newDebtor = {
      id: generateId('debt'),
      personName: personName.trim(),
      totalDebt: Number(initialDebt) || 0,
      status: 'active',
      createdAt: nowIso,
      history: initialDebt > 0 ? [
        {
          id: generateId('dh'),
          type: 'debt',
          amount: Number(initialDebt),
          description: note || 'Utang awal',
          createdAt: nowIso
        }
      ] : []
    };
    this.data.debts.unshift(newDebtor);
    this.save();
    return newDebtor;
  }

  addDebtToPerson(debtorId, amount, note = 'Belanja ngutang') {
    const debtor = this.data.debts.find((d) => d.id === debtorId);
    if (debtor) {
      const amt = Number(amount) || 0;
      debtor.totalDebt = (debtor.totalDebt || 0) + amt;
      debtor.status = 'active';
      if (!debtor.history) debtor.history = [];
      debtor.history.unshift({
        id: generateId('dh'),
        type: 'debt',
        amount: amt,
        description: note,
        createdAt: new Date().toISOString()
      });
      this.save();
      return debtor;
    }
    return null;
  }

  settleDebt(debtorId, paidAmount = null) {
    const debtor = this.data.debts.find((d) => d.id === debtorId);
    if (!debtor) return null;

    const amountToPay = paidAmount !== null ? Number(paidAmount) : debtor.totalDebt;
    const nowIso = new Date().toISOString();

    debtor.totalDebt = Math.max(0, (debtor.totalDebt || 0) - amountToPay);
    if (debtor.totalDebt === 0) {
      debtor.status = 'paid';
    }

    if (!debtor.history) debtor.history = [];
    debtor.history.unshift({
      id: generateId('dh'),
      type: 'payment',
      amount: amountToPay,
      description: 'Sudah bayar utang 😊',
      createdAt: nowIso
    });

    // Also record as a cash inflow in sales/pemasukan so cash stays accurate
    this.data.sales.unshift({
      id: generateId('sale-debtpay'),
      total: amountToPay,
      cashReceived: amountToPay,
      change: 0,
      isDebt: false,
      isDebtPayment: true,
      debtorId: debtor.id,
      items: [
        {
          productId: 'debt-settle',
          name: `Pembayaran Utang: ${debtor.personName}`,
          quantity: 1,
          price: amountToPay,
          subtotal: amountToPay
        }
      ],
      createdAt: nowIso
    });

    this.save();
    return debtor;
  }

  // Settings
  setFontSize(fontSize) {
    if (!this.data.settings) this.data.settings = {};
    this.data.settings.fontSize = fontSize;
    this.save();
  }

  // Reset
  resetToDemo() {
    const demo = getInitialDemoData();
    this.save(demo);
  }

  clearAll() {
    const empty = {
      isOnboarded: false,
      warung: { id: 'w-1', name: 'Warung Saya', category: 'Sembako' },
      products: [],
      sales: [],
      expenses: [],
      debts: [],
      settings: { fontSize: 'normal', speechEnabled: true }
    };
    this.save(empty);
  }
}

export const store = new Store();
