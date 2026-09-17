// WARUNG OS - Confirmation & Execution Layer
// Guarantees zero data mutation until user explicitly clicks CATAT/CONFIRM

import { INTENTS } from './intent.js';

/**
 * Execute a confirmed transaction draft via the battle-tested V1 store methods.
 * Never mutates data if draft is null or cancelled.
 */
export function executeConfirmedDraft(draft, store) {
  if (!draft || !store) {
    return { success: false, error: 'Draft tidak valid' };
  }

  try {
    switch (draft.type) {
      case INTENTS.SALE_CASH: {
        const sale = store.recordSale({
          items: draft.items || [],
          total: draft.total,
          cashReceived: draft.cashReceived || draft.total,
          change: 0,
          isDebt: false
        });
        return {
          success: true,
          type: INTENTS.SALE_CASH,
          sale,
          message: `Alhamdulillah, jualan senilai Rp${draft.total.toLocaleString('id-ID')} sudah tercatat lunas 😊`
        };
      }

      case INTENTS.SALE_DEBT: {
        // If debtor is not yet in store, store.recordSale handles automatic creation with debtorName
        const sale = store.recordSale({
          items: draft.items || [],
          total: draft.total,
          isDebt: true,
          debtorId: draft.debtorId || null,
          debtorName: draft.debtorName
        });
        return {
          success: true,
          type: INTENTS.SALE_DEBT,
          sale,
          message: `Utang ${draft.debtorName} senilai Rp${draft.total.toLocaleString('id-ID')} berhasil dicatat 😊`
        };
      }

      case INTENTS.DEBT_PAYMENT: {
        let debtorId = draft.debtorId;
        if (!debtorId && draft.personName) {
          const debts = store.getAllDebts();
          const found = debts.find(
            (d) => d.personName.trim().toLowerCase() === draft.personName.trim().toLowerCase()
          );
          if (found) debtorId = found.id;
        }

        if (!debtorId) {
          return { success: false, error: `Orang bernama ${draft.personName} tidak ditemukan di daftar utang.` };
        }

        const updatedDebtor = store.settleDebt(debtorId, draft.amount);
        return {
          success: true,
          type: INTENTS.DEBT_PAYMENT,
          debtor: updatedDebtor,
          message: `Pembayaran ${draft.personName} Rp${draft.amount.toLocaleString('id-ID')} berhasil dicatat! Sisa utang: Rp${(updatedDebtor.totalDebt || 0).toLocaleString('id-ID')} 😊`
        };
      }

      case INTENTS.EXPENSE: {
        const expense = store.addExpense({
          category: draft.category || 'Operasional Warung',
          description: draft.description || 'Pengeluaran',
          amount: draft.amount
        });
        return {
          success: true,
          type: INTENTS.EXPENSE,
          expense,
          message: `Pengeluaran ${draft.description} Rp${draft.amount.toLocaleString('id-ID')} berhasil dicatat 😊`
        };
      }

      default:
        return { success: false, error: 'Jenis transaksi tidak dikenali.' };
    }
  } catch (err) {
    console.error('Execution error:', err);
    return { success: false, error: err.message || 'Gagal menyimpan transaksi.' };
  }
}

/**
 * Cancel a pending draft cleanly without touching store.
 */
export function cancelPendingDraft(draft) {
  return {
    cancelled: true,
    message: 'Pencatatan dibatalkan. Data warung tidak ada yang berubah ya Bu 😊'
  };
}
