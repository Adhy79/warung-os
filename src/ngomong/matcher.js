// WARUNG OS - Product and Person Matcher
// Intelligent matching for Indonesian everyday spoken vocabulary with strict safety guards

import { extractQuantity } from './numbers.js';

// Common Indonesian honorifics
const HONORIFICS = ['ibu', 'bu', 'bapak', 'pak', 'mas', 'mbak', 'bang', 'kak', 'om', 'tante', 'haji', 'dek'];

// Non-product words that should NEVER be considered as product names
const NON_PRODUCT_WORDS = new Set([
  'siapa', 'apa', 'berapa', 'mana', 'kenapa', 'bagaimana', 'belum', 'sudah',
  'yang', 'ada', 'orang', 'dia', 'saya', 'kamu', 'kemarin', 'besok', 'lusa',
  'pagi', 'siang', 'sore', 'malam', 'dulu', 'semua', 'sebagian', 'tambah',
  'tambahin', 'tambahkan', 'kurang', 'kurangi', 'kurangin', 'rusak', 'retur',
  'uang', 'kas', 'laci', 'warung', 'catat', 'jangan', 'batal', 'rame', 'ramai',
  'puluh', 'ribu', 'ratus', 'juta', 'belas', 'rupiah', 'perak', 'rb', 'k'
]);

/**
 * Normalize person name by trimming and stripping honorifics for comparison
 */
export function normalizePersonName(name) {
  if (!name) return '';
  let cleaned = name.toLowerCase().trim();
  for (const h of HONORIFICS) {
    const regex = new RegExp(`^${h}\\s+`, 'i');
    cleaned = cleaned.replace(regex, '');
  }
  return cleaned.trim();
}

/**
 * Match a spoken person name against the warung's debt database.
 */
