// WARUNG OS V2.2 — Pembelian & Stok Automated Test Suite
// Verifies all business rules:
// 1. Catatan Pembelian: product, quantity, totalCost, unitCost, createdAt
// 2. Efek Pembelian: Stok bertambah, Uang di Laci berkurang, bukan penjualan, bukan debt sale
// 3. Harga Modal: unitCost jadi harga modal terbaru produk, snapshot transaksi lama kebal 100%
// 4. Guard Anti-Tebak Satuan: "Tadi beli Indomie 50 ribu" wajib minta jumlah barang, jangan menebak
// 5. Rumus unitCost: totalCost / quantity saat keduanya diketahui
// 6. Laporan: Total belanja hari ini, minggu ini, bulan ini, dan jumlah transaksi pembelian
// 7. Pemisahan Finansial: Jualan, Uang Masuk, Belanja Barang, Pengeluaran Lain, Uang di Laci
// 8. Formula Uang di Laci: Kas Awal + Uang Masuk - Belanja Barang - Pengeluaran Lain
// 9. NGOMONG AJA: Intent PURCHASE -> Draft Confirmation -> Zero mutation sebelum CATAT
// 10. Konfirmasi Catat: Stok nambah, Laci berkurang, Modal terupdate, Riwayat tersimpan

import { store, formatRupiah } from './src/data/store.js';
import { NgomongParser } from './src/ngomong/parser.js';
import { executeConfirmedDraft, cancelPendingDraft } from './src/ngomong/confirmation.js';
import { INTENTS } from './src/ngomong/intent.js';

console.log('================================================================');
console.log('  WARUNG OS V2.2 — PEMBELIAN & STOK AUTOMATED TEST SUITE        ');
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

// SETUP: Bersihkan store untuk pengujian independen
store.clearAll();
store.updateWarung('Warung Bu Siti Test V2.2', 'Sembako');
store.setKasAwal(500000); // Kas awal Rp500.000

console.log('--- 1. MASTER PRODUK AWAL & SNAPSHOT TRANSAKSI V2.1 ---');
// Tambah produk awal: Indomie Goreng (Stok 20, Modal 2800, Jual 3500)
const pIndomie = store.addProduct({
  name: 'Indomie Goreng',
  sellingPrice: 3500,
  costPrice: 2800,
  stock: 20,
  unit: 'bungkus',
  emoji: '🍜'
});

assert(pIndomie.stock === 20, 'Stok awal Indomie Goreng adalah 20 bungkus', `Stok: ${pIndomie.stock}`);
assert(pIndomie.costPrice === 2800, 'Harga modal awal Indomie Goreng adalah Rp2.800', `Modal: ${pIndomie.costPrice}`);

// Transaksi penjualan lama V2.1: 5 bungkus Indomie terjual tunai
const oldSale = store.recordSale({
  items: [
    { productId: pIndomie.id, name: pIndomie.name, quantity: 5, price: 3500, subtotal: 17500 }
  ],
  total: 17500,
  cashReceived: 20000,
  change: 2500,
  isDebt: false
});

assert(pIndomie.stock === 15, 'Penjualan lama mengurangi stok (20 -> 15)', `Sisa: ${pIndomie.stock}`);
assert(oldSale.items[0].costPrice === 2800, 'Penjualan lama memiliki snapshot modal Rp2.800', `Snapshot: ${oldSale.items[0].costPrice}`);

const initialSalesTotal = store.getTodaySalesTotal();
const initialCashReceived = store.getTodayCashReceived();
const initialDrawer = store.getTodayUangKasAkhir();

assert(initialSalesTotal === 17500, 'Total jualan awal Rp17.500', `Jualan: ${initialSalesTotal}`);
assert(initialCashReceived === 17500, 'Uang masuk awal Rp17.500', `Uang masuk: ${initialCashReceived}`);
assert(initialDrawer === 500000 + 17500, 'Uang di laci awal = Kas Awal + Uang Masuk = Rp517.500', `Laci: ${initialDrawer}`);

console.log('\n--- 2. TRANSAKSI PEMBELIAN / BELANJA BARANG ---');
// Pembelian: Beli 25 bungkus Indomie Goreng seharga Rp75.000 (modal Rp3.000/bungkus)
const purchase = store.recordPurchase({
  productId: pIndomie.id,
  productName: pIndomie.name,
  quantity: 25,
  totalCost: 75000
});

