// WARUNG OS V2.3 — Automated Test Suite: Stok Lebih Pintar & Saran Belanja
import { store, getProductStockStatus } from './src/data/store.js';
import { NgomongParser } from './src/ngomong/parser.js';
import { INTENTS } from './src/ngomong/intent.js';

let passed = 0;
let failed = 0;

function assert(condition, message, detail = '') {
  if (condition) {
    passed++;
    console.log(`[PASS] Test ${passed}: ${message} ✅`);
    if (detail) console.log(`       ${detail}`);
  } else {
    failed++;
    console.error(`[FAIL] Test ${passed + failed}: ${message} ❌`);
    if (detail) console.error(`       Detail: ${detail}`);
  }
}

console.log('================================================================');
console.log('  WARUNG OS V2.3 — STOK LEBIH PINTAR AUTOMATED TEST SUITE        ');
console.log('================================================================\n');

// Reset store to fresh state
store.clearAll();
store.setKasAwal(500000);

// --- 1. DATA PRODUK & BATAS STOK MINIMUM DEFAULT ---
console.log('--- 1. DATA PRODUK & STOCKMINIMUM DEFAULT ---');

const prodA = store.addProduct({
  name: 'Indomie Goreng',
  sellingPrice: 3500,
  costPrice: 2800,
  stock: 20,
  unit: 'bungkus'
  // stockMinimum omitted -> should default to 0
});

assert(prodA.stockMinimum === 0, 'stockMinimum default adalah 0', `stockMinimum: ${prodA.stockMinimum}`);

const prodB = store.addProduct({
  name: 'Telur Ayam',
  sellingPrice: 3000,
  costPrice: 2400,
  stock: 12,
  unit: 'butir',
  stockMinimum: 10
});

assert(prodB.stockMinimum === 10, 'stockMinimum dapat diisi sesuai input user', `stockMinimum: ${prodB.stockMinimum}`);

store.updateProduct(prodA.id, { stockMinimum: 8 });
const prodAUpdated = store.getProductById(prodA.id);
assert(prodAUpdated.stockMinimum === 8, 'updateProduct berhasil mengubah stockMinimum', `stockMinimum: ${prodAUpdated.stockMinimum}`);


// --- 2. STATUS STOK (HABIS, MULAI MENIPIS, MASIH AMAN, BELUM DIATUR) ---
console.log('\n--- 2. STATUS STOK (HABIS, MENIPIS, AMAN, BELUM DIATUR) ---');

// a. Stok <= 0 -> 🔴 HABIS
const statusHabis1 = getProductStockStatus({ stock: 0, stockMinimum: 5 });
assert(
  statusHabis1 && statusHabis1.code === 'HABIS' && statusHabis1.badge.includes('Habis'),
  'Stok 0 menghasilkan status 🔴 Habis',
  `Badge: ${statusHabis1?.badge}`
);

const statusHabisNegatif = getProductStockStatus({ stock: -3, stockMinimum: 0 });
assert(
  statusHabisNegatif && statusHabisNegatif.code === 'HABIS',
  'Stok negatif menghasilkan status 🔴 Habis meskipun stockMinimum 0',
  `Badge: ${statusHabisNegatif?.badge}`
);

// b. Stok > 0 && stock <= stockMinimum -> 🟠 MULAI MENIPIS
const statusMenipis = getProductStockStatus({ stock: 5, stockMinimum: 10 });
assert(
  statusMenipis && statusMenipis.code === 'MULAI_MENIPIS' && statusMenipis.badge.includes('Mulai Menipis'),
  'Stok 5 dengan minimum 10 menghasilkan status 🟠 Mulai Menipis',
  `Badge: ${statusMenipis?.badge}`
);

const statusMenipisTepat = getProductStockStatus({ stock: 10, stockMinimum: 10 });
assert(
  statusMenipisTepat && statusMenipisTepat.code === 'MULAI_MENIPIS',
  'Stok 10 tepat sama dengan minimum 10 menghasilkan status 🟠 Mulai Menipis',
  `Badge: ${statusMenipisTepat?.badge}`
);

// c. Stok > stockMinimum -> 🟢 MASIH AMAN
const statusAman = getProductStockStatus({ stock: 15, stockMinimum: 10 });
assert(
  statusAman && statusAman.code === 'MASIH_AMAN' && statusAman.badge.includes('Masih Aman'),
  'Stok 15 dengan minimum 10 menghasilkan status 🟢 Masih Aman',
  `Badge: ${statusAman?.badge}`
);

// d. stockMinimum = 0 / belum diatur -> null (jangan membuat status berdasarkan batas minimum)
const statusTanpaBatas = getProductStockStatus({ stock: 3, stockMinimum: 0 });
assert(
  statusTanpaBatas === null,
  'Stok 3 dengan stockMinimum 0 tidak menghasilkan status minimum (null)',
  `Status: ${statusTanpaBatas}`
);

