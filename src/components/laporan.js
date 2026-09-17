// Laporan Warung (V2.0 Financial Report & Activity Summary)
import { store, formatRupiah } from '../data/store.js';

let currentPeriod = 'today'; // 'today' | 'week' | 'month'

export function renderLaporan(container, navigateToTab) {
  function renderView() {
    // 1. Fetch period data from store
    const salesTotal = store.getSalesTotalByPeriod(currentPeriod);
    const cashReceived = store.getCashReceivedByPeriod(currentPeriod);
    const expensesTotal = store.getExpensesTotalByPeriod(currentPeriod);
    const uangDiLaci = store.getTodayUangKasAkhir
      ? store.getTodayUangKasAkhir()
      : store.getTodayUangTersisa();
    const salesCount = store.getSalesCountByPeriod(currentPeriod);
    const bestSellers = store.getBestSellersByPeriod(currentPeriod, 5);
    const expenses = store.getExpensesByPeriod(currentPeriod);
    const debts = store.getDebts();
    const totalDebt = store.getTotalDebts();

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

      <!-- 3. RINGKASAN FINANSIAL (4 Kartu Mudah Dibaca) -->
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

        <!-- UANG KELUAR -->
        <div class="laporan-metric-card card-keluar">
          <div class="metric-top">
            <span class="metric-icon">💸</span>
            <span class="metric-label">Uang Keluar</span>
          </div>
          <div class="metric-amount val-orange">${formatRupiah(expensesTotal)}</div>
          <div class="metric-desc">Belanja stok & operasional warung</div>
        </div>

        <!-- UANG DI LACI -->
        <div class="laporan-metric-card card-laci">
          <div class="metric-top">
            <span class="metric-icon">💰</span>
            <span class="metric-label">Uang di Laci</span>
          </div>
          <div class="metric-amount val-primary">${formatRupiah(uangDiLaci)}</div>
          <div class="metric-desc">Uang kas yang ada saat ini</div>
        </div>
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

      <!-- 6. PENGELUARAN PADA PERIODE -->
      <div class="laporan-section-card">
        <div class="laporan-section-header">
          <span class="section-icon">📝</span>
          <span class="section-title">Daftar Pengeluaran (${periodLabel})</span>
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