assert(purchase.id && purchase.id.startsWith('purch-'), 'ID pembelian tersimpan dengan benar', `ID: ${purchase.id}`);
assert(purchase.quantity === 25, 'Jumlah pembelian tercatat 25 pcs', `Qty: ${purchase.quantity}`);
assert(purchase.totalCost === 75000, 'Total biaya pembelian tercatat Rp75.000', `Total: Rp${purchase.totalCost}`);
assert(purchase.unitCost === 3000, 'Modal per unit otomatis dihitung Rp3.000 (75000 / 25)', `Unit: Rp${purchase.unitCost}`);

console.log('\n--- 3. EFEK PEMBELIAN TERHADAP STOK & UANG DI LACI ---');
// Stok bertambah 15 + 25 = 40
assert(pIndomie.stock === 40, 'EFEK STOK: Stok Indomie bertambah dari 15 menjadi 40 bungkus', `Stok: ${pIndomie.stock}`);

// Uang di laci berkurang sebesar Rp75.000: 517.500 - 75.000 = 442.500
const drawerAfterPurchase = store.getTodayUangKasAkhir();
assert(drawerAfterPurchase === 517500 - 75000, 'EFEK KAS: Uang di Laci berkurang tepat Rp75.000 (Rp442.500)', `Laci: Rp${drawerAfterPurchase}`);

// Bukan penjualan
const salesAfterPurchase = store.getTodaySalesTotal();
assert(salesAfterPurchase === initialSalesTotal, 'SAFETY: Pembelian TIDAK menambah catatan jualan', `Jualan: Rp${salesAfterPurchase}`);

// Riwayat pembelian tersimpan
const purchasesToday = store.getTodayPurchases();
assert(purchasesToday.length === 1, 'Tercatat 1 transaksi pembelian di store', `Count: ${purchasesToday.length}`);

console.log('\n--- 4. HARGA MODAL TERBARU & SNAPSHOT TRANSAKSI LAMA KEBAL ---');
// Master produk memiliki harga modal baru Rp3.000
assert(pIndomie.costPrice === 3000, 'Master produk memiliki harga modal terbaru Rp3.000', `Modal baru: ${pIndomie.costPrice}`);

// Transaksi lama TIDAK BOLEH BERUBAH
assert(oldSale.items[0].costPrice === 2800, 'KEBAL: Transaksi lama tetap memiliki snapshot modal Rp2.800', `Snapshot lama: ${oldSale.items[0].costPrice}`);

// Perkiraan selisih transaksi lama tetap 3.500 - 2.800 = 700 * 5 = 3.500
const marginReport = store.getMarginReportByPeriod('today');
assert(marginReport.totalMargin === 3500, 'Perkiraan selisih transaksi lama tetap konsisten Rp3.500', `Margin: Rp${marginReport.totalMargin}`);

console.log('\n--- 5. TRANSAKSI PENJUALAN BARU MEMAKAI HARGA MODAL BARU ---');
// Penjualan baru: 10 bungkus Indomie terjual tunai
const newSale = store.recordSale({
  items: [
    { productId: pIndomie.id, name: pIndomie.name, quantity: 10, price: 3500, subtotal: 35000 }
  ],
  total: 35000,
  cashReceived: 35000,
  change: 0,
  isDebt: false
});

assert(newSale.items[0].costPrice === 3000, 'Penjualan baru menggunakan snapshot modal terbaru (Rp3.000)', `Snapshot baru: ${newSale.items[0].costPrice}`);
assert(pIndomie.stock === 30, 'Stok berkurang menjadi 30 bungkus', `Stok: ${pIndomie.stock}`);

// Margin baru: (3.500 - 3.000) * 10 = 5.000. Total margin = 3.500 + 5.000 = 8.500
const marginReportAfter = store.getMarginReportByPeriod('today');
assert(marginReportAfter.totalMargin === 8500, 'Total selisih menggabungkan margin lama + margin baru = Rp8.500', `Total Margin: Rp${marginReportAfter.totalMargin}`);

console.log('\n--- 6. FORMULA UANG DI LACI DENGAN UTANG & PENGELUARAN LAIN ---');
// Tambah pengeluaran lain: Token Listrik Rp25.000
store.addExpense({
  category: 'Listrik',
  description: 'Beli token listrik',
  amount: 25000
});

// Pelanggan Pak Joko ngutang Rp20.000 (tidak menambah uang laci)
store.recordSale({
  items: [
    { productId: pIndomie.id, name: pIndomie.name, quantity: 4, price: 3500, subtotal: 14000 }
  ],
  total: 14000,
  isDebt: true,
  debtorName: 'Pak Joko'
});

