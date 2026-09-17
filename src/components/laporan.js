// Laporan Warung (V2.0 Financial Report & Activity Summary)
import { store, formatRupiah } from '../data/store.js';

let currentPeriod = 'today'; // 'today' | 'week' | 'month'

export function renderLaporan(container, navigateToTab) {
  function renderView() {
    // 1. Fetch period data from store
    const salesTotal = store.getSalesTotalByPeriod(currentPeriod);
    const cashReceived = store.getCashReceivedByPeriod(currentPeriod);
    const expensesTotal = store.getExpensesTotalByPeriod(currentPeriod);
    const purchasesTotal = store.getPurchasesTotalByPeriod ? store.getPurchasesTotalByPeriod(currentPeriod) : 0;
    const purchasesCount = store.getPurchasesCountByPeriod ? store.getPurchasesCountByPeriod(currentPeriod) : 0;
    const purchases = store.getPurchasesByPeriod ? store.getPurchasesByPeriod(currentPeriod) : [];

    const purchasesTodayTotal = store.getPurchasesTotalByPeriod ? store.getPurchasesTotalByPeriod('today') : 0;
    const purchasesWeekTotal = store.getPurchasesTotalByPeriod ? store.getPurchasesTotalByPeriod('week') : 0;
    const purchasesMonthTotal = store.getPurchasesTotalByPeriod ? store.getPurchasesTotalByPeriod('month') : 0;

    const uangDiLaci = store.getTodayUangKasAkhir
      ? store.getTodayUangKasAkhir()
      : store.getTodayUangTersisa();
    const salesCount = store.getSalesCountByPeriod(currentPeriod);
    const bestSellers = store.getBestSellersByPeriod(currentPeriod, 5);
    const expenses = store.getExpensesByPeriod(currentPeriod);
    const debts = store.getDebts();
    const totalDebt = store.getTotalDebts();
    const marginReport = store.getMarginReportByPeriod ? store.getMarginReportByPeriod(currentPeriod) : { totalMargin: 0, itemsWithCostCount: 0, itemsWithoutCostCount: 0 };

    // Period labels for display
    let periodLabel = 'Hari Ini';
    if (currentPeriod === 'week') periodLabel = '7 Hari Terakhir';
    if (currentPeriod === 'month') periodLabel = 'Bulan Ini';

    container.innerHTML = `
      <div class="laporan-header-box">
        <div class="laporan-title-row">
          <h2 class="laporan-page-title">
            <span>📊</span>
            <span>Laporan Warung</span>
          </h2>
          <span class="laporan-period-badge">${periodLabel}</span>
        </div>
        <p class="laporan-subtitle">
          Ringkasan jualan, kas masuk, dan pengeluaran warung
        </p>

        <!-- 2. PILIHAN PERIODE (3 Tombol Besar) -->
        <div class="laporan-period-tabs">
          <button class="period-tab-btn ${currentPeriod === 'today' ? 'active' : ''}" data-period="today">
            HARI INI
          </button>
          <button class="period-tab-btn ${currentPeriod === 'week' ? 'active' : ''}" data-period="week">
            7 HARI
          </button>
          <button class="period-tab-btn ${currentPeriod === 'month' ? 'active' : ''}" data-period="month">
            BULAN INI
          </button>
        </div>
      </div>

      <!-- 3. RINGKASAN FINANSIAL (Pemisahan Jelas V2.2) -->
      <div class="laporan-summary-grid">
        <!-- JUALAN -->
        <div class="laporan-metric-card card-jualan">
          <div class="metric-top">
            <span class="metric-icon">🛒</span>
            <span class="metric-label">Jualan</span>
          </div>
          <div class="metric-amount">${formatRupiah(salesTotal)}</div>
          <div class="metric-desc">Semua barang laku (${salesCount} transaksi)</div>
        </div>

        <!-- UANG MASUK -->
        <div class="laporan-metric-card card-masuk">
          <div class="metric-top">
            <span class="metric-icon">💵</span>
            <span class="metric-label">Uang Masuk</span>
          </div>
          <div class="metric-amount val-green">${formatRupiah(cashReceived)}</div>
          <div class="metric-desc">Uang tunai fisik diterima di kas</div>
        </div>

        <!-- BELANJA BARANG -->
        <div class="laporan-metric-card card-belanja">
          <div class="metric-top">
            <span class="metric-icon">📦</span>
            <span class="metric-label">Belanja Barang</span>
          </div>
          <div class="metric-amount val-blue">${formatRupiah(purchasesTotal)}</div>
          <div class="metric-desc">Kulakan stok warung (${purchasesCount} pembelian)</div>
        </div>

        <!-- PENGELUARAN LAIN -->
        <div class="laporan-metric-card card-keluar">
          <div class="metric-top">
            <span class="metric-icon">💸</span>
            <span class="metric-label">Pengeluaran Lain</span>
          </div>
          <div class="metric-amount val-orange">${formatRupiah(expensesTotal)}</div>
          <div class="metric-desc">Listrik, bensin, dan operasional</div>
        </div>

        <!-- UANG DI LACI -->
        <div class="laporan-metric-card card-laci">
          <div class="metric-top">
            <span class="metric-icon">💰</span>
            <span class="metric-label">Uang di Laci</span>
          </div>
          <div class="metric-amount val-primary">${formatRupiah(uangDiLaci)}</div>
          <div class="metric-desc">Kas awal + uang masuk - belanja barang - pengeluaran lain</div>
        </div>
      </div>

      <!-- PERKIRAAN SELISIH (V2.1 - HARGA JUAL - HARGA MODAL SNAPSHOT) -->
      <div class="laporan-section-card" style="border-left: 5px solid #059669; margin-bottom: 16px;">
        <div class="laporan-section-header" style="margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="section-icon">📈</span>
            <span class="section-title">Perkiraan Selisih (${periodLabel})</span>
          </div>
          <span style="font-size: 1.35rem; font-weight: 900; color: #047857;">${formatRupiah(marginReport.totalMargin)}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--color-text-muted); font-weight: 600; margin: 0; line-height: 1.4;">
          ${
            marginReport.itemsWithoutCostCount > 0
              ? `⚠️ Dihitung dari barang yang ada harga modalnya (${marginReport.itemsWithCostCount} barang). Ada ${marginReport.itemsWithoutCostCount} barang laku belum diisi modal.`
              : (salesCount > 0
                  ? `✅ Dihitung dari seluruh barang laku (${marginReport.itemsWithCostCount} barang: Harga Jual aktual - Harga Modal saat transaksi).`
                  : `Belum ada barang laku pada periode ini.`)
          }
        </p>
      </div>

      <!-- 7. EMPTY STATE (Jika tidak ada transaksi pada periode) -->
      ${
        salesCount === 0
          ? `
        <div class="laporan-empty-box">
          <span style="font-size: 2.2rem; display: block; margin-bottom: 6px;">🌅</span>
          <div class="empty-title">Belum ada catatan jualan di periode ini.</div>
          <div class="empty-sub">Jualan yang tercatat pada periode ini akan otomatis muncul di sini.</div>
        </div>
      `
          : ''
      }

      <!-- 4. BARANG PALING LAKU -->
      <div class="laporan-section-card">
        <div class="laporan-section-header">
          <span class="section-icon">🏆</span>
          <span class="section-title">Barang Paling Laku</span>
        </div>
        <div class="laporan-list">
          ${
            bestSellers.length > 0
              ? bestSellers
                  .map(
                    (item, index) => `
                <div class="laporan-list-item">
                  <div class="item-left">
                    <span class="item-rank">#${index + 1}</span>
                    <span class="item-emoji">${item.emoji}</span>
                    <span class="item-name">${item.name}</span>
                  </div>
                  <div class="item-badge-qty">${item.quantity} terjual</div>
                </div>
              `
                  )
                  .join('')
              : `
                <div class="laporan-list-empty">
                  Belum ada barang yang terjual pada periode ini.
                </div>
              `
          }
        </div>
      </div>

      <!-- 5. UTANG PELANGGAN -->
      <div class="laporan-section-card">
        <div class="laporan-section-header">
          <span class="section-icon">💳</span>
          <span class="section-title">Utang Pelanggan</span>
          <span class="section-badge-right">${formatRupiah(totalDebt)}</span>
        </div>
        <div class="laporan-list">
          ${
            debts.length > 0
              ? debts
                  .map(
                    (d) => `
                <div class="laporan-list-item debt-row">
                  <div class="item-left">
                    <span class="item-emoji">👤</span>
                    <div>
                      <div class="item-name">${d.personName}</div>
                      <div class="item-subtext">Belum lunas</div>
                    </div>
                  </div>
                  <div class="debt-amount">${formatRupiah(d.totalDebt)}</div>
                </div>
              `
                  )
                  .join('')
              : `
                <div class="laporan-list-empty success-empty">
                  Alhamdulillah tidak ada catatan utang pelanggan saat ini.
                </div>
              `
          }
        </div>
      </div>

      <!-- BELANJA BARANG (V2.2) -->
      <div class="laporan-section-card" style="border-left: 5px solid #2563EB;">
        <div class="laporan-section-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="section-icon">📦</span>
            <span class="section-title">Belanja Barang (${periodLabel})</span>
          </div>
          <span class="section-badge-right" style="color: #1D4ED8; font-weight: 900; font-size: 1.15rem;">${formatRupiah(purchasesTotal)}</span>
        </div>

        <!-- Ringkasan Belanja: Hari Ini, Minggu Ini, Bulan Ini & Transaksi -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin: 10px 0 14px 0;">
          <div style="background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 0.75rem; color: #166534; font-weight: 700;">HARI INI</div>
            <div style="font-size: 0.95rem; font-weight: 900; color: #15803D;">${formatRupiah(purchasesTodayTotal)}</div>
          </div>
          <div style="background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 0.75rem; color: #1E40AF; font-weight: 700;">MINGGU INI (7 HARI)</div>
            <div style="font-size: 0.95rem; font-weight: 900; color: #1D4ED8;">${formatRupiah(purchasesWeekTotal)}</div>
          </div>
          <div style="background: #FAF5FF; border: 1.5px solid #E9D5FF; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 0.75rem; color: #6B21A8; font-weight: 700;">BULAN INI</div>
            <div style="font-size: 0.95rem; font-weight: 900; color: #7E22CE;">${formatRupiah(purchasesMonthTotal)}</div>
          </div>
          <div style="background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 0.75rem; color: #92400E; font-weight: 700;">TRANSAKSI BELANJA</div>
            <div style="font-size: 0.95rem; font-weight: 900; color: #B45309;">${purchasesCount} kali</div>
          </div>
        </div>

        <div class="laporan-list">
          ${
            purchases.length > 0
              ? purchases
                  .map((p) => {
                    const dateFormatted = new Date(p.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short'
                    });
                    return `
                <div class="laporan-list-item">
                  <div class="item-left">
                    <span class="item-emoji">📦</span>
                    <div>
                      <div class="item-name">${p.productName}</div>
                      <div class="item-subtext">${dateFormatted} • ${p.quantity} pcs @ ${formatRupiah(p.unitCost)}</div>
                    </div>
                  </div>
                  <div style="font-weight: 800; color: #1D4ED8; font-size: 1.05rem;">-${formatRupiah(p.totalCost)}</div>
                </div>
              `;
                  })
                  .join('')
              : `
                <div class="laporan-list-empty">
                  Belum ada belanja barang pada periode ini.
                </div>
              `
          }
        </div>
      </div>

      <!-- 6. PENGELUARAN LAIN PADA PERIODE -->
      <div class="laporan-section-card">
        <div class="laporan-section-header">
          <span class="section-icon">📝</span>
          <span class="section-title">Daftar Pengeluaran Lain (${periodLabel})</span>
          <span class="section-badge-right val-orange">${formatRupiah(expensesTotal)}</span>
        </div>
        <div class="laporan-list">
          ${
            expenses.length > 0
              ? expenses
                  .map((e) => {
                    const dateFormatted = new Date(e.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short'
                    });
                    return `
                <div class="laporan-list-item">
                  <div class="item-left">
                    <span class="item-emoji">💸</span>
                    <div>
                      <div class="item-name">${e.description || e.category || 'Belanja Warung'}</div>
                      <div class="item-subtext">${dateFormatted} • ${e.category || 'Operasional'}</div>
                    </div>
                  </div>
                  <div class="expense-amount">-${formatRupiah(e.amount)}</div>
                </div>
              `;
                  })
                  .join('')
              : `
                <div class="laporan-list-empty">
                  Belum ada pengeluaran tercatat pada periode ini.
                </div>
              `
          }
        </div>
      </div>
    `;

    // Attach period button event listeners
    const periodButtons = container.querySelectorAll('.period-tab-btn');
    periodButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const period = btn.getAttribute('data-period');
        if (period && period !== currentPeriod) {
          currentPeriod = period;
          renderView();
        }
      });
    });
  }

  // Initial render
  renderView();
}
