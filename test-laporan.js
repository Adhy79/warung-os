// WARUNG OS V2.0 — Modul Laporan Warung Automated Test Suite
// Verifies all 10 core requirements: period filtering, financial formulas,
// ranking, empty states, and read-only NGOMONG AJA queries.

import { store, formatRupiah } from './src/data/store.js';
import { NgomongParser } from './src/ngomong/parser.js';
import { INTENTS } from './src/ngomong/intent.js';

console.log('================================================================');
console.log('       WARUNG OS V2.0 — LAPORAN WARUNG AUTOMATED TEST SUITE     ');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${testName} ✅`);
    if (details) console.log(`       ${details}`);
  } else {
    console.error(`[FAIL] Test ${totalTests}: ${testName} ❌`);
    if (details) console.error(`       ${details}`);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// SETUP: Clean test store state
// -------------------------------------------------------------
store.clearAll();
store.updateWarung('Warung Test Bu Siti', 'Sembako');
store.setKasAwal(500000); // Kas awal Rp500.000

// Add test products
const prodIndomie = store.addProduct({ name: 'Indomie Goreng', sellingPrice: 3500, costPrice: 2800, stock: 50, emoji: '🍜', unit: 'bungkus' });
const prodTeh = store.addProduct({ name: 'Es Teh Manis', sellingPrice: 4000, costPrice: 1500, stock: 50, emoji: '🥤', unit: 'gelas' });
const prodTelur = store.addProduct({ name: 'Telur Ayam', sellingPrice: 3000, costPrice: 2200, stock: 50, emoji: '🥚', unit: 'butir' });

// Add debtor
const debtorBudi = store.addDebtor('Budi', 0);

console.log('--- 1. SKENARIO 1: PENJUALAN TUNAI PADA SEMUA PERIODE ---');
// 1. Penjualan tunai: 2 Indomie (@3.500) = Rp7.000
store.recordSale({
  items: [{ productId: prodIndomie.id, name: prodIndomie.name, quantity: 2, price: 3500, subtotal: 7000 }],
  total: 7000,
  cashReceived: 10000,
  change: 3000,
  isDebt: false
});

const todaySales1 = store.getSalesTotalByPeriod('today');
const weekSales1 = store.getSalesTotalByPeriod('week');
const monthSales1 = store.getSalesTotalByPeriod('month');
const todayCash1 = store.getCashReceivedByPeriod('today');

assert(todaySales1 === 7000, 'Penjualan tunai tercatat pada laporan hari ini', `Total: Rp${todaySales1}`);
assert(weekSales1 === 7000, 'Penjualan tunai tercatat pada laporan 7 hari', `Total: Rp${weekSales1}`);
assert(monthSales1 === 7000, 'Penjualan tunai tercatat pada laporan bulan ini', `Total: Rp${monthSales1}`);
assert(todayCash1 === 7000, 'Uang Masuk hari ini bertambah sesuai uang tunai diterima', `Uang Masuk: Rp${todayCash1}`);

console.log('\n--- 2. SKENARIO 2: PENJUALAN UTANG (Jualan bertambah, Uang Masuk TETAP) ---');
// 2. Penjualan utang: Budi ngutang 2 Es Teh (@4.000) = Rp8.000
store.recordSale({
  items: [{ productId: prodTeh.id, name: prodTeh.name, quantity: 2, price: 4000, subtotal: 8000 }],
  total: 8000,
  cashReceived: 0,
  change: 0,
  isDebt: true,
  debtorId: debtorBudi.id,
  debtorName: debtorBudi.personName
});

const todaySales2 = store.getSalesTotalByPeriod('today');
const todayCash2 = store.getCashReceivedByPeriod('today');
const budiDebt2 = store.getAllDebts().find(d => d.id === debtorBudi.id)?.totalDebt;

assert(todaySales2 === 15000, 'Penjualan utang menambah total Jualan (Rp7.000 + Rp8.000 = Rp15.000)', `Total Jualan: Rp${todaySales2}`);
assert(todayCash2 === 7000, 'Penjualan utang TIDAK menambah Uang Masuk (tetap Rp7.000)', `Uang Masuk: Rp${todayCash2}`);
assert(budiDebt2 === 8000, 'Saldo utang Budi bertambah Rp8.000', `Utang Budi: Rp${budiDebt2}`);

console.log('\n--- 3. SKENARIO 3: PEMBAYARAN UTANG (Uang Masuk bertambah, Jualan TETAP) ---');
// 3. Pembayaran utang: Budi bayar Rp5.000
store.settleDebt(debtorBudi.id, 5000);

const todaySales3 = store.getSalesTotalByPeriod('today');
const todayCash3 = store.getCashReceivedByPeriod('today');
const budiDebt3 = store.getAllDebts().find(d => d.id === debtorBudi.id)?.totalDebt;

assert(todaySales3 === 15000, 'Pembayaran utang TIDAK menambah Jualan (mencegah double-counting)', `Total Jualan: Rp${todaySales3}`);
assert(todayCash3 === 12000, 'Pembayaran utang MENAMBAH Uang Masuk (Rp7.000 + Rp5.000 = Rp12.000)', `Uang Masuk: Rp${todayCash3}`);
assert(budiDebt3 === 3000, 'Sisa utang Budi berkurang menjadi Rp3.000', `Sisa Utang Budi: Rp${budiDebt3}`);

console.log('\n--- 4. SKENARIO 4: PENGELUARAN (Tercatat di Uang Keluar & Mengurangi Uang di Laci) ---');
// 4. Pengeluaran: Beli Gas Rp20.000
const cashLaciBeforeExp = store.getTodayUangKasAkhir();
store.addExpense({ category: 'Operasional', description: 'Beli Gas Elpiji 3kg', amount: 20000 });

const todayExp4 = store.getExpensesTotalByPeriod('today');
const cashLaciAfterExp = store.getTodayUangKasAkhir();

assert(todayExp4 === 20000, 'Pengeluaran tercatat di Uang Keluar periode hari ini', `Uang Keluar: Rp${todayExp4}`);
assert(cashLaciAfterExp === cashLaciBeforeExp - 20000, 'Pengeluaran mengurangi Uang di Laci', `Laci Sebelum: Rp${cashLaciBeforeExp}, Sesudah: Rp${cashLaciAfterExp}`);

console.log('\n--- 5. SKENARIO 5: BARANG PALING LAKU BERDASARKAN QUANTITY ---');
// Currently sold: 2 Indomie, 2 Es Teh. Now sell 10 Telur (@3.000) tunai.
store.recordSale({
  items: [{ productId: prodTelur.id, name: prodTelur.name, quantity: 10, price: 3000, subtotal: 30000 }],
  total: 30000,
  cashReceived: 30000,
  change: 0,
  isDebt: false
});

const bestSellers = store.getBestSellersByPeriod('today', 5);
assert(bestSellers.length === 3, 'Terdapat 3 jenis barang yang terjual', `Jumlah varian: ${bestSellers.length}`);
assert(bestSellers[0].name === 'Telur Ayam' && bestSellers[0].quantity === 10, 'Peringkat #1 adalah Telur Ayam (10 butir)', `#1: ${bestSellers[0].name} (${bestSellers[0].quantity})`);
assert(bestSellers[1].quantity === 2 && bestSellers[2].quantity === 2, 'Peringkat #2 & #3 masing-masing 2 buah', `#2: ${bestSellers[1].name} (${bestSellers[1].quantity}), #3: ${bestSellers[2].name} (${bestSellers[2].quantity})`);

