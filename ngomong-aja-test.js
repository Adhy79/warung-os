// WARUNG OS V1.1 — NGOMONG AJA AUTOMATED TEST SUITE
// Tests all natural language processing, entity extraction, intent detection,
// and guarantees zero database mutation without confirmation.

import { store } from './src/data/store.js';
import { wordsToNumber, extractAmount } from './src/ngomong/numbers.js';
import { matchPerson, matchSingleProduct } from './src/ngomong/matcher.js';
import { detectIntent, INTENTS } from './src/ngomong/intent.js';
import { NgomongParser } from './src/ngomong/parser.js';
import { executeConfirmedDraft, cancelPendingDraft } from './src/ngomong/confirmation.js';

console.log('================================================================');
console.log('       WARUNG OS V1.1 — NGOMONG AJA AUTOMATED TEST SUITE        ');
console.log('================================================================\n');

// Reset store with pristine demo data
store.resetToDemo();
const parser = new NgomongParser(store);

let passedTests = 0;
let totalTests = 0;

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
// TEST 1: "Tadi laku dua Indomie." (SALE_CASH)
// -------------------------------------------------------------
const res1 = parser.parse('Tadi laku dua Indomie.');
assert(
  res1.status === 'DRAFT_READY' &&
  res1.intent === INTENTS.SALE_CASH &&
  res1.draft.items.length === 1 &&
  res1.draft.items[0].quantity === 2 &&
  res1.draft.total === 7000,
  'Tadi laku dua Indomie.',
  `Draft Total: Rp${res1.draft?.total} (2 × Indomie Goreng @ Rp3.500)`
);

// -------------------------------------------------------------
// TEST 2: "Bu Siti ngutang tiga Indomie." (SALE_DEBT)
// -------------------------------------------------------------
const res2 = parser.parse('Bu Siti ngutang tiga Indomie.');
assert(
  res2.status === 'DRAFT_READY' &&
  res2.intent === INTENTS.SALE_DEBT &&
  res2.draft.isDebt === true &&
  res2.draft.debtorName === 'Bu Siti' &&
  res2.draft.items[0].quantity === 3 &&
  res2.draft.total === 10500,
  'Bu Siti ngutang tiga Indomie.',
  `Debtor: ${res2.draft?.debtorName}, Total: Rp${res2.draft?.total} (3 × Rp3.500)`
);

// -------------------------------------------------------------
// TEST 3: "Budi bayar utang sepuluh ribu." (DEBT_PAYMENT)
// -------------------------------------------------------------
const res3 = parser.parse('Budi bayar utang sepuluh ribu.');
assert(
  res3.status === 'DRAFT_READY' &&
  res3.intent === INTENTS.DEBT_PAYMENT &&
  res3.draft.personName.toLowerCase().includes('budi') &&
  res3.draft.amount === 10000 &&
  res3.draft.previousDebt === 25000 &&
  res3.draft.remainingDebt === 15000,
  'Budi bayar utang sepuluh ribu.',
  `Bayar: Rp${res3.draft?.amount}, Utang Awal: Rp${res3.draft?.previousDebt}, Sisa: Rp${res3.draft?.remainingDebt}`
);

// -------------------------------------------------------------
// TEST 4: "Tadi beli gas dua puluh ribu." (EXPENSE)
// -------------------------------------------------------------
const res4 = parser.parse('Tadi beli gas dua puluh ribu.');
assert(
  res4.status === 'DRAFT_READY' &&
  res4.intent === INTENTS.EXPENSE &&
  res4.draft.amount === 20000 &&
  res4.draft.description.toLowerCase().includes('gas'),
  'Tadi beli gas dua puluh ribu.',
  `Pengeluaran: ${res4.draft?.description}, Jumlah: Rp${res4.draft?.amount}`
);

// -------------------------------------------------------------
// TEST 5: "Telur masih berapa?" (QUERY_STOCK)
// -------------------------------------------------------------
const res5 = parser.parse('Telur masih berapa?');
assert(
  res5.status === 'QUERY_ANSWER' &&
  res5.intent === INTENTS.QUERY_STOCK &&
  res5.answer.includes('Telur') &&
  res5.answer.includes('12'),
  'Telur masih berapa?',
  `Jawaban Sistem: "${res5.answer.replace('\n', ' ')}"`
);

