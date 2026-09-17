// WARUNG OS - Indonesian Natural Number & Currency Parser
// Handles conversational amounts and quantities for non-tech-savvy users

const SINGLE_DIGITS = {
  nol: 0,
  kosong: 0,
  se: 1,
  satu: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9
};

const TEENS = {
  sepuluh: 10,
  sebelas: 11,
  'dua belas': 12,
  'tiga belas': 13,
  'empat belas': 14,
  'lima belas': 15,
  'enam belas': 16,
  'tujuh belas': 17,
  'delapan belas': 18,
  'sembilan belas': 19
};

/**
 * Parse Indonesian number words into integer.
 * e.g. "dua puluh lima ribu" -> 25000
 *      "tiga ribu lima ratus" -> 3500
 *      "seratus ribu" -> 100000
 *      "satu juta" -> 1000000
 */
export function wordsToNumber(text) {
  if (!text) return null;
  const words = text
    .toLowerCase()
    .replace(/[,\.]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  let total = 0;
  let currentGroup = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    if (w === 'juta') {
      if (currentGroup === 0) currentGroup = 1;
      total += currentGroup * 1000000;
      currentGroup = 0;
    } else if (w === 'ribu' || w === 'rb' || w === 'k' || w === 'ribuan') {
      if (currentGroup === 0) currentGroup = 1;
      total += currentGroup * 1000;
      currentGroup = 0;
    } else if (w === 'seratus') {
      currentGroup += 100;
    } else if (w === 'ratus') {
      const lastDigit = currentGroup % 10 || 1;
      currentGroup = (currentGroup - lastDigit) + (lastDigit * 100);
    } else if (w === 'sepuluh') {
      currentGroup += 10;
    } else if (w === 'sebelas') {
      currentGroup += 11;
    } else if (w === 'belas') {
      const lastDigit = currentGroup % 10 || 1;
      currentGroup = (currentGroup - lastDigit) + (lastDigit + 10);
    } else if (w === 'puluh') {
      const lastDigit = currentGroup % 10 || 1;
      currentGroup = (currentGroup - lastDigit) + (lastDigit * 10);
    } else if (w === 'seribu') {
      total += 1000;
    } else if (w === 'sejuta') {
      total += 1000000;
    } else if (SINGLE_DIGITS[w] !== undefined) {
      currentGroup += SINGLE_DIGITS[w];
    } else if (/^\d+$/.test(w)) {
      currentGroup += parseInt(w, 10);
    }
  }

  total += currentGroup;
  return total > 0 ? total : null;
}

/**
 * Extract currency amount from spoken or written Indonesian text.
 * Handles:
 * - "Rp20.000", "20.000", "20000"
 * - "20 ribu", "20rb", "20 k"
 * - "dua puluh ribu", "sepuluh ribu", "seratus ribu"
 * - "1 juta", "satu juta"
 * - "tiga puluh lima ratus" (3500)
 * Returns { amount: number, raw: string, isCasualShort: boolean } or null
 */