console.log('\n--- 6. SKENARIO 6: PERIODE KOSONG (EMPTY STATE) ---');
// Buat store baru yang masih bersih
const emptyStore = new (store.constructor)();
emptyStore.clearAll();
emptyStore.setKasAwal(100000);

assert(emptyStore.getSalesTotalByPeriod('today') === 0, 'Periode kosong: Jualan adalah Rp0');
assert(emptyStore.getCashReceivedByPeriod('today') === 0, 'Periode kosong: Uang Masuk adalah Rp0');
assert(emptyStore.getExpensesTotalByPeriod('today') === 0, 'Periode kosong: Uang Keluar adalah Rp0');
assert(emptyStore.getTodayUangKasAkhir() === 100000, 'Periode kosong: Uang di Laci sama dengan Kas Awal');
assert(emptyStore.getBestSellersByPeriod('today').length === 0, 'Periode kosong: Daftar Barang Paling Laku kosong');
assert(emptyStore.getSalesCountByPeriod('today') === 0, 'Periode kosong: Jumlah transaksi adalah 0');

console.log('\n--- 7. SKENARIO 7: FILTER PERIODE WAKTU (TODAY, WEEK, MONTH) ---');
// Uji fungsi isDateInPeriod secara presisi
const now = new Date();
const todayIso = now.toISOString();

