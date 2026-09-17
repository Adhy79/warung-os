// Ngutang (Debt Ledger) Component for WARUNG OS
import { store, formatRupiah, parseRupiahInput } from '../data/store.js';
import { showToast } from '../utils/toast.js';

export function renderNgutang(container) {
  function renderView() {
    const debts = store.getDebts();
    const totalDebt = store.getTotalDebts();

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 900; color: var(--color-text-main);">
            Buku Ngutang 👤
          </h2>
          <p style="font-size: 0.88rem; color: var(--color-text-muted); font-weight: 600;">
            Orang yang masih punya utang di warung
          </p>
        </div>
        <button class="btn-small btn-primary" id="btn-add-debtor-open" style="font-size: 0.95rem; font-weight: 800;">
          <span>+ TAMBAH ORANG</span>
        </button>
      </div>

      <!-- Total Debt Banner -->
      <div class="debt-total-banner">
        <div>
          <div class="debt-total-label">TOTAL SEMUA UTANG</div>
          <div style="font-size: 0.85rem; color: #7F1D1D; font-weight: 600;">Belum dilunasi</div>
        </div>
        <div class="debt-total-amount">${formatRupiah(totalDebt)}</div>
      </div>

      <!-- Debtor List -->
      ${
        debts.length === 0
          ? `
        <div class="card text-center" style="padding: 36px 16px;">
          <div style="font-size: 3rem; margin-bottom: 10px;">🎉</div>
          <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Alhamdulillah, Tidak Ada Utang!</h3>
          <p style="color: var(--color-text-muted); margin-bottom: 20px;">Semua orang sudah lunas belanjanya 😊</p>
          <button class="btn-huge btn-primary" id="btn-empty-add-debtor">
            <span>+ Catat Orang Baru</span>
          </button>
        </div>
      `
          : `
        <div class="debtor-list">
          ${debts
            .map(
              (d) => `
            <div class="debtor-card" data-id="${d.id}">
              <div>
                <div class="debtor-name">
                  <span>👤</span>
                  <span>${d.personName}</span>
                </div>
                <div style="font-size: 0.82rem; color: var(--color-text-muted); margin-top: 2px;">
                  Ketuk untuk lihat rincian & bayar
                </div>
              </div>
              <div class="debtor-amount">
                ${formatRupiah(d.totalDebt)}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `
      }
    `;

    bindEvents();
  }

  function bindEvents() {
    document.getElementById('btn-add-debtor-open')?.addEventListener('click', () => {
      openAddPersonModal();
    });

    document.getElementById('btn-empty-add-debtor')?.addEventListener('click', () => {
      openAddPersonModal();
    });

    container.querySelectorAll('.debtor-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        openDebtorDetailModal(id);
      });
    });
  }

  // Detail Modal for a specific Debtor
  function openDebtorDetailModal(debtorId) {
    const modalContainer = document.getElementById('modal-container');
    const allDebts = store.getAllDebts();
    const debtor = allDebts.find((d) => d.id === debtorId);
    if (!debtor) return;

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">Rincian Utang 👤</div>
            <button class="modal-close-btn" id="btn-close-debt-detail">✕</button>
          </div>

          <!-- Debtor Header Card -->
          <div style="background: #FEF2F2; border: 2px solid #FECACA; border-radius: var(--radius-lg); padding: 18px; text-align: center; margin-bottom: 16px;">
            <div style="font-size: 1.5rem; font-weight: 900; color: var(--color-text-main); margin-bottom: 4px;">
              ${debtor.personName}
            </div>
            <div style="font-size: 0.95rem; font-weight: 700; color: #991B1B;">Masih punya utang:</div>
            <div style="font-size: 2.2rem; font-weight: 900; color: #DC2626; margin-top: 4px;">
              ${formatRupiah(debtor.totalDebt)}
            </div>
          </div>

          <!-- Action Buttons: Tambah Utang & Sudah Bayar -->
          <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <button class="btn-huge btn-warning" id="btn-add-more-debt" style="flex: 1; min-height: 56px; font-size: 1.05rem;">
              <span>+ TAMBAH UTANG</span>
            </button>
            <button class="btn-huge btn-success" id="btn-mark-debt-paid" style="flex: 1; min-height: 56px; font-size: 1.05rem;">
              <span>SUDAH BAYAR ✅</span>
            </button>
          </div>

          <!-- History Section -->
          <h4 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 10px;">Catatan Belanja & Bayar</h4>
          <div style="display: flex; flex-direction: column; gap: 8px; max-height: 220px; overflow-y: auto;">
            ${
              !debtor.history || debtor.history.length === 0
                ? `<div style="color: var(--color-text-muted); font-size: 0.9rem;">Belum ada rincian transaksi</div>`
                : debtor.history
                    .map(
                      (h) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: var(--color-bg-app); border-radius: var(--radius-md);">
                  <div>
                    <div style="font-weight: 700; font-size: 0.95rem;">${h.type === 'payment' ? '✅ Bayar Utang' : '📝 ' + (h.description || 'Belanja ngutang')}</div>
                    <div style="font-size: 0.78rem; color: var(--color-text-muted);">
                      ${new Date(h.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style="font-weight: 900; font-size: 1.05rem; color: ${h.type === 'payment' ? 'var(--color-success-dark)' : '#DC2626'};">
                    ${h.type === 'payment' ? '-' : '+'}${formatRupiah(h.amount)}
                  </div>
                </div>
              `
                    )
                    .join('')
            }
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-close-debt-detail')?.addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });

    // Tambah utang baru ke orang ini
    document.getElementById('btn-add-more-debt')?.addEventListener('click', () => {
      openAddMoreDebtModal(debtor);
    });

    // Sudah Bayar Confirmation Dialog
    document.getElementById('btn-mark-debt-paid')?.addEventListener('click', () => {
      openConfirmSettleModal(debtor);
    });
  }

  // Confirmation dialog: Full payoff or Partial payment
  function openConfirmSettleModal(debtor) {
    const modalContainer = document.getElementById('modal-container');
    let isPartial = false;
    let partialAmount = '';

    function renderSettleSheet() {
      modalContainer.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-sheet">
            <div class="modal-header">
              <div class="modal-title">Catat Pembayaran Utang 💰</div>
              <button class="modal-close-btn" id="btn-close-settle">✕</button>
            </div>

            <div style="background: #ECFDF5; border: 2px solid #A7F3D0; border-radius: var(--radius-lg); padding: 16px; text-align: center; margin-bottom: 16px;">
              <div style="font-size: 1.3rem; font-weight: 900; color: var(--color-text-main);">
                ${debtor.personName}
              </div>
              <div style="font-size: 0.95rem; color: #065F46; font-weight: 700; margin-top: 4px;">
                Total utang saat ini: <strong style="font-size: 1.15rem;">${formatRupiah(debtor.totalDebt)}</strong>
              </div>
            </div>

            ${
              !isPartial
                ? `
              <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                <button class="btn-huge btn-success" id="btn-pay-full">
                  <span>LUNAS SEMUA (${formatRupiah(debtor.totalDebt)})</span>
                  <span>✅</span>
                </button>

                <button class="btn-huge btn-secondary" id="btn-switch-partial" style="border-color: var(--color-primary); color: var(--color-primary-dark); font-size: 1.1rem; min-height: 56px;">
                  <span>🪙 Bayar Sebagian (Nyicil Dulu)</span>
                </button>
              </div>
            `
                : `
              <div class="input-money-container">
                <label class="input-money-label" for="input-partial-pay">Berapa uang yang dibayarkan?</label>
                <input 
                  type="text" 
                  inputmode="numeric" 
                  id="input-partial-pay" 
                  class="input-money-box" 
                  placeholder="Contoh: Rp10.000" 
                  autofocus 
                />
              </div>

              <div style="display: flex; gap: 10px; margin-bottom: 14px;">
                <button class="btn-huge btn-secondary" id="btn-cancel-partial" style="flex: 1; min-height: 54px; font-size: 1rem;">
                  <span>Kembali</span>
                </button>
                <button class="btn-huge btn-success" id="btn-save-partial" style="flex: 2; min-height: 54px;">
                  <span>SIMPAN CICILAN</span>
                  <span>✅</span>
                </button>
              </div>
            `
            }

            <button type="button" class="btn-small btn-secondary" id="btn-dismiss-settle" style="width: 100%; border-color: var(--color-border); font-size: 0.95rem; font-weight: 700;">
              <span>Tutup / Batal</span>
            </button>
          </div>
        </div>
      `;

      document.getElementById('btn-close-settle')?.addEventListener('click', () => {
        openDebtorDetailModal(debtor.id);
      });

      document.getElementById('btn-dismiss-settle')?.addEventListener('click', () => {
        openDebtorDetailModal(debtor.id);
      });

      if (!isPartial) {
        document.getElementById('btn-pay-full')?.addEventListener('click', () => {
          store.settleDebt(debtor.id);
          modalContainer.innerHTML = '';
          renderView();
          showToast(`Utang ${debtor.personName} sudah lunas 😊`);
        });

        document.getElementById('btn-switch-partial')?.addEventListener('click', () => {
          isPartial = true;
          renderSettleSheet();
        });
      } else {
        document.getElementById('btn-cancel-partial')?.addEventListener('click', () => {
          isPartial = false;
          renderSettleSheet();
        });

        const inputPart = document.getElementById('input-partial-pay');
        inputPart?.addEventListener('input', (e) => {
          partialAmount = parseRupiahInput(e.target.value);
          e.target.value = partialAmount ? formatRupiah(partialAmount) : '';
        });

        document.getElementById('btn-save-partial')?.addEventListener('click', () => {
          if (!partialAmount || partialAmount <= 0) {
            showToast('Masukkan jumlah uang yang dibayarkan ya 😊', 'error');
            return;
          }
          if (partialAmount > debtor.totalDebt) {
            showToast(`Jumlah bayar melebihi utang (${formatRupiah(debtor.totalDebt)})`, 'error');
            return;
          }

          store.settleDebt(debtor.id, partialAmount);
          modalContainer.innerHTML = '';
          renderView();
          showToast(`Cicilan ${formatRupiah(partialAmount)} untuk ${debtor.personName} dicatat 😊`);
        });
      }
    }

    renderSettleSheet();
  }

  // Add more debt to an existing person
  function openAddMoreDebtModal(debtor) {
    const modalContainer = document.getElementById('modal-container');
    let amount = '';

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">Tambah Utang ${debtor.personName} 📝</div>
            <button class="modal-close-btn" id="btn-close-add-debt">✕</button>
          </div>

          <div class="input-money-container">
            <label class="input-money-label" for="input-add-debt-amt">Berapa tambahan utangnya?</label>
            <input 
              type="text" 
              inputmode="numeric" 
              id="input-add-debt-amt" 
              class="input-money-box" 
              placeholder="Contoh: Rp20.000" 
              autofocus 
            />
          </div>

          <div class="input-money-container">
            <label class="input-money-label" for="input-add-debt-note">Barang apa yang diutang? (Opsional):</label>
            <input 
              type="text" 
              id="input-add-debt-note" 
              class="input-money-box" 
              placeholder="Contoh: Rokok & telur 3 butir" 
              style="font-size: 1.05rem;"
            />
          </div>

          <button class="btn-huge btn-warning" id="btn-save-additional-debt">
            <span>CATAT TAMBAHAN UTANG</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-close-add-debt')?.addEventListener('click', () => {
      openDebtorDetailModal(debtor.id);
    });

    const amtInput = document.getElementById('input-add-debt-amt');
    amtInput?.addEventListener('input', (e) => {
      amount = parseRupiahInput(e.target.value);
      e.target.value = amount ? formatRupiah(amount) : '';
    });

    document.getElementById('btn-save-additional-debt')?.addEventListener('click', () => {
      if (!amount || amount <= 0) {
        showToast('Jumlah uang utang diisi dulu ya 😊', 'error');
        return;
      }
      const note = document.getElementById('input-add-debt-note')?.value.trim();
      store.addDebtToPerson(debtor.id, amount, note || 'Belanja ngutang tambahan');
      modalContainer.innerHTML = '';
      renderView();
      showToast(`Utang ${debtor.personName} berhasil ditambahkan`);
    });
  }

  // Add new debtor from scratch
  function openAddPersonModal() {
    const modalContainer = document.getElementById('modal-container');
    let initialDebt = 0;

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">Tambah Orang Baru 👤</div>
            <button class="modal-close-btn" id="btn-close-new-person">✕</button>
          </div>

          <div class="input-money-container">
            <label class="input-money-label" for="input-new-debtor-name">Siapa nama orangnya?</label>
            <input 
              type="text" 
              id="input-new-debtor-name" 
              class="input-money-box" 
              placeholder="Contoh: Pak Joko, Bu Ani" 
              autofocus 
            />
          </div>

          <div class="input-money-container">
            <label class="input-money-label" for="input-new-debtor-amt">Punya utang berapa sekarang? (Boleh 0):</label>
            <input 
              type="text" 
              inputmode="numeric" 
              id="input-new-debtor-amt" 
              class="input-money-box" 
              placeholder="Rp0" 
            />
          </div>

          <button class="btn-huge btn-primary" id="btn-save-new-debtor">
            <span>SIMPAN ORANG</span>
            <span>✅</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-close-new-person')?.addEventListener('click', () => {
      modalContainer.innerHTML = '';
    });

    const amtInput = document.getElementById('input-new-debtor-amt');
    amtInput?.addEventListener('input', (e) => {
      initialDebt = parseRupiahInput(e.target.value);
      e.target.value = initialDebt ? formatRupiah(initialDebt) : '';
    });

    document.getElementById('btn-save-new-debtor')?.addEventListener('click', () => {
      const name = document.getElementById('input-new-debtor-name')?.value.trim();
      if (!name) {
        showToast('Nama orang diisi dulu ya Bu/Pak 😊', 'error');
        return;
      }
      store.addDebtor(name, initialDebt, 'Catatan utang awal');
      modalContainer.innerHTML = '';
      renderView();
      showToast(`Data ${name} berhasil disimpan 😊`);
    });
  }

  renderView();
}