export function extractAmount(rawText) {
  if (!rawText) return null;
  const text = rawText.toLowerCase().trim();

  // 1. Explicit Rp formatted or numeric with dot: "Rp 20.000", "20.000", "500.000"
  // Make sure not to match single small digit like "3" or "2"
  const rpRegex = /(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+)(?:\s*(?:perak|rupiah))?/i;
  const rpMatch = text.match(rpRegex);
  if (rpMatch) {
    const num = parseInt(rpMatch[1].replace(/\./g, ''), 10);
    if (num > 0) {
      return { amount: num, raw: rpMatch[0], isCasualShort: false };
    }
  }

  // 2. Numeric with suffix: "20 ribu", "10rb", "10 rb", "50k", "1 juta", "1.5 juta"
  const numSuffixRegex = /(\d+(?:[.,]\d+)?)\s*(ribu|rb|k|juta|jt)/i;
  const numSuffixMatch = text.match(numSuffixRegex);
  if (numSuffixMatch) {
    const val = parseFloat(numSuffixMatch[1].replace(',', '.'));
    const unit = numSuffixMatch[2].toLowerCase();
    let multiplier = 1000;
    if (unit === 'juta' || unit === 'jt') multiplier = 1000000;
    const amount = Math.round(val * multiplier);
    return { amount, raw: numSuffixMatch[0], isCasualShort: false };
  }

  // 3. Plain numeric 4+ digits: "20000", "15000", "10000", "3500"
  const plainNumRegex = /\b(\d{4,9})\b/;
  const plainNumMatch = text.match(plainNumRegex);
  if (plainNumMatch) {
    const amount = parseInt(plainNumMatch[1], 10);
    return { amount, raw: plainNumMatch[0], isCasualShort: false };
  }

  // 4. Natural language words for money:
  // e.g. "dua puluh lima ribu", "sepuluh ribu", "tiga puluh ribu", "seratus ribu", "satu juta"
  // Match phrase ending in ribu/juta/ratus/rupiah/perak
  const wordMoneyRegex = /\b((?:(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|seratus|seribu|sejuta|\d+)\s+)*(?:puluh|belas|ratus|ribu|juta|ribuan)(?:\s+(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|ratus|ribu)\b)*)/i;
  const wordMoneyMatch = text.match(wordMoneyRegex);
  if (wordMoneyMatch) {
    const phrase = wordMoneyMatch[1].trim();
    const amount = wordsToNumber(phrase);
    if (amount && amount >= 500) {
      return { amount, raw: phrase, isCasualShort: false };
    }
  }

  // 5. Short casual: "bayar sepuluh" / "bayar dua puluh" / "ngutang lima belas"
  // In Indonesian warung speak, saying "sepuluh" when paying debt means 10.000.
  const casualRegex = /(?:bayar|utang|ngutang|beli|seharga|senilai)\s+(?:sebesar\s+)?(sepuluh|sebelas|dua belas|tiga belas|empat belas|lima belas|dua puluh|tiga puluh|empat puluh|lima puluh|\d{1,2})\b/i;
  const casualMatch = text.match(casualRegex);
  if (casualMatch) {
    const wordOrNum = casualMatch[1].toLowerCase();
    let base = SINGLE_DIGITS[wordOrNum] || TEENS[wordOrNum];
    if (!base && /^\d+$/.test(wordOrNum)) {
      base = parseInt(wordOrNum, 10);
    }
    if (base && base >= 5 && base <= 100) {
      // Very likely thousand: e.g. 10 -> 10.000, 20 -> 20.000
      return {
        amount: base * 1000,
        raw: casualMatch[0],
        isCasualShort: true,
        baseNumber: base
      };
    }
  }

  return null;
}

/**
 * Extract item quantity from a snippet.
 * e.g. "dua Indomie" -> 2
 *      "3 Indomie" -> 3
 *      "Indomie 2" -> 2
 *      "Indomie dua" -> 2
 *      "sebungkus Indomie" -> 1
 */
export function extractQuantity(text) {
  if (!text) return 1;
  const t = text.toLowerCase().trim();

  // 1. Indonesian number words for quantity
  const wordsMap = {
    sebungkus: 1, segelas: 1, sebutir: 1, sebuah: 1,
    satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5,
    enam: 6, tujuh: 7, delapan: 8, sembilan: 9, sepuluh: 10
  };

  // Check word boundary for number words
  for (const [w, val] of Object.entries(wordsMap)) {
    const regex = new RegExp(`\\b${w}\\b`, 'i');
    if (regex.test(t)) {
      return val;
    }
  }

  // Check digits e.g. "3", "3x", "3 x"
  const digitsMatch = t.match(/\b(\d+)\s*(?:x|bungkus|gelas|butir|buah|biji|cangkir)?\b/);
  if (digitsMatch) {
    const n = parseInt(digitsMatch[1], 10);
    if (n > 0 && n < 1000) return n;
  }

  return 1;
}