// -------------------------------------------------------------
// TEST 6: "Jualan hari ini berapa?" (QUERY_SALES)
// -------------------------------------------------------------
const res6 = parser.parse('Jualan hari ini berapa?');
assert(
  res6.status === 'QUERY_ANSWER' &&
  res6.intent === INTENTS.QUERY_SALES &&
  res6.answer.includes('487.000'),
  'Jualan hari ini berapa?',
  `Jawaban Sistem: "${res6.answer.replace('\n', ' ')}"`
);

// -------------------------------------------------------------
// TEST 7: Nominal "10 ribu"
// -------------------------------------------------------------
const amt7 = extractAmount('bayar 10 ribu');
assert(
  amt7 && amt7.amount === 10000,
  'Nominal "10 ribu"',
  `Hasil parsing: ${amt7?.amount}`
);

// -------------------------------------------------------------
// TEST 8: Nominal "sepuluh ribu"
// -------------------------------------------------------------
const amt8 = extractAmount('uang sepuluh ribu');
assert(
  amt8 && amt8.amount === 10000,
  'Nominal "sepuluh ribu"',
  `Hasil parsing: ${amt8?.amount}`
);

// Also test other Indonesian words
assert(wordsToNumber('dua puluh lima ribu') === 25000, 'Nominal "dua puluh lima ribu" -> 25000');
assert(wordsToNumber('seratus ribu') === 100000, 'Nominal "seratus ribu" -> 100000');
assert(wordsToNumber('satu juta') === 1000000, 'Nominal "satu juta" -> 1000000');

// -------------------------------------------------------------
// TEST 9: Ambiguous Product (e.g. "mie")
// -------------------------------------------------------------
const res9 = parser.parse('Tadi laku dua mie');
assert(
  res9.status === 'AMBIGUOUS_PRODUCT' &&
  res9.candidates.length >= 2,
  'Ambiguous Product: "mie"',
  `Kandidat terdeteksi: ${res9.candidates.map((c) => c.name).join(', ')} -> Pertanyaan: "${res9.question}"`
);

// -------------------------------------------------------------
// TEST 10: Ambiguous Person (Multiple "Budi"s)
// -------------------------------------------------------------
// Add a second Budi to test ambiguity
store.addDebtor('Budi Anak Pak RT', 50000, 'Utang kedua');
const res10 = parser.parse('Budi bayar utang sepuluh ribu');
assert(
  res10.status === 'AMBIGUOUS_PERSON' &&
  res10.candidates.length >= 2,
  'Ambiguous Person: Multiple Budis',
  `Kandidat terdeteksi: ${res10.candidates.map((c) => c.personName).join(', ')} -> Pertanyaan: "${res10.question}"`
);

// -------------------------------------------------------------
// TEST 11: Low-Confidence Input (Unrelated / Inaudible)
// -------------------------------------------------------------
const res11 = parser.parse('halo selamat pagi apa kabar');
assert(
  res11.status === 'LOW_CONFIDENCE' &&
  res11.confidence < 0.70,
  'Low Confidence Input: "halo selamat pagi apa kabar"',
  `Status: ${res11.status}, Confidence: ${res11.confidence}`
);

// -------------------------------------------------------------
// TEST 12: Memastikan DRAFT TIDAK langsung mengubah database
// -------------------------------------------------------------
// Check current sales total, stock, cash, expenses
const initialSalesTotal = store.getTodaySalesTotal();
const initialStockTelur = store.getProductById('prod-3').stock;
const initialCash = store.getTodayCashReceived();
const initialDebts = store.getTotalDebts();

// Parse a new sale: "Tadi laku dua telur"
const draftSale = parser.parse('Tadi laku dua telur');
assert(draftSale.status === 'DRAFT_READY', 'Draft sale created');

// Check that NOTHING changed in store
assert(
  store.getTodaySalesTotal() === initialSalesTotal &&
  store.getProductById('prod-3').stock === initialStockTelur &&
  store.getTodayCashReceived() === initialCash &&
  store.getTotalDebts() === initialDebts,
  'DRAFT TIDAK MENGUBAH DATABASE',
  `Sales: Rp${store.getTodaySalesTotal()} (Tetap), Stok Telur: ${store.getProductById('prod-3').stock} (Tetap), Kas: Rp${store.getTodayCashReceived()} (Tetap)`
);

// -------------------------------------------------------------
// TEST 13: Memastikan CONFIRM mengubah database (via V1 store)
// -------------------------------------------------------------
const execResult = executeConfirmedDraft(draftSale.draft, store);
assert(
  execResult.success === true &&
  store.getProductById('prod-3').stock === initialStockTelur - 2 &&
  store.getTodaySalesTotal() === initialSalesTotal + 6000 &&
  store.getTodayCashReceived() === initialCash + 6000,
  'CONFIRM MENGUBAH DATABASE SECARA KONSISTEN',
  `Telur berkurang 2 (${initialStockTelur} -> ${store.getProductById('prod-3').stock}), Jualan naik Rp6.000, Kas naik Rp6.000`
);

