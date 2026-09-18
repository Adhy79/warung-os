// Beranda (Kabar Warung Hari Ini) Component for WARUNG OS
import { store, formatRupiah } from '../data/store.js';
import { showToast } from '../utils/toast.js';

export function renderBeranda(container, navigateToTab) {
  function render() {
    // Retrieve existing store data
    const salesTotal = store.getTodaySalesTotal();
    const cashReceived = store.getTodayCashReceived();
    const expensesTotal = store.getTodayExpensesTotal();
    const uangDiLaci = store.getTodayUangKasAkhir
      ? store.getTodayUangKasAkhir()
      : store.getTodayUangTersisa();
    const todayCount = store.getTodaySalesCount();
    const debts = store.getDebts();
    const todaySales = store.getTodayGoodsSales();

    // V2.3: Perlu Dibeli & Shopping List
    const perluDibeli = store.getPerluDibeli ? store.getPerluDibeli() : [];
    const shoppingList = store.getShoppingList ? store.getShoppingList() : [];

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

    // 2. Prepare Perlu Dilihat items (Stock warning & Unpaid debts)
    const perluDilihatItems = [];

    // Perlu Dibeli items (Habis or Mulai Menipis)
    perluDibeli.forEach((item) => {
      const p = item.product;
      const isHabis = item.status === 'habis';
      perluDilihatItems.push({
        type: 'stock',
        emoji: isHabis ? '🔴' : '🟠',
        title: `${p.name} ${isHabis ? 'Habis' : 'tinggal ' + p.stock + ' ' + (p.unit || '')}`.trim(),
        subtitle: isHabis ? 'Stok habis, segera kulakan.' : 'Mulai menipis, sebaiknya tambah stok.',
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

      <!-- 🛒 V2.3: SECTION PERLU DIBELI -->
      <div class="perlu-dibeli-card" style="background: white; border-radius: var(--radius-lg); border: 2px solid #FED7AA; padding: 16px; margin-bottom: 16px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.3rem;">🛒</span>
            <span style="font-size: 1.1rem; font-weight: 900; color: #9A3412;">PERLU DIBELI</span>
          </div>
          ${
            perluDibeli.length > 0
              ? `<span style="font-size: 0.8rem; font-weight: 800; background: #FFEDD5; color: #C2410C; padding: 2px 8px; border-radius: 99px;">${perluDibeli.length} barang</span>`
              : ''
          }
        </div>

        <div class="perlu-dibeli-list">
          ${
            perluDibeli.length > 0
              ? perluDibeli
                  .map((item) => {
                    const isHabis = item.status === 'habis';
                    const icon = isHabis ? '🔴' : '🟠';
                    const statusText = isHabis ? 'Habis' : `Tinggal ${item.product.stock}`;
                    const textColor = isHabis ? '#DC2626' : '#D97706';

                    return `
                    <div class="perlu-dibeli-item" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: var(--radius-md); background: #FFF7ED; border: 1px solid #FFEDD5; margin-bottom: 8px;">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.15rem;">${icon}</span>
                        <div style="font-weight: 800; font-size: 0.98rem; color: var(--color-text-main);">
                          ${item.product.name} <span style="font-weight: 700; color: ${textColor}; font-size: 0.9rem;">— ${statusText}</span>
                        </div>
                      </div>
                      <button type="button" class="btn-small btn-secondary btn-add-to-checklist" data-name="${item.product.name}" title="Tambah ke Daftar Yang Mau Dibeli" style="font-size: 0.82rem; padding: 6px 10px; font-weight: 800; background: white; border: 1.5px solid #FDBA74; color: #C2410C; cursor: pointer;">
                        + Mau Beli
                      </button>
                    </div>
                  `;
                  })
                  .join('')
              : `
                <div style="text-align: center; padding: 14px 8px; color: var(--color-text-muted); font-size: 0.92rem; font-weight: 600;">
                  Belum ada barang yang perlu dibeli.
                </div>
              `
          }
        </div>
      </div>

      <!-- 📝 V2.3: SECTION DAFTAR YANG MAU DIBELI (CHECKLIST) -->
      <div class="daftar-beli-card" style="background: white; border-radius: var(--radius-lg); border: 2px solid #E2E8F0; padding: 16px; margin-bottom: 16px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.3rem;">📝</span>
            <span style="font-size: 1.1rem; font-weight: 900; color: var(--color-text-main);">YANG MAU DIBELI</span>
          </div>
          <span style="font-size: 0.8rem; color: var(--color-text-muted); font-weight: 700;">Catatan Belanja</span>
        </div>

        <!-- Add form -->
        <form id="form-add-checklist" style="display: flex; gap: 8px; margin-bottom: 14px;">
          <input 
            type="text" 
            id="input-checklist-name" 
            class="input-money-box" 
            placeholder="Tulis barang yang mau dibeli..." 
            style="flex: 1; padding: 10px 12px; font-size: 0.95rem; border-radius: var(--radius-md);" 
          />
          <button type="submit" class="btn-small btn-primary" style="padding: 10px 14px; font-size: 0.95rem; font-weight: 800; white-space: nowrap;">
            + Tambah
          </button>
        </form>

        <div id="checklist-container">
          ${
            shoppingList.length > 0
              ? shoppingList
                  .map(
                    (item) => `
                <div class="checklist-item" data-id="${item.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: var(--radius-md); background: ${item.isBought ? '#F8FAFC' : '#F1F5F9'}; border: 1px solid ${item.isBought ? '#E2E8F0' : '#CBD5E1'}; margin-bottom: 8px;">
                  <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex: 1; margin-bottom: 0;">
                    <input type="checkbox" class="checklist-toggle" data-id="${item.id}" ${item.isBought ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #2563EB; cursor: pointer;" />
                    <span style="font-size: 0.95rem; font-weight: 700; ${item.isBought ? 'text-decoration: line-through; color: var(--color-text-muted);' : 'color: var(--color-text-main);'}">
                      ${item.name}
                    </span>
                    ${item.isBought ? `<span style="font-size: 0.75rem; background: #DCFCE7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 800;">Sudah dibeli</span>` : ''}
                  </label>
                  <button type="button" class="btn-delete-checklist" data-id="${item.id}" title="Hapus catatan" style="background: none; border: none; font-size: 1.1rem; color: #94A3B8; cursor: pointer; padding: 4px 8px;">
                    ✕
                  </button>
                </div>
              `
                  )
                  .join('')
              : `
                <div style="text-align: center; padding: 12px 8px; color: var(--color-text-muted); font-size: 0.88rem;">
                  Belum ada catatan barang yang mau dibeli.<br/>
                  Ketik nama barang di atas atau pilih dari daftar saran di atas.
                </div>
              `
          }
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

    bindEvents();
  }

  function bindEvents() {
    const todayCount = store.getTodaySalesCount();

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

    // V2.3: Add to checklist from "PERLU DIBELI" items
    container.querySelectorAll('.btn-add-to-checklist').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = btn.getAttribute('data-name');
        if (name) {
          store.addShoppingItem(name);
          render();
          showToast(`"${name}" masuk catatan Yang Mau Dibeli! 😊`);
        }
      });
    });

    // V2.3: Add custom item form
    const formChecklist = document.getElementById('form-add-checklist');
    formChecklist?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('input-checklist-name');
      const val = (input?.value || '').trim();
      if (!val) {
        showToast('Ketik nama barang yang mau dibeli dulu ya 😊', 'info');
        return;
      }
      store.addShoppingItem(val);
      render();
      showToast(`"${val}" masuk catatan Yang Mau Dibeli! 😊`);
    });

    // V2.3: Toggle "Sudah dibeli"
    container.querySelectorAll('.checklist-toggle').forEach((chk) => {
      chk.addEventListener('change', (e) => {
        const id = chk.getAttribute('data-id');
        if (id) {
          store.toggleShoppingItem(id);
          render();
        }
      });
    });

    // V2.3: Delete checklist item
    container.querySelectorAll('.btn-delete-checklist').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          store.deleteShoppingItem(id);
          render();
          showToast('Catatan berhasil dihapus 😊');
        }
      });
    });
  }

  render();
}
