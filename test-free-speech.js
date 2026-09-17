// Concise reporter for 30 free speech test cases
import { store } from './src/data/store.js';
import { NgomongParser } from './src/ngomong/parser.js';

store.resetToDemo();
const parser = new NgomongParser(store);

const TEST_CASES = [
  "Tadi pagi ada yang beli mie dua.",
  "Bu Siti ambil Indomie tiga, catat dulu ya.",
  "Budi tadi bayar sepuluh ribu.",
  "Eh Budi bayar utangnya sepuluh ribu.",
  "Pak Joko belum bayar yang kemarin.",
  "Tadi saya kulakan gas sama telur, habis lima puluh ribu.",
  "Telurnya tinggal berapa?",
  "Yang paling sering dibeli apa?",
  "Besok saya harus beli apa?",
  "Uang yang ada sekarang berapa?",
  "Bu Siti tadi bayar sebagian.",
  "Catat Budi utang dua puluh ribu.",
  "Budi ambil mie dua sama teh satu.",
  "Yang tadi utang siapa ya?",
  "Eh batal, jangan dicatat.",
  "Saya salah ngomong.",
  "Bayar Budi lima.",
  "Mie dua.",
  "Indomie yang goreng satu.",
  "Bu Siti bayar semua.",
  "Tadi ada orang beli tapi belum bayar.",
  "Catat utang Pak Joko.",
  "Tambah stok telur sepuluh.",
  "Telur tambahin sepuluh.",
  "Kurangi Indomie dua.",
  "Hari ini laku berapa ya?",
  "Uang di laci sekarang ada berapa?",
  "Siapa yang belum bayar?",
  "Utang Budi tinggal berapa?",
  "Warung hari ini rame gak?"
];

TEST_CASES.forEach((text, i) => {
  const id = i + 1;
  const snapSales = store.getTodaySalesTotal();
  const snapCash = store.getTodayCashReceived();
  const snapDebts = store.getTotalDebts();

  parser.clearContext();
  const res = parser.parse(text);

  const storeMutated =
    store.getTodaySalesTotal() !== snapSales ||
    store.getTodayCashReceived() !== snapCash ||
    store.getTotalDebts() !== snapDebts;

  const status = res.status;
  const intent = res.intent;
  const conf = res.confidence;
  const hasDraft = !!res.draft;
  let summary = '';

  if (res.status === 'DRAFT_READY') {
    summary = `Draft: ${res.draft.type} (Total: ${res.draft.total || res.draft.amount})`;
  } else if (res.status === 'QUERY_ANSWER') {
    summary = `Answer: ${res.answer.split('\n')[0]}`;
  } else if (res.status === 'AMBIGUOUS_PRODUCT') {
    summary = `Ambiguity: ${res.candidates.map(c => c.name).join(' / ')}`;
  } else if (res.status === 'AMBIGUOUS_PERSON') {
    summary = `Ambiguity: ${res.candidates.map(c => c.personName).join(' / ')}`;
  } else if (res.status === 'PRODUCT_NOT_FOUND') {
    summary = `NotFound: "${res.queriedName}"`;
  } else if (res.status === 'LOW_CONFIDENCE') {
    summary = `Clarify: "${res.message}"`;
  }

  console.log(`[#${id}] "${text}"`);
  console.log(`     Status: ${status} | Intent: ${intent} | Conf: ${conf} | Draft: ${hasDraft} | Mutated: ${storeMutated}`);
  console.log(`     Detail: ${summary}\n`);
});
