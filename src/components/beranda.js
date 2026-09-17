// Beranda (Kabar Warung Hari Ini) Component for WARUNG OS
import { store, formatRupiah } from '../data/store.js';

export function renderBeranda(container, navigateToTab) {
  // Retrieve existing store data
  const salesTotal = store.getTodaySalesTotal();
  const cashReceived = store.getTodayCashReceived();
  const expensesTotal = store.getTodayExpensesTotal();
  const uangDiLaci = store.getTodayUangKasAkhir
    ? store.getTodayUangKasAkhir()
    : store.getTodayUangTersisa();
  const todayCount = store.getTodaySalesCount();
  const lowStock = store.getLowStockProducts();
  const debts = store.getDebts();
  const todaySales = store.getTodayGoodsSales();

  // 1. Calculate Paling Laris Hari Ini from existing goods sales
  const itemCounts = {};
  todaySales.forEach((s) => {
    (s.items || []).forEach((item) => {
      const key = item.name;
      itemCounts[key] = (itemCounts[key] || 0) + (item.quantity || 0);
    });
  });

  const products = store.getProducts();
  const productMap = new Map((products || []).map((p) => [p.name.toLowerCase().trim(), p]));

  const bestSellers = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 2. Prepare Perlu Dilihat items (Low stock & Unpaid debts)
  const perluDilihatItems = [];

  // Low stock items
  lowStock.forEach((p) => {
    perluDilihatItems.push({
      type: 'stock',
      emoji: p.emoji || '📦',
      title: `${p.name} tinggal ${p.stock} ${p.unit || ''}`.trim(),
      subtitle: 'Sebaiknya tambah stok.',
      tab: 'barang'
    });
  });

  // Debt items
  debts.forEach((d) => {
    perluDilihatItems.push({
      type: 'debt',
      emoji: '💳',
      title: `${d.personName} masih punya utang`,
      subtitle: formatRupiah(d.totalDebt),
      tab: 'ngutang'
    });
  });

  container.innerHTML = `
    <!-- 2. KARTU UTAMA — UANG DI LACI -->
    <div class="hero-laci-card">
      <div class="hero-laci-label">
        <span>💰</span>
        <span>UANG DI LACI</span>
      </div>
      <div class="hero-laci-amount">${formatRupiah(uangDiLaci)}</div>
      <div class="hero-laci-subtext">Uang yang ada sekarang</div>
    </div>

    ${
      todayCount === 0
        ? `
      <!-- 7. EMPTY STATE (WARUNG BARU MULAI) -->
      <div class="empty-warung-card">
        <div class="empty-warung-badge">🌅 WARUNG BARU MULAI</div>
        <p class="empty-warung-desc">
          Belum ada jualan hari ini.<br/>
          Yuk mulai catat jualan pertama.
        </p>
        <div class="empty-warung-actions">
          <button class="btn-huge btn-primary" id="btn-empty-jualan">
            <span style="font-size: 1.6rem;">🛒</span>
            <span>MULAI JUALAN</span>
          </button>
          <button class="btn-huge btn-secondary" id="btn-empty-ngomong">
            <span style="font-size: 1.6rem;">🎙️</span>
            <span>NGOMONG AJA</span>
          </button>
        </div>
      </div>
    `
        : `
      <!-- Tombol Aksi Cepat Jualan Sekarang -->
      <button class="btn-huge btn-primary" id="btn-beranda-jualan" style="margin-bottom: 14px;">
        <span style="font-size: 1.6rem;">🛒</span>
        <span>JUALAN SEKARANG</span>
      </button>

      <!-- 6. SHORTCUT NGOMONG AJA -->
      <div class="ngomong-shortcut-card" id="btn-shortcut-ngomong">
        <div class="ngomong-shortcut-left">
          <span class="ngomong-shortcut-icon">🎙️</span>
          <div>
            <div class="ngomong-shortcut-title">NGOMONG AJA</div>
            <div class="ngomong-shortcut-sub">Mau catat sesuatu?</div>
          </div>
        </div>
        <button class="btn-bicara-action" id="btn-bicara-action" type="button">
          <span>🎙️</span>
          <span>BICARA</span>
        </button>
      </div>
    `
    }

    <!-- 3. RINGKASAN HARI INI -->
    <div class="ringkasan-card">
      <div class="ringkasan-header">
        <span>📊</span>
        <span>RINGKASAN HARI INI</span>
      </div>
      <div class="ringkasan-list">
        <div class="ringkasan-item">
          <div class="ringkasan-item-label">
            <span>🛒</span>
            <span>JUALAN HARI INI</span>
          </div>
          <div class="ringkasan-item-val val-sales">${formatRupiah(salesTotal)}</div>
        </div>
        <div class="ringkasan-item">
          <div class="ringkasan-item-label">
            <span>💵</span>
            <span>UANG MASUK</span>
          </div>
          <div class="ringkasan-item-val val-masuk">${formatRupiah(cashReceived)}</div>
        </div>
        <div class="ringkasan-item">
          <div class="ringkasan-item-label">
            <span>💸</span>
            <span>UANG KELUAR</span>
          </div>
          <div class="ringkasan-item-val val-keluar">${formatRupiah(expensesTotal)}</div>
        </div>
      </div>
    </div>

    <!-- 4. BAGIAN PERLU DILIHAT -->
    <div class="perlu-card">
      <div class="perlu-header">
        <span>🔔</span>
        <span>PERLU DILIHAT</span>
      </div>
      <div class="perlu-list">
        ${
          perluDilihatItems.length > 0
            ? perluDilihatItems
                .map(
                  (item, idx) => `
              <div class="perlu-item ${item.type}-item" data-tab="${item.tab}">
                <div class="perlu-item-info">
                  <span class="perlu-item-emoji">${item.emoji}</span>
                  <div>
                    <div class="perlu-item-title">${item.title}</div>
                    <div class="perlu-item-sub">${item.subtitle}</div>
                  </div>
                </div>
                <span style="font-size: 1.1rem; color: var(--color-text-muted); font-weight: 800;">›</span>
              </div>
            `
                )
                .join('')
            : `
              <div class="perlu-empty">
                <span>✅</span>
                <span>Tidak ada yang perlu diperhatikan hari ini.</span>
              </div>
            `
        }
      </div>
    </div>

    <!-- 5. PALING LARIS HARI INI -->
    <div class="laris-card">
      <div class="laris-header">
        <span>🏆</span>
        <span>PALING LARIS HARI INI</span>
      </div>
      <div class="laris-list">
        ${
          bestSellers.length > 0
            ? bestSellers
                .map(([name, qty]) => {
                  const p = productMap.get(name.toLowerCase().trim());
                  const emoji = p?.emoji || '🛍️';
                  return `
              <div class="laris-item">
                <div class="laris-name">
                  <span class="laris-emoji">${emoji}</span>
                  <span>${name}</span>
                </div>
                <div class="laris-qty">${qty}</div>
              </div>
            `;
                })
                .join('')
            : `
              <div class="laris-empty">
                Belum ada barang yang terjual hari ini.
              </div>
            `
        }
      </div>
    </div>

    <!-- Menu Navigasi Tambahan (Barang, Uang, Ngutang) -->
    <div class="menu-grid">
      <div class="menu-card" id="btn-beranda-barang">
        <div class="menu-icon">📦</div>
        <div class="menu-title">BARANG</div>
        <div class="menu-desc">Kelola stok</div>
      </div>

      <div class="menu-card" id="btn-beranda-uang">
        <div class="menu-icon">💰</div>
        <div class="menu-title">UANG</div>
        <div class="menu-desc">Pemasukan & kas</div>
      </div>

      <div class="menu-card" id="btn-beranda-ngutang">
        <div class="menu-icon">👤</div>
        <div class="menu-title">NGUTANG</div>
        <div class="menu-desc">${debts.length > 0 ? debts.length + ' orang' : 'Buku utang'}</div>
      </div>
    </div>

    <!-- Friendly Motivation Banner -->
    <div class="spirit-banner">
      Semangat jualannya hari ini! 💪😊
    </div>
  `;

  // Attach button event listeners
  if (todayCount === 0) {
    document.getElementById('btn-empty-jualan')?.addEventListener('click', () => navigateToTab('jualan'));
    document.getElementById('btn-empty-ngomong')?.addEventListener('click', () => navigateToTab('tanya'));
  } else {
    document.getElementById('btn-beranda-jualan')?.addEventListener('click', () => navigateToTab('jualan'));
    document.getElementById('btn-shortcut-ngomong')?.addEventListener('click', () => navigateToTab('tanya'));
    document.getElementById('btn-bicara-action')?.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateToTab('tanya');
    });
  }

  // Quick secondary navigation buttons
  document.getElementById('btn-beranda-barang')?.addEventListener('click', () => navigateToTab('barang'));
  document.getElementById('btn-beranda-uang')?.addEventListener('click', () => navigateToTab('uang'));
  document.getElementById('btn-beranda-ngutang')?.addEventListener('click', () => navigateToTab('ngutang'));

  // Items inside "PERLU DILIHAT" navigate to corresponding tabs
  const perluItems = container.querySelectorAll('.perlu-item');
  perluItems.forEach((el) => {
    el.addEventListener('click', () => {
      const targetTab = el.getAttribute('data-tab');
      if (targetTab) navigateToTab(targetTab);
    });
  });
}