const statusBatasUndefined = getProductStockStatus({ stock: 7 });
assert(
  statusBatasUndefined === null,
  'Stok 7 dengan stockMinimum belum diisi tidak menghasilkan status minimum (null)',
  `Status: ${statusBatasUndefined}`
);


// --- 3. getPerluDibeli() & getOutOfStockProducts() ---
console.log('\n--- 3. getPerluDibeli() & getOutOfStockProducts() ---');

store.clearAll();
// Tambah 4 produk dengan skenario berbeda
const p1 = store.addProduct({ name: 'Kopi Kapal Api', stock: 0, stockMinimum: 5, sellingPrice: 3000 }); // Habis
const p2 = store.addProduct({ name: 'Gula Pasir', stock: 4, stockMinimum: 10, sellingPrice: 14000 }); // Menipis
const p3 = store.addProduct({ name: 'Beras 5kg', stock: 15, stockMinimum: 5, sellingPrice: 65000 }); // Aman
const p4 = store.addProduct({ name: 'Garam Dapur', stock: 2, stockMinimum: 0, sellingPrice: 2000 }); // Belum diatur min, stok > 0

const perluDibeli = store.getPerluDibeli();
assert(perluDibeli.length === 2, 'getPerluDibeli() hanya memuat 2 barang (Kopi habis & Gula menipis)', `Jumlah: ${perluDibeli.length}`);
assert(perluDibeli.some((i) => i.product.id === p1.id && i.status === 'habis'), 'Kopi berstatus habis di daftar Perlu Dibeli');
assert(perluDibeli.some((i) => i.product.id === p2.id && i.status === 'menipis'), 'Gula berstatus menipis di daftar Perlu Dibeli');
assert(!perluDibeli.some((i) => i.product.id === p3.id), 'Beras aman TIDAK masuk daftar Perlu Dibeli');
assert(!perluDibeli.some((i) => i.product.id === p4.id), 'Garam tanpa batas minimum TIDAK masuk daftar Perlu Dibeli');

const outOfStock = store.getOutOfStockProducts();
assert(outOfStock.length === 1, 'getOutOfStockProducts() hanya memuat 1 barang (Kopi)', `Jumlah: ${outOfStock.length}`);
assert(outOfStock[0].id === p1.id, 'Produk out of stock adalah Kopi Kapal Api');


// --- 4. PEMBELIAN V2.2 MENGUBAH STATUS OTOMATIS ---
console.log('\n--- 4. PEMBELIAN V2.2 MENGUBAH STATUS OTOMATIS ---');

// Gula Pasir: Stok 4, Minimum 10 -> Menipis
let statusGulaAwal = store.getStockStatus(store.getProductById(p2.id));
assert(statusGulaAwal.code === 'MULAI_MENIPIS', 'Status awal Gula Pasir: MULAI_MENIPIS');

// User belanja Gula Pasir 20 pcs via flow V2.2
store.recordPurchase({
  productId: p2.id,
  productName: p2.name,
  quantity: 20,
  totalCost: 200000
});

// Stok sekarang 4 + 20 = 24. 24 > 10 -> Otomatis MASIH AMAN!
const p2AfterPurch = store.getProductById(p2.id);
assert(p2AfterPurch.stock === 24, 'Stok Gula Pasir bertambah jadi 24', `Stok: ${p2AfterPurch.stock}`);

let statusGulaAfterPurch = store.getStockStatus(p2AfterPurch);
assert(
  statusGulaAfterPurch && statusGulaAfterPurch.code === 'MASIH_AMAN',
  'Status Gula Pasir otomatis berubah menjadi 🟢 MASIH AMAN setelah belanja',
  `Badge: ${statusGulaAfterPurch?.badge}`
);

// Gula Pasir tidak lagi muncul di Perlu Dibeli
const perluDibeliAfterPurch = store.getPerluDibeli();
assert(!perluDibeliAfterPurch.some((i) => i.product.id === p2.id), 'Gula Pasir otomatis keluar dari daftar Perlu Dibeli');


// --- 5. PENJUALAN MENGUBAH STATUS OTOMATIS ---
console.log('\n--- 5. PENJUALAN MENGUBAH STATUS OTOMATIS ---');

// Jual 18 bungkus Gula Pasir -> Stok 24 - 18 = 6 (<= 10) -> MULAI MENIPIS
store.recordSale({
  items: [{ productId: p2.id, name: p2.name, quantity: 18, price: 14000, subtotal: 252000 }],
  total: 252000,
  cashReceived: 252000,
  change: 0,
  isDebt: false
});

