// Jualan (POS & Cart) Component for WARUNG OS
import { store, formatRupiah, parseRupiahInput } from '../data/store.js';
import { showToast } from '../utils/toast.js';

export function renderJualan(container, navigateToTab) {
  // Cart state: map of productId -> quantity
  let cart = {};

  function getTotalItems() {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }

  function getCartTotal() {
    const products = store.getProducts();
    let total = 0;
    for (const [prodId, qty] of Object.entries(cart)) {
      const p = products.find((prod) => prod.id === prodId);
      if (p) {
        total += (p.sellingPrice || 0) * qty;
      }
    }
    return total;
  }

  function renderView() {
    const products = store.getProducts();
    const totalItems = getTotalItems();
    const cartTotal = getCartTotal();

    container.innerHTML = `
      <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <h2 style="font-size: 1.4rem; font-weight: 900; color: var(--color-text-main);">
          Pilih Barang Jualan 🛒
        </h2>
        ${
          totalItems > 0
            ? `<button class="btn-small btn-secondary" id="btn-clear-cart" style="color: var(--color-danger); border-color: var(--color-danger-border); font-weight: 800;">Batal Belanja</button>`
            : ''
        }
      </div>

      <p style="font-size: 1.05rem; color: var(--color-text-muted); margin-bottom: 14px; font-weight: 700;">
        Pilih barang yang dibeli 😊
      </p>

      ${
        products.length === 0
          ? `
        <div class="card text-center" style="padding: 32px 16px;">
          <div style="font-size: 3rem; margin-bottom: 8px;">📦</div>
          <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 6px;">Belum ada barang</h3>
          <p style="color: var(--color-text-muted); margin-bottom: 16px;">Yuk tambahkan barang jualan pertama kamu!</p>
          <button class="btn-huge btn-primary" id="btn-goto-tambah-barang">
            <span>+ Tambah Barang</span>
          </button>
        </div>
      `
          : `
        <!-- Product Grid -->
        <div class="product-grid">
          ${products
            .map((p) => {
              const qtyInCart = cart[p.id] || 0;
              const isLowStock = (p.stock || 0) <= (p.lowStockThreshold || 5);
              return `
              <div class="product-card ${qtyInCart > 0 ? 'has-cart' : ''}" data-product-id="${p.id}">
                ${qtyInCart > 0 ? `<div class="product-qty-badge">${qtyInCart}</div>` : ''}
                <div class="product-emoji">${p.emoji || '📦'}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-price">${formatRupiah(p.sellingPrice)}</div>
                ${
                  qtyInCart > 0
                    ? `<div style="background: var(--color-primary-light); color: var(--color-primary-dark); font-weight: 800; font-size: 0.95rem; border-radius: var(--radius-full); padding: 4px 10px; margin-top: 6px; border: 1.5px solid var(--color-primary-border);">
                         Dipilih: <strong>${qtyInCart}</strong>
                       </div>`
                    : `
                      <div class="product-stock-hint">
                        ${isLowStock ? `<span style="color: #B45309; font-weight: 700;">⚠️ Sisa ${p.stock}</span>` : `Stok: ${p.stock}`}
                      </div>
                    `
                }
              </div>
            `;
            })
            .join('')}
        </div>
      `
      }

      <!-- Floating Bottom Cart Bar if items in cart -->
      ${
        totalItems > 0
          ? `
        <div class="cart-floating-bar" id="cart-bar">
          <div class="cart-summary" id="cart-summary-clickable" style="cursor: pointer;">
            <span class="cart-items-count">🛒 ${totalItems} barang belanjaan (Lihat Rincian)</span>
            <span class="cart-total">${formatRupiah(cartTotal)}</span>
          </div>
          <button class="btn-huge btn-success cart-action-btn" id="btn-cart-pay">
            <span>BAYAR</span>
            <span>➡️</span>
          </button>
        </div>
      `
          : ''
      }
    `;

    bindProductEvents();
  }

  function bindProductEvents() {
    // Product click to add to cart
    container.querySelectorAll('.product-card').forEach((card) => {
      card.addEventListener('click', () => {
        const prodId = card.getAttribute('data-product-id');
        const prod = store.getProductById(prodId);
        if (!prod) return;

        const currentQty = cart[prodId] || 0;
        if (currentQty >= prod.stock) {
          showToast(`Stok ${prod.name} hanya ada ${prod.stock} ya Bu/Pak 😊`, 'error');
          return;
        }

        cart[prodId] = currentQty + 1;
        renderView();
      });
    });

    // Clear cart with confirmation
    document.getElementById('btn-clear-cart')?.addEventListener('click', () => {
      if (confirm('Mau batalkan dan kosongkan belanjaan ini, Bu/Pak?')) {
        cart = {};
        renderView();
        showToast('Belanjaan dibatalkan');
      }
    });

    // Empty state goto tambah barang
    document.getElementById('btn-goto-tambah-barang')?.addEventListener('click', () => {
      navigateToTab('barang');
    });

    // Cart summary click -> open detailed cart modal
    document.getElementById('cart-summary-clickable')?.addEventListener('click', () => {
      openCartReviewModal();
    });

    // Pay button click -> open payment modal
    document.getElementById('btn-cart-pay')?.addEventListener('click', () => {
      openPaymentModal();
    });
  }

  // Review Cart Modal (allows adjusting quantities or deleting items)
  function openCartReviewModal() {
    const modalContainer = document.getElementById('modal-container');
    const products = store.getProducts();
    const cartItems = Object.entries(cart)
      .map(([id, qty]) => {
        const p = products.find((prod) => prod.id === id);
        return p ? { ...p, quantity: qty, subtotal: p.sellingPrice * qty } : null;
      })
      .filter(Boolean);

    const total = getCartTotal();

    modalContainer.innerHTML = `
      <div class="modal-overlay" id="cart-review-overlay">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">Daftar Belanjaan 🛒</div>
            <button class="modal-close-btn" id="btn-close-cart-review">✕</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
            ${cartItems
              .map(
                (item) => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1.5px solid var(--color-border);">
                <div>
                  <div style="font-weight: 800; font-size: 1.05rem;">${item.emoji} ${item.name}</div>
                  <div style="font-size: 0.88rem; color: var(--color-text-muted); font-weight: 600;">
                    ${formatRupiah(item.sellingPrice)} × ${item.quantity} = <strong>${formatRupiah(item.subtotal)}</strong>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <button class="btn-small btn-secondary btn-qty-minus" data-id="${item.id}" style="width: 38px; height: 38px; padding: 0; font-size: 1.2rem; font-weight: 900;">-</button>
                  <span style="font-size: 1.15rem; font-weight: 900; min-width: 24px; text-align: center;">${item.quantity}</span>
                  <button class="btn-small btn-secondary btn-qty-plus" data-id="${item.id}" style="width: 38px; height: 38px; padding: 0; font-size: 1.2rem; font-weight: 900;">+</button>
                </div>
              </div>
            `
              )
              .join('')}
          </div>

          <div class="pay-total-card" style="margin-bottom: 14px;">
            <div class="pay-total-label">TOTAL BELANJA</div>
            <div class="pay-total-value">${formatRupiah(total)}</div>
          </div>

          <button class="btn-huge btn-success" id="btn-modal-proceed-pay">
            <span>LANJUT BAYAR</span>
            <span>➡️</span>
          </button>
        </div>
      </div>
    `;

    // Events
    document.getElementById('btn-close-cart-review')?.addEventListener('click', () => {
      modalContainer.innerHTML = '';
      renderView();
    });

    modalContainer.querySelectorAll('.btn-qty-minus').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (cart[id] > 1) {
          cart[id] -= 1;
        } else {
          delete cart[id];
        }
        if (getTotalItems() === 0) {
          modalContainer.innerHTML = '';
          renderView();
        } else {
          openCartReviewModal();
        }
      });
    });

    modalContainer.querySelectorAll('.btn-qty-plus').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = store.getProductById(id);
        if (prod && cart[id] < prod.stock) {
          cart[id] += 1;
          openCartReviewModal();
        } else {
          showToast(`Stok barang sudah maksimal ya 😊`, 'error');
        }
      });
    });

    document.getElementById('btn-modal-proceed-pay')?.addEventListener('click', () => {
      modalContainer.innerHTML = '';
      openPaymentModal();
    });
  }

  // Payment Modal with Cash & Ngutang options
  function openPaymentModal() {
    const modalContainer = document.getElementById('modal-container');
    const total = getCartTotal();
    const products = store.getProducts();

    const saleItems = Object.entries(cart)
      .map(([id, qty]) => {
        const p = products.find((prod) => prod.id === id);
        return p ? { productId: p.id, name: p.name, quantity: qty, price: p.sellingPrice, subtotal: p.sellingPrice * qty } : null;
      })
      .filter(Boolean);

    let cashReceived = total; // Default to exact cash
    let activeMode = 'cash'; // 'cash' or 'debt'
    let selectedDebtorId = null;
    let newDebtorName = '';

    // Quick cash nominal suggestions based on total
    const quickAmounts = [];
    quickAmounts.push({ label: 'Uang Pas', amount: total });
    [10000, 20000, 50000, 100000].forEach((nominal) => {
      if (nominal > total && !quickAmounts.find((q) => q.amount === nominal)) {
        quickAmounts.push({ label: formatRupiah(nominal), amount: nominal });
      }
    });

    function renderModalContent() {
      const change = Math.max(0, cashReceived - total);
      const isEnough = cashReceived >= total;
      const debtors = store.getAllDebts();

      if (activeMode === 'cash') {
        modalContainer.innerHTML = `
          <div class="modal-overlay" id="pay-overlay">
            <div class="modal-sheet">
              <div class="modal-header">
                <div class="modal-title">Pembayaran 💵</div>
                <button class="modal-close-btn" id="btn-close-pay">✕</button>
              </div>

              <!-- Total Card -->
              <div class="pay-total-card">
                <div class="pay-total-label">TOTAL BELANJA</div>
                <div class="pay-total-value">${formatRupiah(total)}</div>
              </div>

              <!-- Quick Cash Buttons -->
              <label class="input-money-label">Pilihan Uang Diterima:</label>
              <div class="quick-cash-grid">
                ${quickAmounts
                  .map(
                    (q) => `
                  <button type="button" class="btn-cash-quick ${cashReceived === q.amount ? 'selected' : ''}" data-amount="${q.amount}">
                    <span style="font-size: 1.15rem; font-weight: 900;">${q.label}</span>
                  </button>
                `
                  )
                  .join('')}
              </div>

              <!-- Manual Cash Input -->
              <div class="input-money-container">
                <label class="input-money-label" for="input-cash-received">Atau masukkan jumlah uang:</label>
                <input 
                  type="text" 
                  inputmode="numeric" 
                  id="input-cash-received" 
                  class="input-money-box" 
                  value="${formatRupiah(cashReceived)}" 
                  placeholder="Rp0" 
                />
              </div>

              <!-- Kembalian Card -->
              <div class="pay-change-card" style="${!isEnough ? 'background: #FEF2F2; border-color: #FECACA;' : ''}">
                <span class="pay-change-label" style="${!isEnough ? 'color: #991B1B;' : ''}">
                  ${isEnough ? 'KEMBALIAN' : 'KURANG'}
                </span>
                <span class="pay-change-val" style="${!isEnough ? 'color: #DC2626;' : ''}">
                  ${isEnough ? formatRupiah(change) : formatRupiah(total - cashReceived)}
                </span>
              </div>

              <!-- Finish Sale Button -->
              <button class="btn-huge btn-success" id="btn-finish-sale" ${!isEnough ? 'disabled style="opacity: 0.5;"' : ''}>
                <span>SUDAH DIBAYAR (SELESAI)</span>
                <span>✅</span>
              </button>

              <!-- Option to record as Ngutang -->
              <button type="button" class="pay-debt-option-btn" id="btn-switch-to-debt">
                <span style="font-size: 1.4rem;">👤</span>
                <span>Orang Mau Ngutang (Catat Nanti)</span>
              </button>
            </div>
          </div>
        `;

        bindCashEvents();
      } else {
        // Debt Mode: "Siapa yang ngutang?"
        modalContainer.innerHTML = `
          <div class="modal-overlay" id="debt-overlay">
            <div class="modal-sheet">
              <div class="modal-header">
                <div class="modal-title">Catat Ngutang 👤</div>
                <button class="modal-close-btn" id="btn-back-to-cash">✕</button>
              </div>

              <div class="pay-total-card" style="background: #FEF2F2; border-color: #FECACA;">
                <div class="pay-total-label" style="color: #991B1B;">TOTAL YANG DIUTANGKAN</div>
                <div class="pay-total-value" style="color: #DC2626;">${formatRupiah(total)}</div>
              </div>

              <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 10px;">Siapa yang ngutang?</h3>

              <!-- Debtor List -->
              <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; margin-bottom: 14px;">
                ${debtors
                  .map(
                    (d) => `
                  <button type="button" class="btn-cash-quick btn-select-debtor ${selectedDebtorId === d.id ? 'selected' : ''}" data-debtor-id="${d.id}" style="padding: 12px; flex-direction: row; justify-content: space-between;">
                    <span style="font-weight: 800;">👤 ${d.personName}</span>
                    <span style="font-size: 0.85rem; color: var(--color-text-muted);">Utang lama: ${formatRupiah(d.totalDebt)}</span>
                  </button>
                `
                  )
                  .join('')}
              </div>

              <!-- Add New Person Name Input -->
              <div class="input-money-container">
                <label class="input-money-label" for="input-new-person">Atau tambah nama orang baru:</label>
                <input 
                  type="text" 
                  id="input-new-person" 
                  class="input-money-box" 
                  value="${newDebtorName}" 
                  placeholder="Contoh: Bu Siti / Pak Budi" 
                  style="font-size: 1.1rem;"
                />
              </div>

              ${
                selectedDebtorId || newDebtorName
                  ? `
                <div style="background: #FFFBEB; border: 1.5px solid #FCD34D; border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 14px; font-weight: 700; color: #92400E;">
                  Utang ${formatRupiah(total)} dicatat untuk: <strong>${newDebtorName || debtors.find((d) => d.id === selectedDebtorId)?.personName}</strong>
                </div>
              `
                  : ''
              }

              <button class="btn-huge btn-warning" id="btn-finish-debt" style="margin-bottom: 8px;">
                <span>CATAT UTANG</span>
                <span>📝</span>
              </button>

              <button type="button" class="btn-huge btn-secondary" id="btn-cancel-debt" style="min-height: 48px; font-size: 1rem;">
                <span>Kembali ke Bayar Tunai</span>
              </button>
            </div>
          </div>
        `;

        bindDebtEvents();
      }
    }

    function bindCashEvents() {
      document.getElementById('btn-close-pay')?.addEventListener('click', () => {
        modalContainer.innerHTML = '';
      });

      // Quick nominal clicks
      modalContainer.querySelectorAll('.btn-cash-quick').forEach((btn) => {
        btn.addEventListener('click', () => {
          const amt = parseInt(btn.getAttribute('data-amount'), 10);
          cashReceived = amt;
          renderModalContent();
        });
      });

      // Manual input
      const inputCash = document.getElementById('input-cash-received');
      inputCash?.addEventListener('input', (e) => {
        const parsed = parseRupiahInput(e.target.value);
        cashReceived = parsed;
        // Don't re-render entire modal while typing to preserve focus, just update change card & finish button
        updateChangePreview();
      });

      function updateChangePreview() {
        const change = Math.max(0, cashReceived - total);
        const isEnough = cashReceived >= total;
        const changeLabel = modalContainer.querySelector('.pay-change-label');
        const changeVal = modalContainer.querySelector('.pay-change-val');
        const changeCard = modalContainer.querySelector('.pay-change-card');
        const finishBtn = document.getElementById('btn-finish-sale');

        if (changeLabel && changeVal && changeCard) {
          changeLabel.textContent = isEnough ? 'KEMBALIAN' : 'KURANG';
          changeVal.textContent = isEnough ? formatRupiah(change) : formatRupiah(total - cashReceived);

          if (isEnough) {
            changeCard.style.background = 'var(--color-success-light)';
            changeCard.style.borderColor = 'var(--color-success-border)';
            changeLabel.style.color = 'var(--color-success-dark)';
            changeVal.style.color = 'var(--color-success-dark)';
            if (finishBtn) {
              finishBtn.removeAttribute('disabled');
              finishBtn.style.opacity = '1';
            }
          } else {
            changeCard.style.background = '#FEF2F2';
            changeCard.style.borderColor = '#FECACA';
            changeLabel.style.color = '#991B1B';
            changeVal.style.color = '#DC2626';
            if (finishBtn) {
              finishBtn.setAttribute('disabled', 'true');
              finishBtn.style.opacity = '0.5';
            }
          }
        }
      }

      // Switch to Debt Mode
      document.getElementById('btn-switch-to-debt')?.addEventListener('click', () => {
        activeMode = 'debt';
        renderModalContent();
      });

      // Finish Cash Sale
      document.getElementById('btn-finish-sale')?.addEventListener('click', () => {
        if (cashReceived < total) {
          showToast('Uang yang diterima masih kurang ya Bu/Pak 😊', 'error');
          return;
        }

        const change = cashReceived - total;
        store.recordSale({
          items: saleItems,
          total,
          cashReceived,
          change,
          isDebt: false
        });

        modalContainer.innerHTML = '';
        cart = {};
        renderView();
        showToast('Jualan berhasil dicatat 😊');
      });
    }

    function bindDebtEvents() {
      document.getElementById('btn-back-to-cash')?.addEventListener('click', () => {
        modalContainer.innerHTML = '';
      });

      document.getElementById('btn-cancel-debt')?.addEventListener('click', () => {
        activeMode = 'cash';
        renderModalContent();
      });

      modalContainer.querySelectorAll('.btn-select-debtor').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedDebtorId = btn.getAttribute('data-debtor-id');
          newDebtorName = '';
          renderModalContent();
        });
      });

      const newPersonInput = document.getElementById('input-new-person');
      newPersonInput?.addEventListener('input', (e) => {
        newDebtorName = e.target.value;
        if (newDebtorName.trim()) {
          selectedDebtorId = null;
        }
      });

      document.getElementById('btn-finish-debt')?.addEventListener('click', () => {
        const debtorNameVal = newDebtorName.trim();
        if (!selectedDebtorId && !debtorNameVal) {
          showToast('Pilih orang atau ketik nama orangnya dulu ya 😊', 'error');
          return;
        }

        store.recordSale({
          items: saleItems,
          total,
          cashReceived: 0,
          change: 0,
          isDebt: true,
          debtorId: selectedDebtorId,
          debtorName: debtorNameVal
        });

        const targetName = debtorNameVal || store.getAllDebts().find((d) => d.id === selectedDebtorId)?.personName;
        modalContainer.innerHTML = '';
        cart = {};
        renderView();
        showToast(`Utang dicatat untuk ${targetName} 😊`);
      });
    }

    renderModalContent();
  }

  renderView();
}