// Tanggal 3 hari lalu (masuk 'week' dan 'month' bila bulan sama)
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

// Tanggal 10 hari lalu (pasti di luar 'today' dan 'week')
const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

// Tanggal 60 hari lalu (pasti di luar 'today', 'week', dan 'month')
const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

assert(store.isDateInPeriod(todayIso, 'today') === true, 'Hari ini masuk period "today"');
assert(store.isDateInPeriod(todayIso, 'week') === true, 'Hari ini masuk period "week"');
assert(store.isDateInPeriod(todayIso, 'month') === true, 'Hari ini masuk period "month"');

assert(store.isDateInPeriod(threeDaysAgo, 'today') === false, '3 hari lalu TIDAK masuk period "today"');
assert(store.isDateInPeriod(threeDaysAgo, 'week') === true, '3 hari lalu MASUK period "week" (7 hari terakhir)');

assert(store.isDateInPeriod(tenDaysAgo, 'today') === false, '10 hari lalu TIDAK masuk period "today"');
assert(store.isDateInPeriod(tenDaysAgo, 'week') === false, '10 hari lalu TIDAK masuk period "week" (di luar 7 hari)');

assert(store.isDateInPeriod(sixtyDaysAgo, 'month') === false, '60 hari lalu TIDAK masuk period "month"');

// Tambahkan transaksi buatan pada 3 hari lalu ke store
const pastSale = {
  id: 'sale-past-1',
  total: 50000,
  cashReceived: 50000,
  change: 0,
  isDebt: false,
  items: [{ productId: prodIndomie.id, name: prodIndomie.name, quantity: 10, price: 5000, subtotal: 50000 }],
  createdAt: threeDaysAgo
};
store.data.sales.push(pastSale);

const todaySalesAfterPast = store.getSalesTotalByPeriod('today');
const weekSalesAfterPast = store.getSalesTotalByPeriod('week');

assert(todaySalesAfterPast === 45000, 'Jualan hari ini tidak terpengaruh transaksi 3 hari lalu', `Jualan Hari Ini: Rp${todaySalesAfterPast}`);
assert(weekSalesAfterPast === 45000 + 50000, 'Jualan 7 hari mencakup transaksi 3 hari lalu (Rp45.000 + Rp50.000 = Rp95.000)', `Jualan 7 Hari: Rp${weekSalesAfterPast}`);

console.log('\n--- 8. SKENARIO 8: RULE ATURAN BISNIS: JUALAN != UANG MASUK ---');
// Karena ada transaksi ngutang Rp8.000 (sisa utang Rp3.000 belum dibayar):
// Jualan hari ini = 7.000 (Indomie) + 8.000 (Es Teh utang) + 30.000 (Telur) = 45.000
// Uang Masuk hari ini = 7.000 (Indomie) + 5.000 (Bayar utang) + 30.000 (Telur) = 42.000
const finalSalesToday = store.getSalesTotalByPeriod('today');
const finalCashToday = store.getCashReceivedByPeriod('today');

assert(finalSalesToday !== finalCashToday, 'Jualan TIDAK SAMA DENGAN Uang Masuk ketika ada transaksi utang', `Jualan: Rp${finalSalesToday} vs Uang Masuk: Rp${finalCashToday}`);
assert(finalSalesToday - finalCashToday === 3000, 'Selisih Jualan - Uang Masuk tepat sebesar sisa utang yang belum dibayar (Rp3.000)', `Selisih: Rp${finalSalesToday - finalCashToday}`);

console.log('\n--- 9. SKENARIO 9: FORMULA UANG DI LACI KONSISTEN 100% ---');
// Formula: Kas Awal (500.000) + Uang Masuk Hari Ini (42.000) - Pengeluaran Hari Ini (20.000) = 522.000
const expectedLaci = store.getKasAwal() + store.getTodayCashReceived() - store.getTodayExpensesTotal();
const actualLaci = store.getTodayUangKasAkhir();