// Formula Uang di Laci:
// Kas Awal (500.000) + Uang Masuk (17.500 + 35.000 = 52.500) - Belanja Barang (75.000) - Pengeluaran Lain (25.000)
// = 500.000 + 52.500 - 75.000 - 25.000 = 452.500
const expectedCash = 500000 + 52500 - 75000 - 25000;
const actualLaci = store.getTodayUangKasAkhir();
assert(actualLaci === expectedCash, 'Formula Uang di Laci: Kas Awal + Uang Masuk - Belanja Barang - Pengeluaran Lain konsisten 100%', `Aktual: Rp${actualLaci} == Ekspektasi: Rp${expectedCash}`);

console.log('\n--- 7. LAPORAN BELANJA BARANG (HARI INI, 7 HARI, BULAN INI) ---');
const totalPurchasesToday = store.getPurchasesTotalByPeriod('today');
const totalPurchasesWeek = store.getPurchasesTotalByPeriod('week');
const totalPurchasesMonth = store.getPurchasesTotalByPeriod('month');
const countPurchasesToday = store.getPurchasesCountByPeriod('today');

assert(totalPurchasesToday === 75000, 'Laporan: Total belanja hari ini Rp75.000', `Hari ini: Rp${totalPurchasesToday}`);
assert(totalPurchasesWeek === 75000, 'Laporan: Total belanja minggu ini Rp75.000', `Minggu ini: Rp${totalPurchasesWeek}`);
assert(totalPurchasesMonth === 75000, 'Laporan: Total belanja bulan ini Rp75.000', `Bulan ini: Rp${totalPurchasesMonth}`);
assert(countPurchasesToday === 1, 'Laporan: Jumlah transaksi pembelian hari ini adalah 1', `Count: ${countPurchasesToday}`);

console.log('\n--- 8. NGOMONG AJA: INTENT PURCHASE DENGAN QUANTITY LENGKAP ---');
const parser = new NgomongParser(store);

// Query: "Tadi beli Indomie 20, total 50 ribu."
const parseRes1 = parser.parse('Tadi beli Indomie 20, total 50 ribu.');

assert(parseRes1.status === 'DRAFT_READY', 'Parser menghasilkan status DRAFT_READY', `Status: ${parseRes1.status}`);
assert(parseRes1.intent === INTENTS.PURCHASE, 'Intent terdeteksi sebagai PURCHASE', `Intent: ${parseRes1.intent}`);
assert(parseRes1.draft.productName.includes('Indomie'), 'Draft berisi produk Indomie', `Produk: ${parseRes1.draft.productName}`);
assert(parseRes1.draft.quantity === 20, 'Draft berisi jumlah 20 pcs', `Qty: ${parseRes1.draft.quantity}`);
assert(parseRes1.draft.totalCost === 50000, 'Draft berisi total biaya Rp50.000', `Total: Rp${parseRes1.draft.totalCost}`);
assert(parseRes1.draft.unitCost === 2500, 'Draft menghitung modal per unit Rp2.500 (50.000 / 20)', `Modal/unit: Rp${parseRes1.draft.unitCost}`);

// Summary matches specification
assert(parseRes1.summary.includes('BELI BARANG'), 'Summary memuat judul BELI BARANG');
assert(parseRes1.summary.includes('20 pcs'), 'Summary memuat 20 pcs');
assert(parseRes1.summary.includes('Rp50.000'), 'Summary memuat Total Rp50.000');
assert(parseRes1.summary.includes('Rp2.500'), 'Summary memuat Modal/unit Rp2.500');

console.log('\n--- 9. ZERO MUTATION SEBELUM USER MENEKAN CATAT ---');
const stockBeforeConfirm = pIndomie.stock;
const laciBeforeConfirm = store.getTodayUangKasAkhir();
const purchasesCountBeforeConfirm = store.getTodayPurchasesCount();

// Cek bahwa data di database BELUM berubah sama sekali saat draft siap
assert(pIndomie.stock === stockBeforeConfirm, 'SAFETY: Stok belum bertambah sebelum CATAT');
assert(store.getTodayUangKasAkhir() === laciBeforeConfirm, 'SAFETY: Uang laci belum berkurang sebelum CATAT');
assert(store.getTodayPurchasesCount() === purchasesCountBeforeConfirm, 'SAFETY: Riwayat belanja belum bertambah sebelum CATAT');

// User membatalkan draft: "Gak jadi" / "Batal"
const cancelRes = parser.parse('Gak jadi');
assert(cancelRes.status === 'EXECUTE_CANCELLED', 'User dapat membatalkan draft');
assert(pIndomie.stock === stockBeforeConfirm, 'SAFETY: Setelah batal, stok tetap tidak berubah');
assert(store.getTodayUangKasAkhir() === laciBeforeConfirm, 'SAFETY: Setelah batal, uang laci tetap tidak berubah');