export function matchPerson(text, allDebtors = []) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // 1. First, search for exact, normalized, or first-name debtor matches
  const candidates = [];
  for (const debtor of allDebtors) {
    const dName = debtor.personName.toLowerCase();
    const dNorm = normalizePersonName(debtor.personName);
    const dFirstName = dNorm.split(/\s+/)[0];

    const fullNameRegex = new RegExp(`\\b${dName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const normRegex = new RegExp(`\\b${dNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const firstNameRegex = new RegExp(`\\b${dFirstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

    if (fullNameRegex.test(lower) || normRegex.test(lower) || (dFirstName.length >= 3 && firstNameRegex.test(lower))) {
      candidates.push(debtor);
    }
  }

  // If multiple candidates match (e.g. "Budi" and "Budi Anak Pak RT")
  if (candidates.length > 1) {
    // Check if user specifically said the longer full name
    const explicitLonger = candidates.find(
      (c) => c.personName.includes(' ') && lower.includes(c.personName.toLowerCase())
    );
    if (explicitLonger) {
      return {
        matchedDebtor: explicitLonger,
        detectedName: explicitLonger.personName,
        isAmbiguous: false,
        candidates: [],
        isNotFound: false
      };
    }

    return {
      matchedDebtor: null,
      detectedName: candidates[0].personName,
      isAmbiguous: true,
      candidates,
      isNotFound: false
    };
  }

  if (candidates.length === 1) {
    return {
      matchedDebtor: candidates[0],
      detectedName: candidates[0].personName,
      isAmbiguous: false,
      candidates: [],
      isNotFound: false
    };
  }

  // 2. If not found in existing debtors, detect potential person name from phrase:
  const honorificPattern = /\b(bu|ibu|pak|bapak|mas|mbak|bang|kak)\s+([a-zA-Z]{3,15})\b/i;
  const hMatch = text.match(honorificPattern);
  if (hMatch) {
    const rawName = `${hMatch[1].charAt(0).toUpperCase() + hMatch[1].slice(1).toLowerCase()} ${hMatch[2].charAt(0).toUpperCase() + hMatch[2].slice(1).toLowerCase()}`;
    return {
      matchedDebtor: null,
      detectedName: rawName,
      isAmbiguous: false,
      candidates: [],
      isNotFound: true
    };
  }

  // Check pattern: "[Name] bayar" or "[Name] ngutang" or "catat [Name]"
  const actionPattern = /\b(?:catat\s+)?([a-zA-Z]{3,15})\s+(?:bayar|ngutang|utang|ambil|punya utang)\b/i;
  const aMatch = text.match(actionPattern);
  if (aMatch) {
    const word = aMatch[1].toLowerCase();
    const commonIgnored = ['tadi', 'kemarin', 'dia', 'orang', 'saya', 'dia', 'sudah', 'mau', 'catat', 'toko'];
    if (!commonIgnored.includes(word)) {
      const capName = aMatch[1].charAt(0).toUpperCase() + aMatch[1].slice(1).toLowerCase();
      return {
        matchedDebtor: null,
        detectedName: capName,
        isAmbiguous: false,
        candidates: [],
        isNotFound: true
      };
    }
  }

  return null;
}

/**
 * Predefined aliases for standard Indonesian warung items
 */
const DEFAULT_ALIASES = {
  'indomie goreng': ['indomie goreng', 'mie goreng', 'indomie', 'indomie yang goreng'],
  'indomie soto': ['indomie soto', 'mie soto', 'soto'],
  'telur': ['telur', 'telor', 'endog', 'telurnya'],
  'es teh': ['es teh', 'teh es', 'teh manis', 'es teh manis', 'esteh', 'teh'],
  'kopi': ['kopi', 'kopi kapal api', 'kopi hitam', 'ngopi'],
  'beras': ['beras', 'beras ramos', 'beras 5kg'],
  'minyak goreng': ['minyak', 'minyak goreng', 'bimoli'],
  'gula pasir': ['gula', 'gula pasir', 'gula putih']
};

/**
 * Split conversational sentence into item clauses with conversational filler cleaning.
 */
export function splitItemPhrases(text) {
  if (!text) return [];
  // Clean conversational fillers thoroughly (P0 #5)
  let clean = text
    .toLowerCase()
    .replace(/\btadi pagi\b/g, '')
    .replace(/\btadi siang\b/g, '')
    .replace(/\btadi sore\b/g, '')
    .replace(/\btadi malam\b/g, '')
    .replace(/\btadi\b/g, '')
    .replace(/\bpagi\b/g, '')
    .replace(/\bsiang\b/g, '')
    .replace(/\bsore\b/g, '')
    .replace(/\bmalam\b/g, '')
    .replace(/\bada yang beli\b/g, '')
    .replace(/\bada yang\b/g, '')
    .replace(/\bada orang\b/g, '')
    .replace(/\bcatat dulu ya\b/g, '')
    .replace(/\bcatat ya\b/g, '')
    .replace(/\btolong catat\b/g, '')
    .replace(/\bcatat dulu\b/g, '')
    .replace(/\bcatat\b/g, '')
    .replace(/\byang kemarin\b/g, '')
    .replace(/\bkemarin\b/g, '')
    .replace(/\beh\b/g, '')
    .replace(/\blaku\b/g, '')
    .replace(/\bbeli\b/g, '')
    .replace(/\bambil\b/g, '')
    .replace(/\bpesan\b/g, '')
    .replace(/\bngutang\b/g, '')
    .replace(/\butang\b/g, '')
    .replace(/\btapi\b/g, '')
    .replace(/\bya bu\b/g, '')
    .replace(/\bya pak\b/g, '')
    .replace(/\bya\b/g, '')
    .trim();

  // Split by conjunctions: "sama", "dan", "terus", "lalu", "plus", comma, semicolon
  const parts = clean
    .split(/\s*(?:sama|dan|terus|lalu|plus|,|;)\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return parts.length > 0 ? parts : [clean];
}

/**
 * Match a single item phrase against store products.
 */
export function matchSingleProduct(phrase, products = []) {
  if (!phrase) return null;
  const pLower = phrase.toLowerCase().trim();
  const quantity = extractQuantity(phrase);

  // Clean quantity, units, punctuation, and fillers from phrase to isolate the product keyword
  let cleanedKeyword = pLower
    .replace(/[.,;!?]/g, ' ')
    .replace(/\b(?:sebungkus|segelas|sebutir|sebuah|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|\d+)\b/g, ' ')
    .replace(/\b(?:bungkus|gelas|butir|buah|biji|cangkir|piring|botol|kg|liter|x)\b/g, ' ')
    .replace(/\b(?:bayar|utang|ngutang|cicil|lunas|kembalian|uang|kas|masuk|keluar|beli|laku|ambil|tadi|pagi|siang|sore|malam|masih|tinggal|ada|berapa|stok)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If after removing financial/action words there is nothing left, it is NOT an item
  if (!cleanedKeyword || cleanedKeyword.length < 2) {
    return null;
  }

  // Check if cleaned keyword is solely composed of non-product words (P0 #2)
  const tokens = cleanedKeyword.split(/\s+/).filter(Boolean);
  const isAllNonProduct = tokens.every((tok) => NON_PRODUCT_WORDS.has(tok));
  if (isAllNonProduct) {
    return null;
  }

  // 1. Check for specific ambiguity case: "mie"
  // When user says "mie" without specifying goreng or soto, and both exist
  if (cleanedKeyword === 'mie' || cleanedKeyword === 'mi') {
    const mieCandidates = products.filter((p) => p.name.toLowerCase().includes('indomie') || p.name.toLowerCase().includes('mie'));
    if (mieCandidates.length > 1) {
      return {
        product: null,
        quantity,
        isAmbiguous: true,
        candidates: mieCandidates,
        isNotFound: false,
        rawPhrase: phrase
      };
    }
  }

  // 2. Exact or Alias Matching
  const matches = [];

  for (const prod of products) {
    const prodName = prod.name.toLowerCase();

    // Check direct match
    if (prodName.includes(cleanedKeyword) || cleanedKeyword.includes(prodName)) {
      matches.push(prod);
      continue;
    }

    // Check alias mapping
    const aliases = DEFAULT_ALIASES[prodName] || [];
    for (const alias of aliases) {
      if (cleanedKeyword.includes(alias) || alias.includes(cleanedKeyword)) {
        matches.push(prod);
        break;
      }
    }
  }

  // If user says "indomie yang goreng" or "indomie", and "Indomie Goreng" is in products
  if (matches.length > 1) {
    if (cleanedKeyword.includes('goreng')) {
      const goreng = matches.find((m) => m.name.toLowerCase().includes('goreng'));
      if (goreng) return { product: goreng, quantity, isAmbiguous: false, candidates: [], isNotFound: false, rawPhrase: phrase };
    }
    if (cleanedKeyword.includes('soto')) {
      const soto = matches.find((m) => m.name.toLowerCase().includes('soto'));
      if (soto) return { product: soto, quantity, isAmbiguous: false, candidates: [], isNotFound: false, rawPhrase: phrase };
    }
    if (cleanedKeyword === 'indomie') {
      const goreng = matches.find((m) => m.name.toLowerCase().includes('goreng'));
      if (goreng) return { product: goreng, quantity, isAmbiguous: false, candidates: [], isNotFound: false, rawPhrase: phrase };
    }

    // If genuinely ambiguous between products
    return {
      product: null,
      quantity,
      isAmbiguous: true,
      candidates: matches,
      isNotFound: false,
      rawPhrase: phrase
    };
  }

  if (matches.length === 1) {
    return {
      product: matches[0],
      quantity,
      isAmbiguous: false,
      candidates: [],
      isNotFound: false,
      rawPhrase: phrase
    };
  }

  // 3. Strict guard for NOT FOUND (P0 #2):
  // Only declare not found if the phrase has an explicit item quantity or appears in an explicit buying clause
  const hasExplicitQuantity = /\b(?:\d+|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebungkus|segelas|sebutir)\b/i.test(phrase);
  if (hasExplicitQuantity && cleanedKeyword.length >= 3 && !tokens.some((t) => NON_PRODUCT_WORDS.has(t))) {
    return {
      product: null,
      quantity,
      isAmbiguous: false,
      candidates: [],
      isNotFound: true,
      rawPhrase: phrase,
      queriedName: cleanedKeyword || phrase
    };
  }

  // Otherwise, it's just non-matching text, not a product
  return null;
}

/**
 * Match all products and quantities from spoken input.
 */
export function matchProductsFromText(text, products = [], detectedPersonName = '') {
  if (!text) return [];
  let cleanedText = text;
  if (detectedPersonName) {
    const escaped = detectedPersonName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleanedText = cleanedText.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
  }
  // Strip standalone honorific + person patterns
  cleanedText = cleanedText.replace(/\b(?:bu|ibu|pak|bapak|mas|mbak|bang|kak)\s+[a-zA-Z]{3,15}\b/gi, '');

  const phrases = splitItemPhrases(cleanedText);
  const results = [];

  for (const phrase of phrases) {
    const lower = phrase.toLowerCase();
    if (lower.includes('bayar utang') || lower.includes('beli gas')) continue;

    const matched = matchSingleProduct(phrase, products);
    if (matched && (matched.product || matched.isAmbiguous || matched.isNotFound)) {
      results.push(matched);
    }
  }

  return results;
}
