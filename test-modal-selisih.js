// WARUNG OS V2.1 — Modal, Harga Jual & Perkiraan Selisih Automated Test Suite
// Verifies all business rules:
// 1. Harga modal opsional, harga jual wajib
// 2. Snapshot harga modal & harga jual pada transaksi
// 3. Perubahan harga masa depan tidak mengubah histori transaksi
// 4. Perkiraan Selisih = Harga Jual Aktual - Harga Modal Snapshot
// 5. Barang tanpa harga modal TIDAK menghasilkan perkiraan selisih
// 6. Transaksi jualan tetap lancar walau modal kosong
// 7. Utang dihitung jualan & selisih, bukan uang masuk
// 8. Bayar utang bukan jualan & bukan selisih baru
// 9. Kulakan adalah pengeluaran, bukan barang terjual
// 10. NGOMONG AJA read-only zero-mutation query untuk selisih

import { store, formatRupiah } from './src/data/store.js';
import { NgomongParser } from './src/ngomong/parser.js';
import { INTENTS } from './src/ngomong/intent.js';

console.log('================================================================');
console.log('  WARUNG OS V2.1 — MODAL & HARGA JUAL AUTOMATED TEST SUITE      ');
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
store.updateWarung('Warung Bu Siti Test V2.1', 'Sembako');
store.setKasAwal(500000);

console.log('--- 1. HARGA MODAL OPSIONAL & HARGA JUAL WAJIB ---');
// A. Tambah produk lengkap (dengan modal)
const pIndomie = store.addProduct({
  name: 'Indomie Goreng',
  sellingPrice: 3500,
  costPrice: 2800,
  stock: 20,
  emoji: '🍜'
});
assert(pIndomie.sellingPrice === 3500 && pIndomie.costPrice === 2800, 'Produk dengan harga modal lengkap berhasil dibuat', `Jual: ${pIndomie.sellingPrice}, Modal: ${pIndomie.costPrice}`);

// B. Tambah produk TANPA modal (opsional / diisi nanti)
const pKerupuk = store.addProduct({
  name: 'Kerupuk Kaleng',
  sellingPrice: 1000,
  costPrice: 0, // modal kosong / belum diisi
  stock: 30,
  emoji: '🍘'
});
assert(pKerupuk.sellingPrice === 1000 && pKerupuk.costPrice === 0, 'Produk tanpa modal berhasil dibuat (modal opsional)', `Jual: ${pKerupuk.sellingPrice}, Modal: ${pKerupuk.costPrice}`);

console.log('\n--- 2. JUALAN TETAP BISA DILAKUKAN WALAU MODAL KOSONG ---');
// Jual 3 kerupuk (tanpa modal)
store.recordSale({
  items: [{ productId: pKerupuk.id, name: pKerupuk.name, quantity: 3, price: 1000, subtotal: 3000 }],
  total: 3000,
  cashReceived: 5000,
  change: 2000,
  isDebt: false
});
const kerupukAfterSale = store.getProductById(pKerupuk.id);
assert(kerupukAfterSale.stock === 27, 'Jualan tanpa modal berhasil mengurangi stok (30 -> 27)', `Sisa stok: ${kerupukAfterSale.stock}`);
assert(store.getTodaySalesTotal() === 3000, 'Total jualan bertambah Rp3.000', `Jualan: Rp${store.getTodaySalesTotal()}`);

console.log('\n--- 3. BARANG TANPA MODAL TIDAK MENGHASILKAN PERKIRAAN SELISIH ---');
const marginReport1 = store.getMarginReportByPeriod('today');
assert(marginReport1.totalMargin === 0, 'Barang tanpa modal menghasilkan perkiraan selisih Rp0 (tidak berasumsi modal Rp0)', `Selisih: Rp${marginReport1.totalMargin}`);
assert(marginReport1.itemsWithoutCostCount === 3, 'Tercatat 3 item terjual yang belum memiliki harga modal', `Item tanpa modal: ${marginReport1.itemsWithoutCostCount}`);

console.log('\n--- 4. MARGIN/SELISIH = HARGA JUAL AKTUAL - HARGA MODAL SNAPSHOT ---');
// Jual 2 Indomie (Jual Rp3.500, Modal Rp2.800) -> Margin per item = Rp700, total = Rp1.400
store.recordSale({
  items: [{ productId: pIndomie.id, name: pIndomie.name, quantity: 2, price: 3500, subtotal: 7000 }],
  total: 7000,
  cashReceived: 10000,
  change: 3000,
  isDebt: false
});

