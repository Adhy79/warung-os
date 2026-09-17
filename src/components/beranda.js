// Beranda (Dashboard) Component for WARUNG OS
import { store, formatRupiah } from '../data/store.js';

export function renderBeranda(container, navigateToTab) {
  const warung = store.getWarung();
  const salesTotal = store.getTodaySalesTotal();
  const salesPaid = store.getTodaySalesPaid();
  const salesDebt = store.getTodaySalesDebt();
  const cashReceived = store.getTodayCashReceived();
  const debtPayments = store.getTodayDebtPaymentsReceived();
  const todayCount = store.getTodaySalesCount();
  const lowStock = store.getLowStockProducts();
  const debts = store.getDebts();
  const totalDebt = store.getTotalDebts();

  // Greeting based on current hour
  const hour = new Date().getHours();
  let greeting = 'Selamat pagi 😊';
  if (hour >= 11 && hour < 15) greeting = 'Selamat siang 😊';
  else if (hour >= 15 && hour < 18) greeting = 'Selamat sore 😊';
  else if (hour >= 18) greeting = 'Selamat malam 😊';

  container.innerHTML = `
    <!-- Hero Sales Today Card with Clear Cash vs Debt Breakdown -->
    <div class="hero-sales-card">
      <div class="hero-label">Jualan Hari Ini</div>
      <div class="hero-amount">${formatRupiah(salesTotal)}</div>
      <div class="hero-subtext">Total barang yang laku (${todayCount} transaksi)</div>

      <!-- Detail Box: Agar Tidak Salah Mengira Uang Kas -->
      <div style="background: #FFFFFF; border: 2px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 14px; margin-top: 14px; text-align: left; display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.92rem; font-weight: 700;">
          <span style="color: var(--color-text-muted);">• Sudah dibayar tunai:</span>
          <span style="color: var(--color-success-dark);">${formatRupiah(salesPaid)}</span>
        </div>
        ${
          salesDebt > 0
            ? `
          <div style="display: flex; justify-content: space-between; font-size: 0.92rem; font-weight: 700;">
            <span style="color: #B91C1C;">• Masih ngutang:</span>
            <span style="color: #DC2626;">${formatRupiah(salesDebt)}</span>
          </div>
        `
            : ''
        }
        ${
          debtPayments > 0
            ? `
          <div style="display: flex; justify-content: space-between; font-size: 0.92rem; font-weight: 700;">
            <span style="color: #047857;">• Bayar utang masuk kas:</span>
            <span style="color: #047857;">+${formatRupiah(debtPayments)}</span>
          </div>
        `
            : ''
        }
        <div style="border-top: 2px dashed var(--color-border); padding-top: 8px; margin-top: 4px; display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 0.95rem; font-weight: 800; color: var(--color-text-main);">💵 Uang Masuk Kas:</span>
          <span style="font-size: 1.25rem; font-weight: 900; color: var(--color-primary-dark);">${formatRupiah(cashReceived)}</span>
        </div>
        <div style="font-size: 0.78rem; color: var(--color-text-muted); text-align: right; font-weight: 600;">
          Uang tunai yang benar-benar diterima hari ini
        </div>
      </div>
    </div>

    <!-- Primary Big Action Button -->
    <button class="btn-huge btn-primary" id="btn-beranda-jualan" style="margin-bottom: 14px;">
      <span style="font-size: 1.8rem;">🛒</span>
      <span>JUALAN SEKARANG</span>
    </button>

    <!-- Secondary Navigation Menu Grid -->
    <div class="menu-grid">
      <div class="menu-card" id="btn-beranda-barang">
        <div class="menu-icon">📦</div>
        <div class="menu-title">BARANG</div>
        <div class="menu-desc">Kelola stok barang</div>
      </div>

      <div class="menu-card" id="btn-beranda-uang">
        <div class="menu-icon">💰</div>
        <div class="menu-title">UANG</div>
        <div class="menu-desc">Pemasukan & keluar</div>
      </div>

      <div class="menu-card" id="btn-beranda-ngutang">
        <div class="menu-icon">👤</div>
        <div class="menu-title">NGUTANG</div>
        <div class="menu-desc">${debts.length > 0 ? debts.length + ' orang' : 'Buku utang'}</div>
      </div>

      <div class="menu-card" id="btn-beranda-tanya">
        <div class="menu-icon">🎙️</div>
        <div class="menu-title">NGOMONG AJA</div>
        <div class="menu-desc">Ceritakan saja seperti ngobrol</div>
      </div>
    </div>

    <!-- Kabar Warung 😊 Card -->
    <div class="kabar-card">
      <div class="kabar-header">
        <div class="kabar-title">
          <span>Kabar Warung</span>
          <span>😊</span>
        </div>
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-muted);">Hari Ini</span>
      </div>

      <div class="kabar-list">
        <div class="kabar-item">
          <span class="kabar-icon">🧾</span>
          <span>Hari ini sudah ada <strong>${todayCount} transaksi</strong> jualan.</span>
        </div>
        
        <div class="kabar-item">
          <span class="kabar-icon">💵</span>
          <span>Total jualan hari ini <strong>${formatRupiah(todayTotal)}</strong>.</span>
        </div>

        ${
          lowStock.length > 0
            ? `
          <div class="kabar-item" style="background: #FFFBEB; border: 1.5px solid #FDE68A;">
            <span class="kabar-icon">⚠️</span>
            <span>
              <strong>${lowStock.map((p) => p.name).slice(0, 2).join(', ')}</strong> 
              ${lowStock.length > 2 ? ` dan ${lowStock.length - 2} barang lain` : ''} tinggal sedikit.
            </span>
          </div>
        `
            : `
          <div class="kabar-item" style="background: #ECFDF5;">
            <span class="kabar-icon">✅</span>
            <span>Semua stok barang masih aman.</span>
          </div>
        `
        }

        ${
          debts.length > 0
            ? `
          <div class="kabar-item" style="background: #FEF2F2; border: 1.5px solid #FECACA;">
            <span class="kabar-icon">📝</span>
            <span>Masih ada <strong>${debts.length} orang</strong> belum bayar (total ${formatRupiah(totalDebt)}).</span>
          </div>
        `
            : `
          <div class="kabar-item">
            <span class="kabar-icon">🎉</span>
            <span>Tidak ada catatan orang yang ngutang.</span>
          </div>
        `
        }
      </div>
    </div>

    <!-- Friendly Motivation Banner -->
    <div class="spirit-banner">
      Semangat jualannya hari ini! 💪😊
    </div>
  `;

  // Attach button events
  document.getElementById('btn-beranda-jualan')?.addEventListener('click', () => navigateToTab('jualan'));
  document.getElementById('btn-beranda-barang')?.addEventListener('click', () => navigateToTab('barang'));
  document.getElementById('btn-beranda-uang')?.addEventListener('click', () => navigateToTab('uang'));
  document.getElementById('btn-beranda-ngutang')?.addEventListener('click', () => navigateToTab('ngutang'));
  document.getElementById('btn-beranda-tanya')?.addEventListener('click', () => navigateToTab('tanya'));
}
