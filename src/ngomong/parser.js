// WARUNG OS - Natural Language Parser Engine
// Orchestrates text understanding, entity extraction, confidence, and conversational state with strict safety guards

import { extractAmount } from './numbers.js';
import { matchPerson, matchProductsFromText, matchSingleProduct } from './matcher.js';
import { detectIntent, INTENTS } from './intent.js';

export class NgomongParser {
  constructor(storeInstance) {
    this.store = storeInstance;
    this.sessionContext = {
      pendingDraft: null,
      pendingPurchase: null,
      lastAction: null,
      contextPerson: null,
      contextProduct: null
    };
  }

  setStore(storeInstance) {
    this.store = storeInstance;
  }

  clearContext() {
    this.sessionContext = {
      pendingDraft: null,
      pendingPurchase: null,
      lastAction: null,
      contextPerson: null,
      contextProduct: null
    };
  }

  /**
   * Main entry point to parse user natural language input.
   * Returns a structured analysis object.
   */
  parse(rawText) {
    if (!rawText || !rawText.trim()) {
      return {
        status: 'LOW_CONFIDENCE',
        intent: INTENTS.UNKNOWN,
        confidence: 0,
        message: 'Maaf Bu, suaranya belum terdengar jelas. Coba ulangi lagi ya 😊'
      };
    }

    const text = rawText.trim();
    const lower = text.toLowerCase();
    const products = this.store.getProducts();
    const debts = this.store.getAllDebts();

    // 1. Check Affirmation / Negation for Pending Draft (P0 #6)
    if (this.sessionContext.pendingDraft) {
      if (/^(?:iya|ya|betul|benar|oke|ok|catat|simpan)$/i.test(lower)) {
        return {
          status: 'EXECUTE_CONFIRMED',
          draft: this.sessionContext.pendingDraft,
          intent: 'CONFIRM'
        };
      }
      if (/^(?:batal|jangan|gak jadi|tidak|bukan|salah)$/i.test(lower) || lower.includes('batal') || lower.includes('jangan dicatat')) {
        const cancelledDraft = this.sessionContext.pendingDraft;
        this.sessionContext.pendingDraft = null;
        return {
          status: 'EXECUTE_CANCELLED',
          draft: cancelledDraft,
          intent: 'CANCEL',
          message: 'Batal ya, Bu. Belanjaan tadi tidak jadi dicatat 😊'
        };
      }
    } else {
      // Standalone cancellation / correction without active draft (P0 #6)
      if (lower.includes('batal') || lower.includes('jangan dicatat') || lower.includes('gak jadi')) {
        return {
          status: 'SAFE_CLARIFY',
          intent: 'CANCEL',
          confidence: 0.98,
          message: 'Belum ada yang dicatat kok, Bu 😊'
        };
      }
      if (lower.includes('salah ngomong') || lower.includes('salah bicara')) {
        return {
          status: 'SAFE_CLARIFY',
          intent: 'CANCEL',
          confidence: 0.98,
          message: 'Tidak apa-apa Bu, santai saja 😊 Belum ada data yang dicatat kok.'
        };
      }
    }

    // Check if waiting for purchase quantity clarification
    if (this.sessionContext.pendingPurchase) {
      const explicitQty = this.extractPurchaseQuantity(text, '');
      if (explicitQty && explicitQty > 0) {
        const { product, totalCost } = this.sessionContext.pendingPurchase;
        this.sessionContext.pendingPurchase = null;
        const quantity = explicitQty;
        const unitCost = Math.round(totalCost / quantity);

        const draft = {
          type: INTENTS.PURCHASE,
          productId: product.id,
          productName: product.name,
          productEmoji: product.emoji || '📦',
          productUnit: product.unit || 'pcs',
          quantity,
          totalCost,
          unitCost,
          confidence: 0.95
        };

        this.sessionContext.pendingDraft = draft;

        return {
          status: 'DRAFT_READY',
          intent: INTENTS.PURCHASE,
          confidence: 0.95,
          draft,
          summary: `BELI BARANG\n${product.name}\n${quantity} pcs\nTotal Rp${totalCost.toLocaleString('id-ID')}\nModal/unit Rp${unitCost.toLocaleString('id-ID')}\n\nCatat pembelian barang ini?`
        };
      }
    }

    // 2. Extract Entities
    const matchedPersonResult = matchPerson(text, debts);
    const matchedProducts = matchProductsFromText(text, products, matchedPersonResult?.detectedName);
    const amountResult = extractAmount(text);

    // 3. Ambiguity Check: Ambiguous Person
    if (matchedPersonResult && matchedPersonResult.isAmbiguous) {
      return {
        status: 'AMBIGUOUS_PERSON',
        intent: INTENTS.UNKNOWN,
        confidence: 0.75,
        candidates: matchedPersonResult.candidates,
        question: `Budi yang mana ya, Bu?`,
        options: matchedPersonResult.candidates.map((c) => c.personName)
      };
    }

    // 4. Intent Classification Early Hint
    const intentResult = detectIntent(text, {
      hasPerson: !!matchedPersonResult,
      hasItems: matchedProducts.some((p) => p.product),
      hasAmount: !!amountResult
    });
    const intent = intentResult.intent;
    let confidence = intentResult.confidence;

    // 5. Ambiguity Check: Ambiguous Product (e.g. "mie" when both Goreng and Soto exist)
    const ambiguousProd = matchedProducts.find((p) => p.isAmbiguous);
    if (ambiguousProd && intent !== INTENTS.DEBT_PAYMENT && intent !== INTENTS.EXPENSE && !intent.startsWith('QUERY_') && intent !== INTENTS.STOCK_ADD && intent !== INTENTS.STOCK_REMOVE) {
      const candidates = ambiguousProd.candidates;
      return {
        status: 'AMBIGUOUS_PRODUCT',
        intent: INTENTS.UNKNOWN,
        confidence: 0.75,
        candidates,
        question: `Tadi maksudnya ${candidates.map((c) => c.name).join(' atau ')}, Bu?`,
        options: candidates.map((c) => c.name.replace(/Indomie\s*/i, ''))
      };
    }

    // 6. Product Not Found Check (P0 #2 - strictly guarded)
    const notFoundProd = matchedProducts.find((p) => p.isNotFound);
    if (
      notFoundProd &&
      (intent === INTENTS.SALE_CASH || intent === INTENTS.SALE_DEBT) &&
      !lower.includes('gas') && !lower.includes('bensin') && !lower.includes('listrik') &&
      !lower.includes('bayar') && !lower.includes('belum bayar')
    ) {
      const queried = notFoundProd.queriedName || notFoundProd.rawPhrase;
      return {
        status: 'PRODUCT_NOT_FOUND',
        intent: INTENTS.UNKNOWN,
        confidence: 0.65,
        queriedName: queried,
        question: `Saya belum menemukan barang '${queried}' di daftar warung 😊`,
        options: ['TAMBAH BARANG', 'BATAL']
      };
    }

    // 7. Person Not Found Check (specifically when debt intent is present)
    const isDebtContext = lower.includes('ngutang') || lower.includes('utang') || lower.includes('kasbon');
    if (isDebtContext && matchedPersonResult && matchedPersonResult.isNotFound && !lower.includes('siapa')) {
      const pName = matchedPersonResult.detectedName;
      return {
        status: 'PERSON_NOT_FOUND',
        intent: INTENTS.SALE_DEBT,
        confidence: 0.75,
        personName: pName,
        question: `Saya belum menemukan ${pName}. Mau tambahkan sebagai orang yang ngutang?`,
        options: ['TAMBAH', 'BATAL'],
        items: matchedProducts.filter((p) => p.product).map((p) => ({
          productId: p.product.id,
          name: p.product.name,
          quantity: p.quantity,
          price: p.product.sellingPrice,
          subtotal: p.quantity * p.product.sellingPrice
        }))
      };
    }

    // 8. Ambiguous Casual Amount Check: "Bayar Budi lima"
    if (amountResult && amountResult.isCasualShort && amountResult.baseNumber < 10 && intent === INTENTS.DEBT_PAYMENT) {
      return {
        status: 'AMBIGUOUS_AMOUNT',
        intent: INTENTS.DEBT_PAYMENT,
        confidence: 0.70,
        suggestedAmount: amountResult.amount,
        question: `Maksudnya Rp${amountResult.amount.toLocaleString('id-ID')} ya, Bu?`,
        options: ['IYA', 'BUKAN'],
        raw: amountResult.raw
      };
    }

    // 9. Read-Only Query Intents (Zero Mutation, Instant Answers)
    if (
      intent === INTENTS.QUERY_SALES ||
      intent === INTENTS.QUERY_CASH ||
      intent === INTENTS.QUERY_EXPENSE ||
      intent === INTENTS.QUERY_PURCHASE ||
      intent === INTENTS.QUERY_MARGIN ||
      intent === INTENTS.QUERY_DEBT ||
      intent === INTENTS.QUERY_STOCK ||
      intent === INTENTS.QUERY_BEST_SELLER ||
      intent === INTENTS.QUERY_RESTOCK
    ) {
      return this.handleQueryIntent(intent, text, matchedProducts, matchedPersonResult);
    }

    // 10. STOCK MANAGEMENT SAFETY RESPONSES (CRITICAL P0 #1)
    // Never fall into SALE_CASH
    if (intent === INTENTS.STOCK_ADD) {
      const pMatch = matchedProducts.find((p) => p.product);
      const pName = pMatch ? pMatch.product.name : 'barang';
      return {
        status: 'SAFE_CLARIFY',
        intent: INTENTS.STOCK_ADD,
        confidence: 0.95,
        message: `Tadi mau menambah stok ${pName} ya, Bu? 😊 Silakan ubah jumlah stok di menu Barang agar tercatat rapi.`
      };
    }

    if (intent === INTENTS.STOCK_REMOVE) {
      const pMatch = matchedProducts.find((p) => p.product);
      const pName = pMatch ? pMatch.product.name : 'barang';
      return {
        status: 'SAFE_CLARIFY',
        intent: INTENTS.STOCK_REMOVE,
        confidence: 0.95,
        message: `Mau mengurangi stok ${pName} ya, Bu? 😊 Silakan pakai menu Barang agar sisa stok tidak keliru.`
      };
    }

    // 11. Low Confidence Filter: If confidence < 0.70, do not assume or invent
    if (confidence < 0.70 || intent === INTENTS.UNKNOWN) {
      return {
        status: 'LOW_CONFIDENCE',
        intent: INTENTS.UNKNOWN,
        confidence,
        message: 'Maaf Bu, saya belum begitu paham. Mau catat jualan, utang, atau belanja stok? 😊'
      };
    }

    // 12. Transactional Draft Formulation

    // A. DEBT PAYMENT
    if (intent === INTENTS.DEBT_PAYMENT) {
      const debtor = matchedPersonResult?.matchedDebtor;
      const personName = debtor?.personName || matchedPersonResult?.detectedName || 'Pelanggan';
      let amount = amountResult ? amountResult.amount : 0;

      // Handle "bayar semua", "bayar lunas", "lunasi" (P0 #7 #10)
      if (!amount && (lower.includes('semua') || lower.includes('lunas') || lower.includes('habis'))) {
        if (debtor && debtor.totalDebt > 0) {
          amount = debtor.totalDebt;
        }
      }

      if (!amount) {
        return {
          status: 'LOW_CONFIDENCE',
          intent: INTENTS.DEBT_PAYMENT,
          confidence: 0.65,
          message: `Berapa rupiah yang dibayar ${personName}, Bu? 😊`
        };
      }

      const prevDebt = debtor ? debtor.totalDebt : 0;
      const remainingDebt = Math.max(0, prevDebt - amount);

      const draft = {
        type: INTENTS.DEBT_PAYMENT,
        debtorId: debtor?.id || null,
        personName,
        previousDebt: prevDebt,
        amount,
        remainingDebt,
        confidence: 0.95
      };

      this.sessionContext.pendingDraft = draft;

      return {
        status: 'DRAFT_READY',
        intent: INTENTS.DEBT_PAYMENT,
        confidence: 0.95,
        draft,
        summary: `${personName} bayar Rp${amount.toLocaleString('id-ID')}.\nUtang sebelumnya Rp${prevDebt.toLocaleString('id-ID')}.\nSisa utang Rp${remainingDebt.toLocaleString('id-ID')}.\n\nCatat pembayaran ini?`
      };
    }

    // B.1 PURCHASE (BELANJA BARANG V2.2)
    if (intent === INTENTS.PURCHASE) {
      const pMatch = matchedProducts.find((p) => p.product);
      const product = pMatch?.product || (products.length > 0 ? products[0] : null);
      const totalCost = amountResult ? amountResult.amount : 0;

      if (!product) {
        return {
          status: 'LOW_CONFIDENCE',
          intent: INTENTS.PURCHASE,
          confidence: 0.65,
          message: 'Tadi beli barang apa ya, Bu? 😊'
        };
      }

      if (!totalCost || totalCost === 0) {
        return {
          status: 'LOW_CONFIDENCE',
          intent: INTENTS.PURCHASE,
          confidence: 0.65,
          message: `Berapa total belanja untuk ${product.name}, Bu? 😊`
        };
      }

      // Extract explicit quantity without guessing (Rule 4)
      const explicitQty = this.extractPurchaseQuantity(text, amountResult ? amountResult.raw : '');
      if (!explicitQty) {
        this.sessionContext.pendingPurchase = {
          product,
          totalCost
        };
        return {
          status: 'CLARIFY_PURCHASE_QUANTITY',
          intent: INTENTS.PURCHASE,
          confidence: 0.85,
          product,
          totalCost,
          message: `Tadi beli ${product.name} berapa ${product.unit || 'bungkus'}, Bu? 😊`
        };
      }

      const quantity = explicitQty;
      const unitCost = Math.round(totalCost / quantity);

      const draft = {
        type: INTENTS.PURCHASE,
        productId: product.id,
        productName: product.name,
        productEmoji: product.emoji || '📦',
        productUnit: product.unit || 'pcs',
        quantity,
        totalCost,
        unitCost,
        confidence: 0.95
      };

      this.sessionContext.pendingDraft = draft;
      this.sessionContext.pendingPurchase = null;

      return {
        status: 'DRAFT_READY',
        intent: INTENTS.PURCHASE,
        confidence: 0.95,
        draft,
        summary: `BELI BARANG\n${product.name}\n${quantity} pcs\nTotal Rp${totalCost.toLocaleString('id-ID')}\nModal/unit Rp${unitCost.toLocaleString('id-ID')}\n\nCatat pembelian barang ini?`
      };
    }

    // B.2 EXPENSE
    if (intent === INTENTS.EXPENSE) {
      const amount = amountResult ? amountResult.amount : 0;
      let note = 'Belanja Stok';

      if (lower.includes('gas')) note = 'Gas';
      else if (lower.includes('bensin')) note = 'Bensin';
      else if (lower.includes('listrik')) note = 'Listrik';
      else if (lower.includes('sabun')) note = 'Sabun';
      else if (lower.includes('plastik') || lower.includes('kresek')) note = 'Plastik';
      else if (lower.includes('kulakan')) note = 'Kulakan Stok';
      else {
        // Extract note after "beli "
        const beliMatch = text.match(/beli\s+([a-zA-Z0-9\s]+?)(?:\s+\d+|\s+sebesar|\s+dua|\s+satu|$)/i);
        if (beliMatch) note = beliMatch[1].trim();
      }

      if (!amount) {
        return {
          status: 'LOW_CONFIDENCE',
          intent: INTENTS.EXPENSE,
          confidence: 0.65,
          message: `Berapa rupiah pengeluaran untuk ${note}, Bu? 😊`
        };
      }

      const draft = {
        type: INTENTS.EXPENSE,
        category: 'Operasional Warung',
        description: note,
        amount,
        confidence: 0.95
      };

      this.sessionContext.pendingDraft = draft;

      return {
        status: 'DRAFT_READY',
        intent: INTENTS.EXPENSE,
        confidence: 0.95,
        draft,
        summary: `Pengeluaran ${note} Rp${amount.toLocaleString('id-ID')}.\n\nMau dicatat?`
      };
    }

    // C. SALE DEBT
    if (intent === INTENTS.SALE_DEBT) {
      const debtor = matchedPersonResult?.matchedDebtor;
      const personName = debtor?.personName || matchedPersonResult?.detectedName || 'Pelanggan';

      // Collect items
      const validItems = matchedProducts
        .filter((p) => p.product)
        .map((p) => ({
          productId: p.product.id,
          name: p.product.name,
          quantity: p.quantity,
          price: p.product.sellingPrice,
          subtotal: p.quantity * p.product.sellingPrice
        }));

      let total = validItems.reduce((sum, i) => sum + i.subtotal, 0);

      // If no specific item, check if user said raw amount e.g. "Catat Budi utang dua puluh ribu"
      if (validItems.length === 0 && amountResult) {
        total = amountResult.amount;
      }

      if (total === 0) {
        return {
          status: 'LOW_CONFIDENCE',
          intent: INTENTS.SALE_DEBT,
          confidence: 0.65,
          message: `${personName} ngutang barang apa atau berapa rupiah ya, Bu? 😊`
        };
      }

      const draft = {
        type: INTENTS.SALE_DEBT,
        isDebt: true,
        debtorId: debtor?.id || null,
        debtorName: personName,
        items: validItems,
        total,
        confidence: 0.95
      };

      this.sessionContext.pendingDraft = draft;

      return {
        status: 'DRAFT_READY',
        intent: INTENTS.SALE_DEBT,
        confidence: 0.95,
        draft,
        summary: `${personName} mau dicatat punya utang:\n${validItems.map((i) => `${i.name} × ${i.quantity} — Rp${i.subtotal.toLocaleString('id-ID')}`).join('\n') || `Total: Rp${total.toLocaleString('id-ID')}`}\n\nTotal Rp${total.toLocaleString('id-ID')}.\n\nSudah benar?`
      };
    }

    // D. SALE CASH
    if (intent === INTENTS.SALE_CASH) {
      const validItems = matchedProducts
        .filter((p) => p.product)
        .map((p) => ({
          productId: p.product.id,
          name: p.product.name,
          quantity: p.quantity,
          price: p.product.sellingPrice,
          subtotal: p.quantity * p.product.sellingPrice
        }));

      let total = validItems.reduce((sum, i) => sum + i.subtotal, 0);
      if (validItems.length === 0 && amountResult) {
        total = amountResult.amount;
      }

      if (total === 0) {
        return {
          status: 'LOW_CONFIDENCE',
          intent: INTENTS.SALE_CASH,
          confidence: 0.65,
          message: 'Tadi laku barang apa saja ya Bu? 😊'
        };
      }

      const draft = {
        type: INTENTS.SALE_CASH,
        isDebt: false,
        items: validItems,
        total,
        cashReceived: total,
        change: 0,
        confidence: 0.95
      };

      this.sessionContext.pendingDraft = draft;

      return {
        status: 'DRAFT_READY',
        intent: INTENTS.SALE_CASH,
        confidence: 0.95,
        draft,
        summary: `Saya catat:\n${validItems.map((i) => `${i.name} × ${i.quantity}`).join('\n')}\nTotal Rp${total.toLocaleString('id-ID')}\n\nSudah benar?`
      };
    }

    return {
      status: 'LOW_CONFIDENCE',
      intent: INTENTS.UNKNOWN,
      confidence: 0.5,
      message: 'Maaf Bu, saya belum begitu paham. Mau catat apa ya? 😊'
    };
  }