const marginReport2 = store.getMarginReportByPeriod('today');
assert(marginReport2.totalMargin === 1400, 'Perkiraan selisih tepat Rp1.400: 2 × (Rp3.500 - Rp2.800)', `Perkiraan Selisih: Rp${marginReport2.totalMargin}`);
assert(marginReport2.itemsWithCostCount === 2, 'Tercatat 2 barang yang memiliki harga modal', `Item dengan modal: ${marginReport2.itemsWithCostCount}`);

console.log('\n--- 5. PERUBAHAN HARGA TIDAK MENGUBAH HISTORI TRANSAKSI (SNAPSHOT KEBAL) ---');
// Toko menaikkan harga jual Indomie jadi Rp4.000 dan modal naik jadi Rp3.200
store.updateProduct(pIndomie.id, {
  sellingPrice: 4000,
  costPrice: 3200
});

// Cek produk saat ini
const updatedIndomie = store.getProductById(pIndomie.id);
assert(updatedIndomie.sellingPrice === 4000 && updatedIndomie.costPrice === 3200, 'Master produk berhasil diperbarui ke harga baru');

// Cek histori transaksi lama: HARUS TETAP Rp3.500 dan Rp2.800!
const lastSale = store.getTodayGoodsSales()[0]; // transaksi Indomie tadi
const indomieSnapshot = lastSale.items.find(i => i.productId === pIndomie.id);
assert(indomieSnapshot.price === 3500, 'Histori transaksi: Harga jual tetap Rp3.500 (kebal perubahan master)', `Harga jual snapshot: Rp${indomieSnapshot.price}`);
assert(indomieSnapshot.costPrice === 2800, 'Histori transaksi: Harga modal snapshot tetap Rp2.800 (kebal perubahan master)', `Harga modal snapshot: Rp${indomieSnapshot.costPrice}`);

// Cek laporan selisih hari ini: HARUS TETAP Rp1.400 (tidak terpengaruh harga baru)!
const marginAfterPriceChange = store.getEstimatedMarginByPeriod('today');
assert(marginAfterPriceChange === 1400, 'Perkiraan selisih historis TIDAK BERUBAH walau master produk diubah', `Selisih: Rp${marginAfterPriceChange}`);

console.log('\n--- 6. TRANSAKSI BARU MEMAKAI HARGA BARU ---');
// Jual 1 Indomie dengan harga baru (Jual 4000, modal 3200) -> Selisih baru = +Rp800
store.recordSale({
  items: [{ productId: pIndomie.id, name: pIndomie.name, quantity: 1, price: 4000, subtotal: 4000 }],
  total: 4000,
  cashReceived: 5000,
  change: 1000,
  isDebt: false
});
const marginReport3 = store.getMarginReportByPeriod('today');
// Total selisih = 1.400 (transaksi lama) + 800 (transaksi baru) = 2.200
assert(marginReport3.totalMargin === 2200, 'Total selisih menggabungkan transaksi lama (Rp1.400) + transaksi baru (Rp800) = Rp2.200', `Total Selisih: Rp${marginReport3.totalMargin}`);

console.log('\n--- 7. PENJUALAN UTANG DIHITUNG SEBAGAI JUALAN & SELISIH, BUKAN UANG MASUK ---');
const cashBeforeDebt = store.getTodayCashReceived();
const budi = store.addDebtor('Budi Santoso', 0);
// Budi ngutang 2 Indomie (@4.000, modal @3.200) = Rp8.000, selisih = 2 * 800 = Rp1.600
store.recordSale({
  items: [{ productId: pIndomie.id, name: pIndomie.name, quantity: 2, price: 4000, subtotal: 8000 }],
  total: 8000,
  cashReceived: 0,
  change: 0,
  isDebt: true,
  debtorId: budi.id,
  debtorName: budi.personName
});
const cashAfterDebt = store.getTodayCashReceived();
const marginReport4 = store.getMarginReportByPeriod('today');

assert(cashAfterDebt === cashBeforeDebt, 'Penjualan utang TIDAK menambah uang kas masuk', `Uang masuk tetap: Rp${cashAfterDebt}`);
assert(store.getTodaySalesTotal() === 3000 + 7000 + 4000 + 8000, 'Penjualan utang MENAMBAH total jualan (Rp22.000)', `Total Jualan: Rp${store.getTodaySalesTotal()}`);
assert(marginReport4.totalMargin === 2200 + 1600, 'Penjualan utang MENAMBAH perkiraan selisih (Rp2.200 + Rp1.600 = Rp3.800)', `Total Selisih: Rp${marginReport4.totalMargin}`);

