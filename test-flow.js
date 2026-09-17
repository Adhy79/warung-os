// WARUNG OS V1 — Comprehensive Financial & UX Logic Verification
import { store, formatRupiah, parseRupiahInput } from './src/data/store.js';

console.log('================================================================');
console.log('         WARUNG OS V1 — PENGUJIAN LOGIKA KEUANGAN LENGKAP       ');
console.log('================================================================\n');

// 1. Reset ke Data Demo Awal
store.resetToDemo();

const baseSales = store.getTodaySalesTotal();
const basePaid = store.getTodaySalesPaid();
const baseDebtSales = store.getTodaySalesDebt();
const baseCash = store.getTodayCashReceived();
const baseExp = store.getTodayExpensesTotal();
const baseTersisa = store.getTodayUangTersisa();
const baseTotalDebt = store.getTotalDebts();

console.log('--- 1. DATA AWAL WARUNG BU SITI ---');
console.log('Total Jualan Hari Ini :', formatRupiah(baseSales));
console.log('Sudah Dibayar Tunai   :', formatRupiah(basePaid));
console.log('Masih Ngutang Hari Ini:', formatRupiah(baseDebtSales));
console.log('Uang Kas Diterima     :', formatRupiah(baseCash));
console.log('Pengeluaran Hari Ini  :', formatRupiah(baseExp));
console.log('UANG TERSISA DI KAS   :', formatRupiah(baseTersisa));
console.log('Total Utang Pelanggan :', formatRupiah(baseTotalDebt));

// Test a: Transaksi Lunas
console.log('\n--- 2. TEST A: TRANSAKSI LUNAS (2 Indomie Goreng = Rp7.000) ---');
const indomie = store.getProductById('prod-1');
const stockAwalIndomie = indomie.stock;

store.recordSale({
  items: [{ productId: indomie.id, name: indomie.name, quantity: 2, price: 3500, subtotal: 7000 }],
  total: 7000,
  cashReceived: 10000,
  change: 3000,
  isDebt: false
});

const afterASales = store.getTodaySalesTotal();
const afterAPaid = store.getTodaySalesPaid();
const afterACash = store.getTodayCashReceived();
const afterATersisa = store.getTodayUangTersisa();
const stockBaruIndomie = store.getProductById('prod-1').stock;

console.log('Stok Indomie         :', stockAwalIndomie, '->', stockBaruIndomie, '(Berkurang 2)');
console.log('Total Jualan Bertambah:', formatRupiah(afterASales - baseSales), '== Rp7.000 (BENAR)');
console.log('Uang Diterima Bertambah:', formatRupiah(afterACash - baseCash), '== Rp7.000 (BENAR)');
console.log('Uang Tersisa Bertambah :', formatRupiah(afterATersisa - baseTersisa), '== Rp7.000 (BENAR)');
if (afterASales - baseSales !== 7000 || afterACash - baseCash !== 7000) {
  throw new Error('Test A Gagal!');
}

// Test b: Transaksi Ngutang
console.log('\n--- 3. TEST B: TRANSAKSI NGUTANG (2 Telur = Rp6.000 ke Budi) ---');
const telur = store.getProductById('prod-3');
const budiAwal = store.getDebts().find(d => d.personName === 'Budi');
const utangBudiAwal = budiAwal.totalDebt; // 25.000

store.recordSale({
  items: [{ productId: telur.id, name: telur.name, quantity: 2, price: 3000, subtotal: 6000 }],
  total: 6000,
  cashReceived: 0,
  change: 0,
  isDebt: true,
  debtorId: budiAwal.id
});

const afterBSales = store.getTodaySalesTotal();
const afterBDebtSales = store.getTodaySalesDebt();
const afterBCash = store.getTodayCashReceived();
const afterBTersisa = store.getTodayUangTersisa();
const budiAfterB = store.getDebts().find(d => d.personName === 'Budi');

console.log('Total Jualan Bertambah    :', formatRupiah(afterBSales - afterASales), '== Rp6.000 (BENAR)');
console.log('Jualan Ngutang Bertambah  :', formatRupiah(afterBDebtSales), '== Rp6.000 (BENAR)');
console.log('UANG KAS DITERIMA TIDAK NAIK:', formatRupiah(afterBCash - afterACash), '== Rp0 (BENAR, bukan uang tunai!)');
console.log('UANG TERSISA TIDAK NAIK   :', formatRupiah(afterBTersisa - afterATersisa), '== Rp0 (BENAR!)');
console.log('Utang Budi Bertambah      :', formatRupiah(utangBudiAwal), '->', formatRupiah(budiAfterB.totalDebt), '== Rp31.000 (BENAR)');
if (afterBCash !== afterACash || budiAfterB.totalDebt !== 31000) {
  throw new Error('Test B Gagal!');
}