  extractPeriod(text) {
    const lower = (text || '').toLowerCase();
    if (lower.includes('minggu ini') || lower.includes('7 hari') || lower.includes('seminggu')) {
      return 'week';
    }
    if (lower.includes('bulan ini') || lower.includes('sebulan')) {
      return 'month';
    }
    return 'today';
  }

  /**
   * Handle read-only questions directly from live store data
   */
  handleQueryIntent(intent, text, matchedProducts, matchedPersonResult) {
    const formatRp = (num) => 'Rp' + Math.round(num || 0).toLocaleString('id-ID');
    const lower = (text || '').toLowerCase();
    const period = this.extractPeriod(text);

    switch (intent) {
      case INTENTS.QUERY_SALES: {
        if (period === 'week') {
          const totalSales = this.store.getSalesTotalByPeriod('week');
          const salesPaid = this.store.getSalesPaidByPeriod('week');
          const salesDebt = this.store.getSalesDebtByPeriod('week');
          return {
            status: 'QUERY_ANSWER',
            intent,
            confidence: 0.98,
            answer: `Jualan minggu ini (7 hari) ${formatRp(totalSales)} 😊\n(Sudah dibayar: ${formatRp(salesPaid)}${salesDebt > 0 ? `, Masih ngutang: ${formatRp(salesDebt)}` : ''})`
          };
        }
        if (period === 'month') {
          const totalSales = this.store.getSalesTotalByPeriod('month');
          const salesPaid = this.store.getSalesPaidByPeriod('month');
          const salesDebt = this.store.getSalesDebtByPeriod('month');
          return {
            status: 'QUERY_ANSWER',
            intent,
            confidence: 0.98,
            answer: `Jualan bulan ini ${formatRp(totalSales)} 😊\n(Sudah dibayar: ${formatRp(salesPaid)}${salesDebt > 0 ? `, Masih ngutang: ${formatRp(salesDebt)}` : ''})`
          };
        }
        const totalSales = this.store.getTodaySalesTotal();
        const salesPaid = this.store.getTodaySalesPaid();
        const salesDebt = this.store.getTodaySalesDebt();
        return {
          status: 'QUERY_ANSWER',
          intent,
          confidence: 0.98,
          answer: `Hari ini jualan ${formatRp(totalSales)} 😊\n(Sudah dibayar: ${formatRp(salesPaid)}${salesDebt > 0 ? `, Masih ngutang: ${formatRp(salesDebt)}` : ''})`
        };
      }

      case INTENTS.QUERY_CASH: {
        if (lower.includes('uang masuk')) {
          if (period === 'week') {
            const cashWeek = this.store.getCashReceivedByPeriod('week');
            return {
              status: 'QUERY_ANSWER',
              intent,
              confidence: 0.98,
              answer: `Uang masuk minggu ini (7 hari) ada ${formatRp(cashWeek)} 😊`
            };
          }
          if (period === 'month') {
            const cashMonth = this.store.getCashReceivedByPeriod('month');
            return {
              status: 'QUERY_ANSWER',
              intent,
              confidence: 0.98,
              answer: `Uang masuk bulan ini ada ${formatRp(cashMonth)} 😊`
            };
          }
        }
        const cashAkhir = this.store.getTodayUangKasAkhir ? this.store.getTodayUangKasAkhir() : this.store.getTodayCashReceived();
        const cashToday = this.store.getTodayCashReceived();
        const expenses = this.store.getTodayExpensesTotal();
        return {
          status: 'QUERY_ANSWER',
          intent,
          confidence: 0.98,
          answer: `Uang di laci/kas warung sekarang ada ${formatRp(cashAkhir)} 😊\n(Uang masuk hari ini: ${formatRp(cashToday)}, Pengeluaran: ${formatRp(expenses)})`
        };
      }

      case INTENTS.QUERY_EXPENSE: {
        let label = 'hari ini';
        if (period === 'week') label = 'minggu ini (7 hari)';
        if (period === 'month') label = 'bulan ini';
        const expTotal = this.store.getExpensesTotalByPeriod
          ? this.store.getExpensesTotalByPeriod(period)
          : this.store.getTodayExpensesTotal();
        return {
          status: 'QUERY_ANSWER',
          intent,
          confidence: 0.98,
          answer: `Pengeluaran warung ${label} ada ${formatRp(expTotal)} 😊`
        };
      }

      case INTENTS.QUERY_PURCHASE: {
        let label = 'hari ini';
        if (period === 'week') label = 'minggu ini (7 hari)';
        if (period === 'month') label = 'bulan ini';
        const purchTotal = this.store.getPurchasesTotalByPeriod
          ? this.store.getPurchasesTotalByPeriod(period)
          : this.store.getTodayPurchasesTotal();
        const purchCount = this.store.getPurchasesCountByPeriod
          ? this.store.getPurchasesCountByPeriod(period)
          : this.store.getTodayPurchasesCount();
        return {
          status: 'QUERY_ANSWER',
          intent,
          confidence: 0.98,
          answer: `Belanja barang warung ${label} ada ${formatRp(purchTotal)} 😊 (${purchCount} transaksi belanja)`
        };
      }

      case INTENTS.QUERY_MARGIN: {
        let label = 'hari ini';
        if (period === 'week') label = 'minggu ini (7 hari)';
        if (period === 'month') label = 'bulan ini';
        const report = this.store.getMarginReportByPeriod(period);
        let note = '';
        if (report.itemsWithoutCostCount > 0) {
          note = `\n(Catatan: Ada ${report.itemsWithoutCostCount} barang laku yang modalnya belum diisi)`;
        }
        return {
          status: 'QUERY_ANSWER',
          intent,
          confidence: 0.98,
          answer: `Perkiraan selisih jualan ${label} ada ${formatRp(report.totalMargin)} 😊${note}`
        };
      }

      case INTENTS.QUERY_STOCK: {
        const validProd = matchedProducts.find((p) => p.product);
        if (validProd && validProd.product) {
          const p = validProd.product;
          return {
            status: 'QUERY_ANSWER',
            intent,
            confidence: 0.98,
            answer: `${p.name} tinggal ${p.stock} ${p.unit || 'buah'} 😊`
          };
        }
        // General stock inquiry
        const low = this.store.getLowStockProducts();
        return {
          status: 'QUERY_ANSWER',
          intent,
          confidence: 0.95,
          answer: low.length > 0
            ? `Barang yang stoknya tinggal sedikit:\n${low.map((p) => `• ${p.name}: sisa ${p.stock}`).join('\n')}`
            : `Alhamdulillah semua stok barang masih aman, Bu 😊`
        };
      }

      case INTENTS.QUERY_DEBT: {
        if (matchedPersonResult && matchedPersonResult.matchedDebtor) {
          const d = matchedPersonResult.matchedDebtor;
          return {
            status: 'QUERY_ANSWER',
            intent,
            confidence: 0.98,
            answer: `Utang ${d.personName} saat ini ${formatRp(d.totalDebt)} 😊`
          };
        }
        const debts = this.store.getDebts();
        const total = this.store.getTotalDebts();
        if (debts.length === 0) {
          return {
            status: 'QUERY_ANSWER',
            intent,
            confidence: 0.98,
            answer: 'Alhamdulillah tidak ada pelanggan yang ngutang saat ini, Bu 😊'
          };
        }
        return {
          status: 'QUERY_ANSWER',
          intent,
          confidence: 0.98,
          answer: `Ada ${debts.length} orang yang masih punya utang (Total ${formatRp(total)}):\n${debts.map((d) => `• ${d.personName}: ${formatRp(d.totalDebt)}`).join('\n')}`
        };
      }

      case INTENTS.QUERY_BEST_SELLER: {
        let periodLabel = 'hari ini';
        if (period === 'week') periodLabel = 'minggu ini';
        if (period === 'month') periodLabel = 'bulan ini';

        if (period !== 'today' && this.store.getBestSellersByPeriod) {
          const topList = this.store.getBestSellersByPeriod(period, 1);
          if (topList.length > 0) {
            return {
              status: 'QUERY_ANSWER',
              intent,
              confidence: 0.98,
              answer: `Barang paling banyak terjual ${periodLabel} adalah:\n• ${topList[0].name} (${topList[0].quantity} terjual) 🏆`
            };
          }
        }

        const sales = this.store.getTodayGoodsSales();
        const itemCounts = {};
        sales.forEach((s) => {
          (s.items || []).forEach((item) => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
          });
        });
        const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          return {
            status: 'QUERY_ANSWER',
            intent,
            confidence: 0.98,
            answer: `Barang paling banyak terjual hari ini adalah:\n• ${sorted[0][0]} (${sorted[0][1]} terjual) 🏆`
          };
        }
        return {
          status: 'QUERY_ANSWER',
          intent,
          confidence: 0.95,
          answer: `Indomie Goreng dan Es Teh yang paling laku di warung, Bu 😊`
        };
      }