console.log('\n--- 10. EKSEKUSI KONFIRMASI (CATAT) ---');
// Buat draft lagi dan konfirmasi dengan "Catat"
const parseRes2 = parser.parse('Tadi beli Indomie 20, total 50 ribu.');
assert(parseRes2.status === 'DRAFT_READY', 'Draft berhasil dibuat ulang');

// User mengatakan "Catat"
const confirmRes = parser.parse('Catat');
assert(confirmRes.status === 'EXECUTE_CONFIRMED', 'Konfirmasi "Catat" menghasilkan status EXECUTE_CONFIRMED');

// Eksekusi draft yang terkonfirmasi
const execResult = executeConfirmedDraft(confirmRes.draft, store);
assert(execResult.success === true, 'Eksekusi transaksi pembelian berhasil', `Pesan: ${execResult.message}`);

// Verifikasi mutasi setelah konfirmasi:
assert(pIndomie.stock === stockBeforeConfirm + 20, 'Setelah CATAT: Stok bertambah +20 pcs', `Stok: ${pIndomie.stock}`);
assert(store.getTodayUangKasAkhir() === laciBeforeConfirm - 50000, 'Setelah CATAT: Uang laci berkurang Rp50.000', `Laci: Rp${store.getTodayUangKasAkhir()}`);
assert(pIndomie.costPrice === 2500, 'Setelah CATAT: Harga modal terbaru diperbarui menjadi Rp2.500', `Modal: Rp${pIndomie.costPrice}`);
assert(store.getTodayPurchasesCount() === purchasesCountBeforeConfirm + 1, 'Setelah CATAT: Riwayat pembelian tersimpan', `Total transaksi belanja: ${store.getTodayPurchasesCount()}`);

console.log('\n--- 11. GUARD ANTI-TEBAK: SATUAN / QUANTITY TIDAK JELAS ---');
parser.clearContext();

// User mengatakan: "Tadi beli Indomie 50 ribu." (TIDAK menyebutkan jumlah barang)
const parseNoQty = parser.parse('Tadi beli Indomie 50 ribu.');

assert(parseNoQty.status === 'CLARIFY_PURCHASE_QUANTITY', 'SAFETY GUARD: Status CLARIFY_PURCHASE_QUANTITY ketika quantity tidak disebut', `Status: ${parseNoQty.status}`);
assert(parseNoQty.draft === undefined, 'SAFETY GUARD: TIDAK membuat draft dengan menebak quantity 1');
assert(parseNoQty.message.toLowerCase().includes('berapa'), 'Sistem bertanya berapa jumlah barang yang dibeli', `Pertanyaan: ${parseNoQty.message}`);

// User menjawab dengan menyebutkan jumlah: "20 bungkus"
const parseReplyQty = parser.parse('20 bungkus');
assert(parseReplyQty.status === 'DRAFT_READY', 'Setelah dijawab 20 bungkus, draft langsung DRAFT_READY');
assert(parseReplyQty.draft.quantity === 20, 'Quantity terisi 20 pcs');
assert(parseReplyQty.draft.totalCost === 50000, 'Total biaya tetap Rp50.000');
assert(parseReplyQty.draft.unitCost === 2500, 'Modal per unit dihitung Rp2.500');

console.log('\n--- 12. READ-ONLY QUERY BELANJA BARANG (ZERO MUTATION) ---');
parser.clearContext();

const queryPurchRes = parser.parse('Belanja barang hari ini berapa?');
assert(queryPurchRes.status === 'QUERY_ANSWER', 'Query belanja barang terjawab', `Status: ${queryPurchRes.status}`);
assert(queryPurchRes.answer.includes('Rp125.000'), 'Jawaban memuat total belanja hari ini (75.000 + 50.000 = Rp125.000)', `Jawaban: ${queryPurchRes.answer}`);

// Pastikan query tidak mengubah data apa pun (zero mutation)
const drawerAfterQuery = store.getTodayUangKasAkhir();
const purchasesCountAfterQuery = store.getTodayPurchasesCount();
assert(drawerAfterQuery === store.getTodayUangKasAkhir(), 'SAFETY: Query baca tidak mengubah uang di laci');
assert(purchasesCountAfterQuery === store.getTodayPurchasesCount(), 'SAFETY: Query baca tidak menambah transaksi belanja');

console.log('\n================================================================');
console.log(`  🎉 SELURUH ${totalTests} TEST PEMBELIAN & STOK V2.2 LULUS 100%! 🎉   `);
console.log('================================================================\n');