assert(actualLaci === 522000, 'Uang di Laci sesuai perhitungan formula bisnis (Rp522.000)', `Laci Aktual: Rp${actualLaci}`);
assert(actualLaci === expectedLaci, 'Formula Uang di Laci: Kas Awal + Uang Masuk - Uang Keluar konsisten 100%', `${actualLaci} == ${expectedLaci}`);

console.log('\n--- 10. SKENARIO 10: NGOMONG AJA QUERY LAPORAN BERFUNGSI & READ-ONLY ---');
const parser = new NgomongParser(store);

// Snapshot state sebelum query
const snapshotSalesBefore = store.getSalesTotalByPeriod('today');
const snapshotCashBefore = store.getCashReceivedByPeriod('today');
const snapshotExpBefore = store.getExpensesTotalByPeriod('today');
const snapshotDebtBefore = store.getTotalDebts();
const snapshotSalesCountBefore = store.data.sales.length;

// A. Query Jualan Minggu Ini
const resSalesWeek = parser.parse('Jualan minggu ini berapa ya?');
assert(resSalesWeek.status === 'QUERY_ANSWER' && resSalesWeek.intent === INTENTS.QUERY_SALES, 'Query: "Jualan minggu ini berapa ya?" terjawab');
assert(resSalesWeek.answer.includes('Jualan minggu ini (7 hari)'), 'Jawaban menyebutkan periode 7 hari / minggu ini', `Jawaban: ${resSalesWeek.answer.replace(/\n/g, ' ')}`);

// B. Query Jualan Bulan Ini
const resSalesMonth = parser.parse('Total jualan bulan ini berapa?');
assert(resSalesMonth.status === 'QUERY_ANSWER' && resSalesMonth.intent === INTENTS.QUERY_SALES, 'Query: "Total jualan bulan ini berapa?" terjawab');
assert(resSalesMonth.answer.includes('Jualan bulan ini'), 'Jawaban menyebutkan periode bulan ini', `Jawaban: ${resSalesMonth.answer.replace(/\n/g, ' ')}`);

// C. Query Uang Masuk Minggu Ini
const resCashWeek = parser.parse('Uang masuk minggu ini berapa?');
assert(resCashWeek.status === 'QUERY_ANSWER' && resCashWeek.intent === INTENTS.QUERY_CASH, 'Query: "Uang masuk minggu ini berapa?" terjawab');
assert(resCashWeek.answer.includes('Uang masuk minggu ini (7 hari)'), 'Jawaban uang masuk menyebutkan periode 7 hari', `Jawaban: ${resCashWeek.answer}`);

// D. Query Pengeluaran Bulan Ini
const resExpMonth = parser.parse('Pengeluaran bulan ini berapa?');
assert(resExpMonth.status === 'QUERY_ANSWER' && resExpMonth.intent === INTENTS.QUERY_EXPENSE, 'Query: "Pengeluaran bulan ini berapa?" terjawab');
assert(resExpMonth.answer.includes('Pengeluaran warung bulan ini'), 'Jawaban pengeluaran menyebutkan periode bulan ini', `Jawaban: ${resExpMonth.answer}`);

// E. Verifikasi Zero Mutation (Read-Only Safety Guard)
assert(store.getSalesTotalByPeriod('today') === snapshotSalesBefore, 'SAFETY GUARD: Jualan tidak bermutasi oleh query baca');
assert(store.getCashReceivedByPeriod('today') === snapshotCashBefore, 'SAFETY GUARD: Uang Masuk tidak bermutasi oleh query baca');
assert(store.getExpensesTotalByPeriod('today') === snapshotExpBefore, 'SAFETY GUARD: Pengeluaran tidak bermutasi oleh query baca');
assert(store.getTotalDebts() === snapshotDebtBefore, 'SAFETY GUARD: Utang tidak bermutasi oleh query baca');
assert(store.data.sales.length === snapshotSalesCountBefore, 'SAFETY GUARD: Jumlah baris transaksi tidak bertambah');

console.log('\n================================================================');
console.log(`  🎉 SELURUH ${totalTests} TEST LAPORAN WARUNG V2.0 LULUS 100%! 🎉   `);
console.log('================================================================\n');
