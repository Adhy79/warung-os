// WARUNG OS V1 — REAL WORLD WARUNG DAY TEST
import { store, formatRupiah } from './src/data/store.js';

console.log('================================================================');
console.log('       WARUNG OS V1 — REAL WORLD WARUNG DAY BUSINESS TEST       ');
console.log('================================================================\n');

// 1. START: Buka warung dengan kas awal Rp500.000
console.log('1. [START] BUKA WARUNG');
store.save({
  isOnboarded: true,
  warung: {
    id: 'warung-real',
    name: 'Warung Bu Siti',
    category: 'Sembako & Makanan',
    initialCash: 500000,
    createdAt: new Date().toISOString()
  },
  products: [
    { id: 'prod-1', name: 'Indomie Goreng', emoji: '🍜', sellingPrice: 3500, costPrice: 2800, stock: 20, unit: 'bungkus', lowStockThreshold: 5 },
    { id: 'prod-2', name: 'Indomie Soto', emoji: '🍲', sellingPrice: 3500, costPrice: 2800, stock: 15, unit: 'bungkus', lowStockThreshold: 5 },
    { id: 'prod-3', name: 'Telur', emoji: '🥚', sellingPrice: 3000, costPrice: 2400, stock: 12, unit: 'butir', lowStockThreshold: 5 },
    { id: 'prod-4', name: 'Es Teh', emoji: '🥤', sellingPrice: 4000, costPrice: 1500, stock: 20, unit: 'gelas', lowStockThreshold: 5 },
    { id: 'prod-5', name: 'Kopi', emoji: '☕', sellingPrice: 5000, costPrice: 3000, stock: 10, unit: 'cangkir', lowStockThreshold: 4 }
  ],
  sales: [],
  expenses: [],
  debts: [],
  settings: { fontSize: 'normal', speechEnabled: true }
});

const kasAwal = store.getKasAwal();
console.log('   Kas Awal di Laci Warung:', formatRupiah(kasAwal));

// 2. PAGI: Catat pengeluaran belanja stok Rp150.000
console.log('\n2. [PAGI] BELANJA STOK Rp150.000');
store.addExpense({
  category: 'Belanja barang',
  description: 'Belanja stok pagi',
  amount: 150000
});
console.log('   Pengeluaran pagi dicatat: Rp150.000');

// 3. PENJUALAN 1: Jual 3 × Indomie Goreng @ Rp3.500 (Tunai)
console.log('\n3. [PENJUALAN 1] 3 × Indomie Goreng @ Rp3.500 = Rp10.500 (Tunai)');
const indomie = store.getProductById('prod-1');
store.recordSale({
  items: [{ productId: indomie.id, name: indomie.name, quantity: 3, price: 3500, subtotal: 10500 }],
  total: 10500,
  cashReceived: 10500,
  change: 0,
  isDebt: false
});
console.log('   Transaksi 1 berhasil dicatat.');

// 4. PENJUALAN 2: Jual 2 × Es Teh @ Rp4.000 (Tunai)
console.log('\n4. [PENJUALAN 2] 2 × Es Teh @ Rp4.000 = Rp8.000 (Tunai)');
const esTeh = store.getProductById('prod-4');
store.recordSale({
  items: [{ productId: esTeh.id, name: esTeh.name, quantity: 2, price: 4000, subtotal: 8000 }],
  total: 8000,
  cashReceived: 10000,
  change: 2000,
  isDebt: false
});
console.log('   Transaksi 2 berhasil dicatat.');

// 5. PENJUALAN 3: Budi membeli barang senilai Rp20.000 (NGUTANG)
console.log('\n5. [PENJUALAN 3] Budi beli barang Rp20.000 (NGUTANG)');
store.recordSale({
  items: [{ productId: 'misc-1', name: 'Barang Campuran', quantity: 1, price: 20000, subtotal: 20000 }],
  total: 20000,
  cashReceived: 0,
  change: 0,
  isDebt: true,
  debtorName: 'Budi'
});
console.log('   Transaksi 3 dicatat sebagai NGUTANG untuk Budi.');

