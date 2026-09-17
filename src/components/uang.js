// Uang (Financial summary & expense recording) Component for WARUNG OS
import { store, formatRupiah, parseRupiahInput } from '../data/store.js';
import { showToast } from '../utils/toast.js';

export function renderUang(container) {
  function renderView() {
    const salesTotal = store.getTodaySalesTotal();
    const cashReceived = store.getTodayCashReceived();
    const expensesTotal = store.getTodayExpensesTotal();
    const uangTersisa = store.getTodayUangTersisa();
    const kasAwal = store.getKasAwal();
    const kasAkhir = store.getTodayUangKasAkhir();
    const expenses = store.getTodayExpenses();

    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 1.4rem; font-weight: 900; color: var(--color-text-main);">
          Uang Warung 💰
        </h2>
        <p style="font-size: 0.88rem; color: var(--color-text-muted); font-weight: 600;">
          Ringkasan uang masuk dan keluar hari ini
        </p>
      </div>

      <!-- Financial Metrics Cards -->
      <div class="uang-metric-grid">
        <!-- Sales Card -->
        <div class="uang-card card-sales">
          <div>
            <div class="uang-label">JUALAN</div>
            <div style="font-size: 0.85rem; color: var(--color-text-muted); font-weight: 600;">
              ${cashReceived < salesTotal ? `Tunai diterima: ${formatRupiah(cashReceived)}` : 'Semua jualan lunas tunai'}
            </div>
          </div>
          <div class="uang-val val-green">${formatRupiah(salesTotal)}</div>
        </div>

        <!-- Expense Card -->
        <div class="uang-card card-expense">
          <div>
            <div class="uang-label">PENGELUARAN</div>
            <div style="font-size: 0.85rem; color: var(--color-text-muted); font-weight: 600;">Belanja modal, listrik, gas, dll</div>
          </div>
          <div class="uang-val val-orange">${formatRupiah(expensesTotal)}</div>
        </div>

        <!-- Uang Tersisa / Kas Akhir Card -->
        <div class="uang-card card-profit">
          <div>
            <div class="uang-label" style="color: var(--color-success-dark);">${kasAwal > 0 ? 'UANG KAS AKHIR' : 'UANG TERSISA'}</div>
            <div style="font-size: 0.88rem; color: var(--color-success-dark); font-weight: 700;">
              ${kasAwal > 0 ? `Kas awal ${formatRupiah(kasAwal)} + uang masuk - keluar` : 'Sisa uang tunai di laci kas'}
            </div>
          </div>
          <div class="uang-val ${(kasAwal > 0 ? kasAkhir : uangTersisa) >= 0 ? 'val-green' : 'val-orange'}">
            ${formatRupiah(kasAwal > 0 ? kasAkhir : uangTersisa)}
          </div>
        </div>
      </div>

      <!-- Action Button: Catat Pengeluaran -->
      <button class="btn-huge btn-primary" id="btn-open-catat-pengeluaran" style="margin-bottom: 24px;">
        <span style="font-size: 1.5rem;">💸</span>
        <span>+ CATAT PENGELUARAN</span>
      </button>

      <!-- Expense History List -->
      <div class="card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="font-size: 1.15rem; font-weight: 800;">Catatan Pengeluaran Hari Ini</h3>
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-muted);">${expenses.length} catatan</span>
        </div>

        ${
          expenses.length === 0
            ? `
          <div class="text-center" style="padding: 16px; color: var(--color-text-muted); font-weight: 600;">
            Belum ada catatan pengeluaran hari ini 😊
          </div>
        `
            : `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${expenses
              .map(
                (exp) => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--color-bg-app); border-radius: var(--radius-md);">
                <div>
                  <div style="font-weight: 800; font-size: 1.05rem;">${getCategoryEmoji(exp.category)} ${exp.category}</div>
                  <div style="font-size: 0.85rem; color: var(--color-text-muted); font-weight: 600;">${exp.description || '-'}</div>
                </div>
                <div style="font-size: 1.15rem; font-weight: 900; color: #C24417;">
                  -${formatRupiah(exp.amount)}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        `
        }
      </div>
    `;

    bindEvents();
  }

  function getCategoryEmoji(cat) {
    if (cat.includes('Belanja')) return '🛒';
    if (cat.includes('Listrik')) return '💡';
    if (cat.includes('Air')) return '💧';
    if (cat.includes('Gas')) return '🪣';
    return '📝';
  }

  function bindEvents() {
    document.getElementById('btn-open-catat-pengeluaran')?.addEventListener('click', () => {
      openExpenseModal();
    });
  }

  // Expense Recording Modal
  function openExpenseModal() {
    const modalContainer = document.getElementById('modal-container');
    const categories = [
      { emoji: '🛒', label: 'Belanja barang' },
      { emoji: '💡', label: 'Listrik' },
      { emoji: '💧', label: 'Air' },
      { emoji: '🪣', label: 'Gas' },
      { emoji: '📝', label: 'Lainnya' }
    ];

    let selectedCategory = 'Belanja barang';
    let amount = '';
    let description = '';

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">Catat Pengeluaran 💸</div>
            <button class="modal-close-btn" id="btn-close-expense">✕</button>
          </div>

          <label class="input-money-label">Pengeluaran untuk apa?</label>
          <div class="expense-chips">
            ${categories
              .map(
                (c) => `
              <button type="button" class="chip-btn ${selectedCategory === c.label ? 'selected' : ''}" data-cat="${c.label}">
                <span>${c.emoji}</span>
                <span>${c.label}</span>
              </button>
            `
              )
              .join('')}
          </div>

          <div class="input-money-container">
            <label class="input-money-label" for="input-expense-amount">Berapa jumlah uangnya?</label>
            <input 
              type="text" 
              inputmode="numeric" 
              id="input-expense-amount" 
              class="input-money-box" 
              placeholder="Contoh: Rp50.000" 
              autofocus 
            />
          </div>

          <div class="input-money-container">
            <label class="input-money-label" for="input-expense-desc">Catatan kecil (Boleh dikosongkan):</label>
            <input 
              type="text" 
              id="input-expense-desc" 
              class="input-money-box" 
              placeholder="Contoh: Beli telur di agen" 
              style="font-size: 1.05rem;"
            />
          </div>

          <button class="btn-huge btn-primary" id="btn-save-expense">
            <span>SIMPAN PENGELUARAN</span>
            <span>✅</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-close-expense')?.addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });

    modalContainer.querySelectorAll('.chip-btn').forEach((chip) => {
      chip.addEventListener('click', () => {
        selectedCategory = chip.getAttribute('data-cat');
        modalContainer.querySelectorAll('.chip-btn').forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
      });
    });

    const amountInput = document.getElementById('input-expense-amount');
    amountInput?.addEventListener('input', (e) => {
      amount = parseRupiahInput(e.target.value);
      e.target.value = amount ? formatRupiah(amount) : '';
    });

    document.getElementById('btn-save-expense')?.addEventListener('click', () => {
      if (!amount || amount <= 0) {
        showToast('Jumlah uang pengeluaran diisi dulu ya Bu/Pak 😊', 'error');
        return;
      }

      const desc = document.getElementById('input-expense-desc')?.value.trim();
      store.addExpense({
        category: selectedCategory,
        description: desc || selectedCategory,
        amount
      });

      modalContainer.innerHTML = '';
      renderView();
      showToast('Pengeluaran berhasil dicatat 😊');
    });
  }

  renderView();
}