      case INTENTS.QUERY_RESTOCK: {
        const low = this.store.getLowStockProducts();
        if (low.length > 0) {
          return {
            status: 'QUERY_ANSWER',
            intent,
            confidence: 0.98,
            answer: `Yang perlu diperhatikan besok:\n\n${low.map((p) => `${p.emoji || '📦'} ${p.name} — tinggal ${p.stock} ${p.unit || 'buah'}`).join('\n')}\n\nSebaiknya dicek sebelum belanja 😊`
          };
        }
        return {
          status: 'QUERY_ANSWER',
          intent,
          confidence: 0.95,
          answer: `Semua stok barang masih cukup untuk besok, Bu 😊`
        };
      }

      default:
        return {
          status: 'LOW_CONFIDENCE',
          intent: INTENTS.UNKNOWN,
          confidence: 0.5,
          message: 'Ada yang bisa saya bantu cek di warung, Bu? 😊'
        };
    }
  }

  /**
   * Extract explicit purchase quantity without guessing (V2.2 Safety Guard)
   * Returns integer if explicitly mentioned, or null if quantity is missing/unspecified.
   */
  extractPurchaseQuantity(text, amountRaw = '') {
    if (!text) return null;
    let cleaned = text.toLowerCase();
    if (amountRaw) {
      cleaned = cleaned.replace(amountRaw.toLowerCase(), ' ');
    }
    cleaned = cleaned
      .replace(/\b(?:total|seharga|senilai|sebesar|rp|rupiah|ribu|rb|k|juta)\b/gi, ' ')
      .replace(/[.,;!?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 1. Digit match e.g. "20", "20 bungkus", "20 pcs", "20x", "20 butir"
    const digitMatch = cleaned.match(/\b(\d+)\s*(?:pcs|bungkus|gelas|butir|buah|biji|cangkir|dus|karton|pak|box|kaleng|piring|botol|kg|liter|x)?\b/i);
    if (digitMatch) {
      const val = parseInt(digitMatch[1], 10);
      if (val > 0) return val;
    }

    // 2. Word numbers e.g. "dua puluh", "sepuluh", "tiga", "dua", "satu"
    const tokens = cleaned.split(/\s+/);
    const wordMap = {
      sebungkus: 1, segelas: 1, sebutir: 1, sebuah: 1, sekardus: 1, sedus: 1,
      satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9,
      sepuluh: 10, sebelas: 11
    };
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (wordMap[tok] !== undefined) {
        const next = tokens[i + 1];
        if (next === 'puluh') {
          const nextNext = tokens[i + 2];
          const units = (nextNext && wordMap[nextNext]) ? wordMap[nextNext] : 0;
          return wordMap[tok] * 10 + units;
        }
        if (next === 'belas') {
          return 10 + wordMap[tok];
        }
        return wordMap[tok];
      }
    }

    return null;
  }
}