// -------------------------------------------------------------
// TEST 14: Memastikan CANCEL tidak mengubah database
// -------------------------------------------------------------
const salesBeforeCancel = store.getTodaySalesTotal();
const stockBeforeCancel = store.getProductById('prod-3').stock;

const draftCancel = parser.parse('Tadi laku tiga telur');
const cancelResult = cancelPendingDraft(draftCancel.draft);

assert(
  cancelResult.cancelled === true &&
  store.getTodaySalesTotal() === salesBeforeCancel &&
  store.getProductById('prod-3').stock === stockBeforeCancel,
  'CANCEL TIDAK MENGUBAH DATABASE',
  `Data utuh tanpa perubahan: Total jualan tetap Rp${store.getTodaySalesTotal()}, Stok tetap ${store.getProductById('prod-3').stock}`
);

// -------------------------------------------------------------
// TEST 19: DEMO SCENARIO LENGKAP (Section 27)
// "Tadi Bu Siti ngutang tiga Indomie sama satu es teh."
// -------------------------------------------------------------
store.resetToDemo();
const demoInitialSales = store.getTodaySalesTotal();
const demoInitialCash = store.getTodayCashReceived();
const demoInitialDebtBuSiti = store.getDebts().find((d) => d.personName === 'Bu Siti').totalDebt;
const demoInitialStockIndomie = store.getProductById('prod-1').stock;
const demoInitialStockEsTeh = store.getProductById('prod-4').stock;

const demoRes = parser.parse('Tadi Bu Siti ngutang tiga Indomie sama satu es teh.');
assert(
  demoRes.status === 'DRAFT_READY' &&
  demoRes.draft.debtorName === 'Bu Siti' &&
  demoRes.draft.items.length === 2 &&
  demoRes.draft.total === 14500, // 3 x 3500 + 1 x 4000 = 10500 + 4000 = 14500
  'Demo Scenario: Draft Bu Siti ngutang 3 Indomie + 1 Es Teh',
  `Total draft: Rp${demoRes.draft?.total} (3 Indomie @ Rp3.500 + 1 Es Teh @ Rp4.000)`
);

// User menekan CATAT
const demoExec = executeConfirmedDraft(demoRes.draft, store);
assert(
  demoExec.success === true &&
  store.getProductById('prod-1').stock === demoInitialStockIndomie - 3 &&
  store.getProductById('prod-4').stock === demoInitialStockEsTeh - 1 &&
  store.getTodaySalesTotal() === demoInitialSales + 14500 &&
  store.getTodayCashReceived() === demoInitialCash && // TIDAK MENAMBAH UANG TUNAI
  store.getDebts().find((d) => d.personName === 'Bu Siti').totalDebt === demoInitialDebtBuSiti + 14500,
  'Demo Scenario: Eksekusi CATAT memenuhi seluruh kriteria bisnis Section 27',
  `Utang Bu Siti: Rp${store.getDebts().find((d) => d.personName === 'Bu Siti').totalDebt}, Kas: Rp${store.getTodayCashReceived()} (TETAP), Jualan: Rp${store.getTodaySalesTotal()}`
);

// -------------------------------------------------------------
// P0 #7 CRITICAL SAFETY TESTS
// -------------------------------------------------------------
store.resetToDemo();

// 1. "Telur tambahin sepuluh." -> BUKAN SALE_CASH
const p0_1 = parser.parse('Telur tambahin sepuluh.');
assert(
  p0_1.intent !== INTENTS.SALE_CASH && p0_1.status === 'SAFE_CLARIFY',
  'P0 #1: "Telur tambahin sepuluh." BUKAN SALE_CASH',
  `Status: ${p0_1.status}, Intent: ${p0_1.intent}`
);

// 2. "Kurangi Indomie dua." -> BUKAN SALE_CASH
const p0_2 = parser.parse('Kurangi Indomie dua.');
assert(
  p0_2.intent !== INTENTS.SALE_CASH && p0_2.status === 'SAFE_CLARIFY',
  'P0 #2: "Kurangi Indomie dua." BUKAN SALE_CASH',
  `Status: ${p0_2.status}, Intent: ${p0_2.intent}`
);