const p2AfterSale1 = store.getProductById(p2.id);
assert(p2AfterSale1.stock === 6, 'Stok Gula Pasir berkurang menjadi 6', `Stok: ${p2AfterSale1.stock}`);
const statusGulaAfterSale1 = store.getStockStatus(p2AfterSale1);
assert(
  statusGulaAfterSale1 && statusGulaAfterSale1.code === 'MULAI_MENIPIS',
  'Status Gula Pasir otomatis turun menjadi 🟠 MULAI MENIPIS setelah penjualan',
  `Badge: ${statusGulaAfterSale1?.badge}`
);

// Jual 6 bungkus lagi -> Stok 6 - 6 = 0 -> HABIS
store.recordSale({
  items: [{ productId: p2.id, name: p2.name, quantity: 6, price: 14000, subtotal: 84000 }],
  total: 84000,
  cashReceived: 84000,
  change: 0,
  isDebt: false
});

const p2AfterSale2 = store.getProductById(p2.id);
assert(p2AfterSale2.stock === 0, 'Stok Gula Pasir berkurang menjadi 0', `Stok: ${p2AfterSale2.stock}`);
const statusGulaAfterSale2 = store.getStockStatus(p2AfterSale2);
assert(
  statusGulaAfterSale2 && statusGulaAfterSale2.code === 'HABIS',
  'Status Gula Pasir otomatis menjadi 🔴 HABIS saat stok 0',
  `Badge: ${statusGulaAfterSale2?.badge}`
);


// --- 6. DAFTAR YANG MAU DIBELI (CHECKLIST MURNI TANPA MUTASI STOK/KAS) ---
console.log('\n--- 6. DAFTAR YANG MAU DIBELI (CHECKLIST MURNI) ---');

const cashBeforeChecklist = store.getTodayUangKasAkhir();
const stockBeforeChecklist = store.getProductById(p2.id).stock;
const salesBeforeChecklist = store.getTodaySalesTotal();

// Add items
const item1 = store.addShoppingItem('Minyak Goreng 2L');
const item2 = store.addShoppingItem('Kecap Manis');
assert(item1 && item1.name === 'Minyak Goreng 2L', 'addShoppingItem berhasil menambah barang 1');
assert(item2 && item2.name === 'Kecap Manis', 'addShoppingItem berhasil menambah barang 2');
assert(!item1.isBought, 'Barang checklist baru default isBought = false');

// List length
assert(store.getShoppingList().length === 2, 'Daftar checklist berisi 2 barang');

// Toggle bought
store.toggleShoppingItem(item1.id);
const item1Updated = store.getShoppingList().find((i) => i.id === item1.id);
assert(item1Updated.isBought === true, 'toggleShoppingItem menandai barang sudah dibeli');

store.toggleShoppingItem(item1.id);
const item1ToggledBack = store.getShoppingList().find((i) => i.id === item1.id);
assert(item1ToggledBack.isBought === false, 'toggleShoppingItem dapat mengembalikan status menjadi belum dibeli');

// Delete item
store.deleteShoppingItem(item2.id);
assert(store.getShoppingList().length === 1, 'deleteShoppingItem berhasil menghapus barang dari checklist');

// ZERO MUTATION VERIFICATION
assert(store.getTodayUangKasAkhir() === cashBeforeChecklist, 'CHECKLIST SAFETY: Uang di laci TIDAK berubah sama sekali');
assert(store.getProductById(p2.id).stock === stockBeforeChecklist, 'CHECKLIST SAFETY: Stok produk TIDAK berubah sama sekali');
assert(store.getTodaySalesTotal() === salesBeforeChecklist, 'CHECKLIST SAFETY: Transaksi jualan TIDAK bertambah');


// --- 7. NGOMONG AJA: QUERY READ-ONLY V2.3 ---
console.log('\n--- 7. NGOMONG AJA: QUERY READ-ONLY V2.3 ---');

const parser = new NgomongParser(store);

// a. "Barang apa yang harus dibeli?" -> QUERY_RESTOCK
const qRestock = parser.parse('Barang apa yang harus dibeli?');
assert(qRestock.status === 'QUERY_ANSWER', 'Query "Barang apa yang harus dibeli?" dijawab');
assert(qRestock.intent === INTENTS.QUERY_RESTOCK, 'Intent terdeteksi sebagai QUERY_RESTOCK');
assert(qRestock.answer.includes('Kopi Kapal Api'), 'Jawaban memuat barang yang habis (Kopi Kapal Api)');
assert(qRestock.answer.includes('Gula Pasir'), 'Jawaban memuat barang yang habis/menipis (Gula Pasir)');