console.log('\n--- 8. PEMBAYARAN UTANG BUKAN JUALAN & BUKAN SELISIH BARU ---');
const salesBeforePay = store.getTodaySalesTotal();
const marginBeforePay = store.getEstimatedMarginByPeriod('today');
// Budi bayar utang Rp5.000
store.settleDebt(budi.id, 5000);

const salesAfterPay = store.getTodaySalesTotal();
const marginAfterPay = store.getEstimatedMarginByPeriod('today');
const cashAfterPay = store.getTodayCashReceived();

assert(salesAfterPay === salesBeforePay, 'Pembayaran utang TIDAK menambah total jualan (mencegah double-counting)');
assert(marginAfterPay === marginBeforePay, 'Pembayaran utang TIDAK menambah selisih baru (mencegah double margin)');
assert(cashAfterPay === cashAfterDebt + 5000, 'Pembayaran utang MENAMBAH uang masuk kas (+Rp5.000)', `Uang masuk: Rp${cashAfterPay}`);

console.log('\n--- 9. KULAKAN MENGURANGI UANG & MENAMBAH STOK, BUKAN BARANG TERJUAL ---');
const laciBeforeKulakan = store.getTodayUangKasAkhir();
// Kulakan minyak goreng Rp50.000
store.addExpense({
  category: 'Belanja Stok',
  description: 'Kulakan Minyak Goreng 5 liter',
  amount: 50000
});
const laciAfterKulakan = store.getTodayUangKasAkhir();
const salesAfterKulakan = store.getTodaySalesTotal();

assert(laciAfterKulakan === laciBeforeKulakan - 50000, 'Kulakan mengurangi Uang di Laci (-Rp50.000)', `Laci: Rp${laciAfterKulakan}`);
assert(salesAfterKulakan === salesAfterPay, 'Kulakan TIDAK dianggap barang terjual (jualan tidak bertambah)');

console.log('\n--- 10. NGOMONG AJA QUERY SELISIH (ZERO MUTATION) ---');
const parser = new NgomongParser(store);

const salesSnap = store.getTodaySalesTotal();
const cashSnap = store.getTodayCashReceived();
const marginSnap = store.getEstimatedMarginByPeriod('today');
const txCountSnap = store.data.sales.length;

// A. Test query perkiraan selisih hari ini
const resMarginToday = parser.parse('Perkiraan selisih hari ini berapa?');
assert(resMarginToday.status === 'QUERY_ANSWER' && resMarginToday.intent === INTENTS.QUERY_MARGIN, 'Query "Perkiraan selisih hari ini berapa?" terdeteksi');
assert(resMarginToday.answer.includes('Rp3.800'), 'Jawaban mengandung nominal selisih yang tepat (Rp3.800)', `Jawaban: ${resMarginToday.answer.replace(/\n/g, ' ')}`);

// B. Test query selisih minggu ini
const resMarginWeek = parser.parse('Selisih jualan minggu ini berapa?');
assert(resMarginWeek.status === 'QUERY_ANSWER' && resMarginWeek.intent === INTENTS.QUERY_MARGIN, 'Query "Selisih jualan minggu ini berapa?" terdeteksi');
assert(resMarginWeek.answer.includes('minggu ini (7 hari)'), 'Jawaban menyebutkan periode minggu ini', `Jawaban: ${resMarginWeek.answer.replace(/\n/g, ' ')}`);

// C. Verifikasi ZERO MUTATION
assert(store.getTodaySalesTotal() === salesSnap, 'SAFETY GUARD: Jualan tidak berubah');
assert(store.getTodayCashReceived() === cashSnap, 'SAFETY GUARD: Uang Masuk tidak berubah');
assert(store.getEstimatedMarginByPeriod('today') === marginSnap, 'SAFETY GUARD: Perkiraan Selisih tidak berubah');
assert(store.data.sales.length === txCountSnap, 'SAFETY GUARD: Jumlah transaksi tidak bertambah');

console.log('\n================================================================');
console.log(`  🎉 SELURUH ${totalTests} TEST V2.1 MODAL & SELISIH LULUS 100%! 🎉    `);
console.log('================================================================\n');