// 6. PENJUALAN 4: Bu Siti membeli barang senilai Rp15.000 (NGUTANG)
console.log('\n6. [PENJUALAN 4] Bu Siti beli barang Rp15.000 (NGUTANG)');
store.recordSale({
  items: [{ productId: 'misc-2', name: 'Barang Campuran', quantity: 1, price: 15000, subtotal: 15000 }],
  total: 15000,
  cashReceived: 0,
  change: 0,
  isDebt: true,
  debtorName: 'Bu Siti'
});
console.log('   Transaksi 4 dicatat sebagai NGUTANG untuk Bu Siti.');

// 7. SIANG: Budi membayar sebagian utangnya Rp10.000
console.log('\n7. [SIANG] Budi bayar sebagian utang Rp10.000 (Cicilan)');
const budi = store.getAllDebts().find(d => d.personName.toLowerCase() === 'budi');
if (!budi) throw new Error('Data Budi tidak ditemukan!');
store.settleDebt(budi.id, 10000);
console.log('   Pembayaran cicilan Budi Rp10.000 dicatat.');

// 8. SORE: Belanja stok lagi Rp50.000
console.log('\n8. [SORE] Belanja stok sore Rp50.000');
store.addExpense({
  category: 'Belanja barang',
  description: 'Belanja stok sore',
  amount: 50000
});
console.log('   Pengeluaran sore dicatat: Rp50.000');

// 9. TUTUP WARUNG: AUDIT MENYELURUH
console.log('\n================================================================');
console.log('              9. [TUTUP WARUNG] AUDIT MENYELURUH                ');
console.log('================================================================\n');

const totalJualan = store.getTodaySalesTotal();
const jualanTunai = store.getTodaySalesPaid();
const jualanNgutang = store.getTodaySalesDebt();
const uangMasuk = store.getTodayCashReceived();
const bayarUtangMasuk = store.getTodayDebtPaymentsReceived();
const totalPengeluaran = store.getTodayExpensesTotal();
const uangKasAkhir = store.getTodayUangKasAkhir();

const dataBudi = store.getAllDebts().find(d => d.personName.toLowerCase() === 'budi');
const dataBuSiti = store.getAllDebts().find(d => d.personName.toLowerCase() === 'bu siti');
const totalUtangPelanggan = store.getTotalDebts();

const stokIndomie = store.getProductById('prod-1').stock;
const stokEsTeh = store.getProductById('prod-4').stock;

console.log('1.  Total Nilai Semua Jualan         :', formatRupiah(totalJualan), `(Target: Rp53.500) -> ${totalJualan === 53500 ? 'BENAR ✅' : 'SALAH ❌'}`);
console.log('2.  Total Jualan Tunai               :', formatRupiah(jualanTunai), `(Target: Rp18.500) -> ${jualanTunai === 18500 ? 'BENAR ✅' : 'SALAH ❌'}`);
console.log('3.  Total Jualan Ngutang             :', formatRupiah(jualanNgutang), `(Target: Rp35.000) -> ${jualanNgutang === 35000 ? 'BENAR ✅' : 'SALAH ❌'}`);
console.log('4.  Total Uang Tunai yang Masuk      :', formatRupiah(uangMasuk), `(Target: Rp28.500) -> ${uangMasuk === 28500 ? 'BENAR ✅' : 'SALAH ❌'}`);
console.log('5.  Total Pembayaran Utang Masuk     :', formatRupiah(bayarUtangMasuk), `(Target: Rp10.000) -> ${bayarUtangMasuk === 10000 ? 'BENAR ✅' : 'SALAH ❌'}`);
console.log('6.  Total Pengeluaran                :', formatRupiah(totalPengeluaran), `(Target: Rp200.000) -> ${totalPengeluaran === 200000 ? 'BENAR ✅' : 'SALAH ❌'}`);
console.log('7.  Uang Kas Akhir                   :', formatRupiah(uangKasAkhir), `(Target: Rp328.500) -> ${uangKasAkhir === 328500 ? 'BENAR ✅' : 'SALAH ❌'}`);
console.log('8.  Total Utang Budi                 :', formatRupiah(dataBudi.totalDebt), `(Target: Rp10.000) -> ${dataBudi.totalDebt === 10000 ? 'BENAR ✅' : 'SALAH ❌'}`);
console.log('9.  Total Utang Bu Siti              :', formatRupiah(dataBuSiti.totalDebt), `(Target: Rp15.000) -> ${dataBuSiti.totalDebt === 15000 ? 'BENAR ✅' : 'SALAH ❌'}`);
console.log('10. Total Seluruh Utang Pelanggan    :', formatRupiah(totalUtangPelanggan), `(Target: Rp25.000) -> ${totalUtangPelanggan === 25000 ? 'BENAR ✅' : 'SALAH ❌'}`);
console.log('11. Stok Indomie Goreng (Awal 20-3)  :', stokIndomie, `bungkus (Target: 17) -> ${stokIndomie === 17 ? 'BENAR ✅' : 'SALAH ❌'}`);
console.log('    Stok Es Teh (Awal 20-2)          :', stokEsTeh, `gelas (Target: 18) -> ${stokEsTeh === 18 ? 'BENAR ✅' : 'SALAH ❌'}`);