// 3. "Utang Budi tinggal berapa?" -> QUERY_DEBT
const p0_3 = parser.parse('Utang Budi tinggal berapa?');
assert(
  p0_3.intent === INTENTS.QUERY_DEBT && p0_3.status === 'QUERY_ANSWER',
  'P0 #3: "Utang Budi tinggal berapa?" -> QUERY_DEBT',
  `Jawaban: ${p0_3.answer}`
);

// 4. "Uang di laci sekarang ada berapa?" -> QUERY_CASH
const p0_4 = parser.parse('Uang di laci sekarang ada berapa?');
assert(
  p0_4.intent === INTENTS.QUERY_CASH && p0_4.status === 'QUERY_ANSWER',
  'P0 #4: "Uang di laci sekarang ada berapa?" -> QUERY_CASH',
  `Jawaban: ${p0_4.answer.split('\n')[0]}`
);

// 5. "Siapa yang belum bayar?" -> QUERY_DEBT
const p0_5 = parser.parse('Siapa yang belum bayar?');
assert(
  p0_5.intent === INTENTS.QUERY_DEBT && p0_5.status === 'QUERY_ANSWER',
  'P0 #5: "Siapa yang belum bayar?" -> QUERY_DEBT',
  `Jawaban: ${p0_5.answer.split('\n')[0]}`
);

// 6. "Tadi pagi ada yang beli mie dua." -> BUKAN PRODUCT_NOT_FOUND, AMBIGUOUS_PRODUCT
const p0_6 = parser.parse('Tadi pagi ada yang beli mie dua.');
assert(
  p0_6.status !== 'PRODUCT_NOT_FOUND' && p0_6.status === 'AMBIGUOUS_PRODUCT',
  'P0 #6: "Tadi pagi ada yang beli mie dua." -> AMBIGUOUS_PRODUCT (Klarifikasi Goreng vs Soto)',
  `Status: ${p0_6.status}, Opsi: ${p0_6.options?.join(', ')}`
);

// 7. "Pak Joko belum bayar yang kemarin." -> BUKAN PRODUCT_NOT_FOUND
const p0_7 = parser.parse('Pak Joko belum bayar yang kemarin.');
assert(
  p0_7.status !== 'PRODUCT_NOT_FOUND' && p0_7.intent === INTENTS.QUERY_DEBT,
  'P0 #7: "Pak Joko belum bayar yang kemarin." -> QUERY_DEBT (bukan PRODUCT_NOT_FOUND)',
  `Jawaban: ${p0_7.answer}`
);

// 8. "Bu Siti ambil Indomie tiga, catat dulu ya." -> SALE_DEBT / Aman
const p0_8 = parser.parse('Bu Siti ambil Indomie tiga, catat dulu ya.');
assert(
  p0_8.status === 'DRAFT_READY' && p0_8.intent === INTENTS.SALE_DEBT && p0_8.draft?.debtorName === 'Bu Siti' && p0_8.draft?.total === 10500,
  'P0 #8: "Bu Siti ambil Indomie tiga, catat dulu ya." -> SALE_DEBT Bu Siti Rp10.500',
  `Draft Total: Rp${p0_8.draft?.total}`
);

// 9. "Catat Budi utang dua puluh ribu." -> SALE_DEBT / Aman
const p0_9 = parser.parse('Catat Budi utang dua puluh ribu.');
assert(
  p0_9.status === 'DRAFT_READY' && p0_9.intent === INTENTS.SALE_DEBT && p0_9.draft?.debtorName === 'Budi' && p0_9.draft?.total === 20000,
  'P0 #9: "Catat Budi utang dua puluh ribu." -> SALE_DEBT Budi Rp20.000',
  `Draft Total: Rp${p0_9.draft?.total}`
);

// 10. "Bu Siti bayar semua." -> DEBT_PAYMENT dengan seluruh saldo Bu Siti (Rp18.000)
const p0_10 = parser.parse('Bu Siti bayar semua.');
assert(
  p0_10.status === 'DRAFT_READY' && p0_10.intent === INTENTS.DEBT_PAYMENT && p0_10.draft?.amount === 18000 && p0_10.draft?.remainingDebt === 0,
  'P0 #10: "Bu Siti bayar semua." -> DEBT_PAYMENT pelunasan saldo penuh (Rp18.000)',
  `Bayar: Rp${p0_10.draft?.amount}, Sisa: Rp${p0_10.draft?.remainingDebt}`
);

console.log('\n================================================================');
console.log(`  🎉 SEMUA ${totalTests} SKENARIO TEST V1.1 NGOMONG AJA LULUS 100%! 🎉  `);
console.log('================================================================\n');