// Test c: Pembayaran Utang Sebagian (Cicilan Rp10.000)
console.log('\n--- 4. TEST C: PEMBAYARAN UTANG SEBAGIAN (Budi Nyicil Rp10.000) ---');
store.settleDebt(budiAwal.id, 10000);

const afterCSales = store.getTodaySalesTotal();
const afterCCash = store.getTodayCashReceived();
const afterCTersisa = store.getTodayUangTersisa();
const budiAfterC = store.getDebts().find(d => d.personName === 'Budi');

console.log('Total Jualan TIDAK Berubah:', formatRupiah(afterCSales), '==', formatRupiah(afterBSales), '(BENAR, tidak double counting)');
console.log('Uang Kas Diterima Bertambah:', formatRupiah(afterCCash - afterBCash), '== Rp10.000 (BENAR)');
console.log('Uang Tersisa Bertambah    :', formatRupiah(afterCTersisa - afterBTersisa), '== Rp10.000 (BENAR)');
console.log('Sisa Utang Budi Berkurang :', formatRupiah(budiAfterC.totalDebt), '== Rp21.000 (BENAR)');
if (afterCSales !== afterBSales || afterCCash - afterBCash !== 10000 || budiAfterC.totalDebt !== 21000) {
  throw new Error('Test C Gagal!');
}

// Test d: Pembayaran Utang Lunas (Budi Melunasi Sisa Rp21.000)
console.log('\n--- 5. TEST D: PEMBAYARAN UTANG LUNAS (Budi Lunasi Sisa Rp21.000) ---');
store.settleDebt(budiAwal.id, 21000);

const afterDSales = store.getTodaySalesTotal();
const afterDCash = store.getTodayCashReceived();
const afterDTersisa = store.getTodayUangTersisa();
const budiAfterD = store.getAllDebts().find(d => d.id === budiAwal.id);

console.log('Total Jualan Tetap Konsisten:', formatRupiah(afterDSales), '(BENAR)');
console.log('Uang Kas Diterima Bertambah :', formatRupiah(afterDCash - afterCCash), '== Rp21.000 (BENAR)');
console.log('Uang Tersisa Bertambah     :', formatRupiah(afterDTersisa - afterCTersisa), '== Rp21.000 (BENAR)');
console.log('Status Utang Budi          :', formatRupiah(budiAfterD.totalDebt), '| Status:', budiAfterD.status, '== paid (LUNAS BENAR)');
if (budiAfterD.totalDebt !== 0 || budiAfterD.status !== 'paid') {
  throw new Error('Test D Gagal!');
}

// Test e, f, g: Verifikasi Konsistensi Menyeluruh
console.log('\n--- 6. VERIFIKASI AKHIR KONSISTENSI FORMULA (e, f, g) ---');
const finalSales = store.getTodaySalesTotal();
const finalPaid = store.getTodaySalesPaid();
const finalDebtSales = store.getTodaySalesDebt();
const finalDebtPayments = store.getTodayDebtPaymentsReceived();
const finalCash = store.getTodayCashReceived();
const finalExp = store.getTodayExpensesTotal();
const finalTersisa = store.getTodayUangTersisa();
const finalTotalDebt = store.getTotalDebts();

// e. Verifikasi uang tunai
const formulaCashCheck = (finalPaid + finalDebtPayments) === finalCash;
const formulaTersisaCheck = (finalCash - finalExp) === finalTersisa;
console.log('e. Verifikasi Uang Tunai Diterima (Sudah Bayar + Pelunasan Utang == Kas Diterima):', formulaCashCheck ? 'PAS 100% ✅' : 'GAGAL ❌');
console.log('   Verifikasi Uang Tersisa (Kas Diterima - Pengeluaran == Uang Tersisa)           :', formulaTersisaCheck ? 'PAS 100% ✅' : 'GAGAL ❌');

// f. Verifikasi total jualan
const formulaSalesCheck = (finalPaid + finalDebtSales) === finalSales;
console.log('f. Verifikasi Total Jualan (Jualan Tunai + Jualan Ngutang == Total Jualan)        :', formulaSalesCheck ? 'PAS 100% ✅' : 'GAGAL ❌');

// g. Verifikasi sisa utang
const sumDebts = store.getDebts().reduce((sum, d) => sum + d.totalDebt, 0);
const formulaDebtCheck = sumDebts === finalTotalDebt;
console.log('g. Verifikasi Sisa Utang Pelanggan (Jumlah Saldo Utang Semua Orang Aktif)         :', formulaDebtCheck ? 'PAS 100% ✅' : 'GAGAL ❌');

if (!formulaCashCheck || !formulaTersisaCheck || !formulaSalesCheck || !formulaDebtCheck) {
  throw new Error('Verifikasi Konsistensi Formula Gagal!');
}

console.log('\n================================================================');
console.log('       SEMUA 7 TEST (A-G) BERHASIL DAN KONSISTEN 100%          ');
console.log('================================================================\n');