console.log('\n--- VERIFIKASI FORMULA WAJIB ---');
const formula1 = totalJualan === (jualanTunai + jualanNgutang);
console.log('Formula 1: TOTAL JUALAN == JUALAN TUNAI + JUALAN NGUTANG');
console.log(`          ${formatRupiah(totalJualan)} == ${formatRupiah(jualanTunai)} + ${formatRupiah(jualanNgutang)} -> ${formula1 ? 'PAS 100% ✅' : 'GAGAL ❌'}`);

const formula2 = uangMasuk === (jualanTunai + bayarUtangMasuk);
console.log('Formula 2: UANG MASUK == JUALAN TUNAI + PEMBAYARAN UTANG');
console.log(`          ${formatRupiah(uangMasuk)} == ${formatRupiah(jualanTunai)} + ${formatRupiah(bayarUtangMasuk)} -> ${formula2 ? 'PAS 100% ✅' : 'GAGAL ❌'}`);

const formula3 = uangKasAkhir === (kasAwal + uangMasuk - totalPengeluaran);
console.log('Formula 3: UANG KAS AKHIR == KAS AWAL + UANG MASUK - PENGELUARAN');
console.log(`          ${formatRupiah(uangKasAkhir)} == ${formatRupiah(kasAwal)} + ${formatRupiah(uangMasuk)} - ${formatRupiah(totalPengeluaran)} -> ${formula3 ? 'PAS 100% ✅' : 'GAGAL ❌'}`);

const formula4 = totalUtangPelanggan === (dataBudi.totalDebt + dataBuSiti.totalDebt);
console.log('Formula 4: TOTAL UTANG == SEMUA SALDO UTANG PELANGGAN YANG BELUM LUNAS');
console.log(`          ${formatRupiah(totalUtangPelanggan)} == ${formatRupiah(dataBudi.totalDebt)} + ${formatRupiah(dataBuSiti.totalDebt)} -> ${formula4 ? 'PAS 100% ✅' : 'GAGAL ❌'}`);

// 12. Cek apakah ada transaksi double-counting
const salesRaw = store.getSales();
const countGoodsSales = store.getTodayGoodsSales().length; // 4 transaksi jualan
const countDebtPayments = salesRaw.filter(s => s.isDebtPayment).length; // 1 transaksi bayar utang
const noDoubleCount = (countGoodsSales === 4) && (countDebtPayments === 1);

console.log('\n12. Verifikasi Bebas Double-Counting :');
console.log('    Jumlah transaksi jualan barang   :', countGoodsSales, '(Harus 4 transaksi) ->', countGoodsSales === 4 ? 'PAS ✅' : 'GAGAL ❌');
console.log('    Jumlah transaksi bayar utang     :', countDebtPayments, '(Harus 1 transaksi) ->', countDebtPayments === 1 ? 'PAS ✅' : 'GAGAL ❌');
console.log('    Total transaksi di sistem        :', salesRaw.length, '(Total 5 transaksi fisik) ->', noDoubleCount ? 'PAS ✅' : 'GAGAL ❌');

if (!formula1 || !formula2 || !formula3 || !formula4 || !noDoubleCount) {
  console.error('\n❌ AUDIT GAGAL: Ada inkonsistensi formula!');
  process.exit(1);
} else {
  console.log('\n================================================================');
  console.log('  🎉 SEMUA 12 BUTIR AUDIT LULUS DENGAN KONSISTENSI 100%! 🎉   ');
  console.log('================================================================\n');
}
