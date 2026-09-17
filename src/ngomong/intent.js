// WARUNG OS - Intent Detection Engine
// Detects natural language intent for Indonesian warung conversations with strict safety guards

export const INTENTS = {
  SALE_CASH: 'SALE_CASH',
  SALE_DEBT: 'SALE_DEBT',
  DEBT_PAYMENT: 'DEBT_PAYMENT',
  EXPENSE: 'EXPENSE',
  STOCK_ADD: 'STOCK_ADD',
  STOCK_REMOVE: 'STOCK_REMOVE',
  QUERY_SALES: 'QUERY_SALES',
  QUERY_CASH: 'QUERY_CASH',
  QUERY_STOCK: 'QUERY_STOCK',
  QUERY_DEBT: 'QUERY_DEBT',
  QUERY_BEST_SELLER: 'QUERY_BEST_SELLER',
  QUERY_RESTOCK: 'QUERY_RESTOCK',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Detect primary intent and confidence from text and contextual hints
 */
export function detectIntent(text, { hasPerson = false, hasItems = false, hasAmount = false } = {}) {
  if (!text) return { intent: INTENTS.UNKNOWN, confidence: 0 };
  const lower = text.toLowerCase().trim();

  // 0. STOCK MANAGEMENT SAFETY GUARD (CRITICAL P0 #1)
  // Perintah stok TIDAK BOLEH pernah jatuh ke transaksi jualan (SALE_CASH)
  const isStockManagement =
    lower.includes('tambah stok') ||
    lower.includes('tambahin') ||
    lower.includes('tambahkan') ||
    lower.includes('tambah barang') ||
    lower.includes('masuk barang') ||
    lower.includes('masuk stok') ||
    lower.includes('baru beli stok') ||
    lower.includes('kulakan stok') ||
    lower.includes('isi ulang stok') ||
    lower.includes('kurangi stok') ||
    lower.includes('kurangin') ||
    lower.includes('kurangi') ||
    lower.includes('stok berkurang') ||
    lower.includes('barang rusak') ||
    lower.includes('rusak') ||
    lower.includes('retur') ||
    lower.includes('pecah') ||
    lower.includes('basi') ||
    (lower.startsWith('tambah ') && !lower.includes('utang'));

  if (isStockManagement) {
    if (
      lower.includes('kurang') ||
      lower.includes('rusak') ||
      lower.includes('retur') ||
      lower.includes('pecah') ||
      lower.includes('basi')
    ) {
      return { intent: INTENTS.STOCK_REMOVE, confidence: 0.95 };
    }
    return { intent: INTENTS.STOCK_ADD, confidence: 0.95 };
  }

  // 1. READ-ONLY QUERIES (Instant Answers)

  // Query Restock & Low Stock
  if (
    lower.includes('besok belanja apa') ||
    lower.includes('belanja apa besok') ||
    lower.includes('mau belanja apa') ||
    lower.includes('harus beli apa') ||
    lower.includes('perlu belanja apa') ||
    lower.includes('tinggal sedikit') ||
    lower.includes('mau habis') ||
    lower.includes('stok menipis') ||
    lower.includes('hampir habis')
  ) {
    return { intent: INTENTS.QUERY_RESTOCK, confidence: 0.98 };
  }

  // Query Best Seller
  if (
    lower.includes('paling laku') ||
    lower.includes('paling laris') ||
    lower.includes('paling banyak terjual') ||
    lower.includes('paling sering dibeli') ||
    lower.includes('paling banyak dibeli') ||
    lower.includes('sering dibeli') ||
    lower.includes('terlaris')
  ) {
    return { intent: INTENTS.QUERY_BEST_SELLER, confidence: 0.98 };
  }

  // Query Sales Today
  if (
    (lower.includes('jualan') || lower.includes('penjualan') || lower.includes('laku')) &&
    (lower.includes('hari ini') || lower.includes('berapa') || lower.includes('total'))
  ) {
    return { intent: INTENTS.QUERY_SALES, confidence: 0.98 };
  }

  // Query Cash in Drawer (P0 #4)
  if (
    lower.includes('uang di warung') ||
    lower.includes('uang warung') ||
    lower.includes('uang di laci') ||
    lower.includes('uang laci') ||
    lower.includes('di laci') ||
    lower.includes('uang kas') ||
    lower.includes('uang tersisa') ||
    lower.includes('kas hari ini') ||
    lower.includes('kas sekarang') ||
    lower.includes('uang sekarang') ||
    lower.includes('uang yang ada') ||
    lower.includes('uang tunai hari ini')
  ) {
    return { intent: INTENTS.QUERY_CASH, confidence: 0.98 };
  }

  // Query Debt: "Siapa yang masih ngutang?", "Berapa utang Budi?", "Utang Budi tinggal berapa?", "Siapa yang belum bayar?", "Yang tadi utang siapa ya?" (P0 #3)
  if (
    lower.includes('siapa yang masih ngutang') ||
    lower.includes('siapa yang ngutang') ||
    lower.includes('daftar utang') ||
    lower.includes('siapa aja yang ngutang') ||
    lower.includes('siapa yang belum bayar') ||
    lower.includes('siapa belum bayar') ||
    lower.includes('yang tadi utang siapa') ||
    lower.includes('yang utang siapa') ||
    (lower.includes('utang') && lower.includes('tinggal berapa')) ||
    (lower.includes('utang') && lower.includes('berapa')) ||
    (lower.includes('utang') && hasPerson && (lower.includes('berapa') || lower.includes('tinggal') || lower.includes('cek'))) ||
    (lower.includes('belum bayar') && (hasPerson || lower.includes('siapa') || lower.includes('kemarin') || lower.includes('tadi')))
  ) {
    return { intent: INTENTS.QUERY_DEBT, confidence: 0.98 };
  }

  // Query Specific Stock e.g. "Telur masih berapa?", "Telurnya tinggal berapa?", "Stok Indomie berapa?"
  if (
    (lower.includes('masih berapa') || lower.includes('tinggal berapa') || lower.includes('ada berapa') || lower.includes('stok')) &&
    !lower.includes('ngutang') &&
    !lower.includes('utang') &&
    !lower.includes('bayar') &&
    !lower.includes('uang') &&
    !lower.includes('kas') &&
    !lower.includes('laci')
  ) {
    return { intent: INTENTS.QUERY_STOCK, confidence: 0.95 };
  }

  // 2. TRANSACTIONAL INTENTS (Require Confirmation Draft)

  // Debt Payment: "Budi bayar utangnya sepuluh ribu", "Bayar utang sepuluh ribu", "Joko bayar sepuluh", "Bu Siti bayar semua"
  if (
    (lower.includes('bayar utang') || lower.includes('bayar utangnya') || lower.includes('nyicil utang') || lower.includes('angsur utang')) ||
    (hasPerson && (lower.includes('bayar') || lower.includes('cicil')) && (hasAmount || lower.includes('utang') || lower.includes('semua') || lower.includes('lunas')))
  ) {
    return { intent: INTENTS.DEBT_PAYMENT, confidence: 0.95 };
  }

  // Expense: "Tadi beli gas dua puluh ribu", "Pengeluaran belanja stok 50.000", "Beli sabun 15 ribu"
  if (
    lower.includes('pengeluaran') ||
    lower.includes('belanja stok') ||
    lower.includes('kulakan') ||
    lower.includes('beli gas') ||
    lower.includes('beli bensin') ||
    lower.includes('bayar listrik') ||
    lower.includes('bayar sampah') ||
    (lower.startsWith('tadi beli ') && !hasPerson && hasAmount) ||
    (lower.startsWith('beli ') && !hasItems && hasAmount)
  ) {
    return { intent: INTENTS.EXPENSE, confidence: 0.95 };
  }

  // Sale Debt: "Bu Siti ngutang tiga Indomie", "Beli ... tapi ngutang", "Catat Budi utang dua puluh ribu", "Bu Siti ambil Indomie tiga, catat dulu ya"
  if (
    lower.includes('ngutang') ||
    lower.includes('kasbon') ||
    (lower.includes('catat') && lower.includes('utang')) ||
    (lower.includes('catat dulu ya') && hasPerson) ||
    (hasPerson && (lower.includes('ngutang') || lower.includes('utang') || lower.includes('catat dulu ya'))) ||
    (lower.includes('utang') && (hasItems || lower.includes('beli') || lower.includes('ambil')))
  ) {
    return { intent: INTENTS.SALE_DEBT, confidence: 0.95 };
  }

  // Cash Sale: "Tadi laku dua Indomie", "Jual satu kopi", "Laku es teh dua"
  // STRICT GUARD: If stock management words are present, NEVER fall into SALE_CASH
  if (!isStockManagement) {
    if (
      hasItems ||
      lower.includes('laku') ||
      lower.includes('jual') ||
      lower.includes('kejual') ||
      lower.includes('ada yang beli') ||
      lower.includes('orang beli') ||
      (lower.includes('ambil') && !hasPerson)
    ) {
      return { intent: INTENTS.SALE_CASH, confidence: 0.92 };
    }
  }

  // Check if user is confirming or canceling an ongoing draft: "Iya", "Sudah benar", "Batal", "Gak jadi"
  if (/^(?:iya|ya|betul|benar|oke|ok|catat|simpan)$/i.test(lower)) {
    return { intent: 'AFFIRMATION', confidence: 0.99 };
  }
  if (/^(?:batal|jangan|gak jadi|tidak|bukan|salah|jangan dicatat)$/i.test(lower) || lower.includes('jangan dicatat') || lower.includes('batal')) {
    return { intent: 'NEGATION', confidence: 0.99 };
  }

  return { intent: INTENTS.UNKNOWN, confidence: 0.3 };
}