// Alternative phrasing: "Perlu beli apa?"
const qRestock2 = parser.parse('Perlu beli apa?');
assert(qRestock2.intent === INTENTS.QUERY_RESTOCK, 'Phrasing "Perlu beli apa?" terdeteksi sebagai QUERY_RESTOCK');

// b. "Barang apa yang habis?" -> QUERY_OUT_OF_STOCK
const qOutOfStock = parser.parse('Barang apa yang habis?');
assert(qOutOfStock.status === 'QUERY_ANSWER', 'Query "Barang apa yang habis?" dijawab');
assert(qOutOfStock.intent === INTENTS.QUERY_OUT_OF_STOCK, 'Intent terdeteksi sebagai QUERY_OUT_OF_STOCK');
assert(qOutOfStock.answer.includes('Kopi Kapal Api'), 'Jawaban memuat Kopi Kapal Api (stok <= 0)');
assert(qOutOfStock.answer.includes('Gula Pasir'), 'Jawaban memuat Gula Pasir (stok <= 0)');
assert(!qOutOfStock.answer.includes('Beras 5kg'), 'Jawaban TIDAK memuat Beras (stok 15)');

// Alternative phrasing: "Apa yang habis?"
const qOutOfStock2 = parser.parse('Apa yang habis?');
assert(qOutOfStock2.intent === INTENTS.QUERY_OUT_OF_STOCK, 'Phrasing "Apa yang habis?" terdeteksi sebagai QUERY_OUT_OF_STOCK');

// c. "Beras masih berapa?" -> QUERY_STOCK spesifik
const qStockBeras = parser.parse('Beras masih berapa?');
assert(qStockBeras.status === 'QUERY_ANSWER', 'Query "Beras masih berapa?" dijawab');
assert(qStockBeras.intent === INTENTS.QUERY_STOCK, 'Intent terdeteksi sebagai QUERY_STOCK');
assert(qStockBeras.answer.includes('Beras 5kg'), 'Jawaban memuat nama produk Beras 5kg');
assert(qStockBeras.answer.includes('15'), 'Jawaban memuat jumlah stok 15');
assert(qStockBeras.answer.includes('Masih Aman'), 'Jawaban menyertakan status stok Masih Aman');


// --- 8. ZERO MUTATION PADA QUERY SUARA ---
console.log('\n--- 8. ZERO MUTATION PADA QUERY SUARA ---');

const salesBeforeQueries = store.getSales().length;
const purchasesBeforeQueries = (store.data.purchases || []).length;
const cashBeforeQueries = store.getTodayUangKasAkhir();
const berasStockBefore = store.getProductById(p3.id).stock;

// Run 5 queries consecutively
parser.parse('Barang apa yang harus dibeli?');
parser.parse('Barang apa yang habis?');
parser.parse('Beras masih berapa?');
parser.parse('Kopi masih berapa?');
parser.parse('Uang di laci sekarang ada berapa?');

assert(store.getSales().length === salesBeforeQueries, 'SAFETY GUARD: Jumlah jualan tidak bertambah');
assert((store.data.purchases || []).length === purchasesBeforeQueries, 'SAFETY GUARD: Jumlah pembelian tidak bertambah');
assert(store.getTodayUangKasAkhir() === cashBeforeQueries, 'SAFETY GUARD: Uang di laci tidak berubah');
assert(store.getProductById(p3.id).stock === berasStockBefore, 'SAFETY GUARD: Stok produk tidak berubah');


// --- 9. HISTORI TRANSAKSI V2.1 / V2.2 TETAP KEBAL ---
console.log('\n--- 9. HISTORI TRANSAKSI V2.1 / V2.2 TETAP KEBAL ---');

// Check sales snapshot
const salesHistory = store.getSales();
assert(salesHistory.length > 0, 'Histori transaksi penjualan tersedia');
const firstSale = salesHistory[salesHistory.length - 1];
assert(firstSale.items[0].price === 14000, 'Harga jual snapshot transaksi lama utuh');

// Check purchases history
const purchasesHistory = store.data.purchases || [];
assert(purchasesHistory.length === 1, 'Histori pembelian V2.2 utuh');
assert(purchasesHistory[0].totalCost === 200000, 'Total biaya pembelian lama tetap Rp200.000');
assert(purchasesHistory[0].unitCost === 10000, 'Modal per unit pembelian lama tetap Rp10.000');


// --- SUMMARY ---
console.log('\n================================================================');
if (failed === 0) {
  console.log(`  🎉 SELURUH ${passed} TEST V2.3 STOK LEBIH PINTAR LULUS 100%! 🎉   `);
} else {
  console.error(`  ❌ ${failed} TEST GAGAL DARI TOTAL ${passed + failed} TEST!`);
}
console.log('================================================================\n');

if (failed > 0) process.exit(1);
