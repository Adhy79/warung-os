// Barang (Inventory & Products) Component for WARUNG OS
import { store, formatRupiah, parseRupiahInput } from '../data/store.js';
import { showToast } from '../utils/toast.js';

export function renderBarang(container) {
  function renderView() {
    const products = store.getProducts();

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 900; color: var(--color-text-main);">
            Daftar Barang 📦
          </h2>
          <p style="font-size: 0.88rem; color: var(--color-text-muted); font-weight: 600;">
            Total ada ${products.length} macam barang
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-small btn-secondary" id="btn-open-purchase" style="font-size: 0.92rem; font-weight: 800; padding: 10px 12px; background: #EFF6FF; border: 1.5px solid #93C5FD; color: #1D4ED8;">
            <span>📦 BELANJA BARANG</span>
          </button>
          <button class="btn-small btn-primary" id="btn-open-add-product" style="font-size: 0.92rem; font-weight: 800; padding: 10px 12px;">
            <span>+ TAMBAH BARANG</span>
          </button>
        </div>
      </div>

      ${
        products.length === 0
          ? `
        <div class="card text-center" style="padding: 36px 16px;">
          <div style="font-size: 3rem; margin-bottom: 10px;">📦</div>
          <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Belum Ada Barang</h3>
          <p style="color: var(--color-text-muted); margin-bottom: 20px;">Yuk catat barang jualanmu biar gampang dijual!</p>
          <button class="btn-huge btn-primary" id="btn-empty-add-product">
            <span>+ TAMBAH BARANG SEKARANG</span>
          </button>
        </div>
      `
          : `
        <!-- Stock List -->
        <div class="stock-list">
          ${products
            .map((p) => {
              const isLow = (p.stock || 0) <= (p.lowStockThreshold || 5);
              return `
              <div class="stock-item-card" data-id="${p.id}">
                <div class="stock-item-left">
                  <span class="stock-item-emoji">${p.emoji || '📦'}</span>
                  <div class="stock-item-info">
                    <div class="item-name">${p.name}</div>
                    <div class="item-price" style="font-weight: 800;">Harga Jual: ${formatRupiah(p.sellingPrice)} / ${p.unit || 'buah'}</div>
                    <div style="font-size: 0.82rem; font-weight: 600; margin-top: 2px;">
                      ${(p.costPrice && p.costPrice > 0)
                        ? `<span style="color: var(--color-text-muted);">Harga Modal: ${formatRupiah(p.costPrice)}</span>`
                        : `<span style="color: #92400E; background: #FEF3C7; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem;">Harga Modal belum diisi</span>`}
                    </div>
                  </div>
                </div>

                <div class="stock-item-right">
                  <div class="stock-qty-text">${p.stock} ${p.unit || ''}</div>
                  ${
                    isLow
                      ? `
                    <span class="badge badge-warning">
                      ⚠️ Tinggal ${p.stock}
                    </span>
                  `
                      : `
                    <span class="badge badge-success">
                      Aman
                    </span>
                  `
                  }
                  <div style="display: flex; gap: 6px; margin-top: 6px;">
                    <button class="btn-small btn-secondary btn-quick-purch" data-id="${p.id}" style="min-height: 42px; padding: 6px 10px; font-size: 0.9rem; font-weight: 800; background: #EFF6FF; border-color: #BFDBFE; color: #1D4ED8;">
                      📦 Belanja
                    </button>
                    <button class="btn-small btn-secondary btn-edit-stock" data-id="${p.id}" style="min-height: 42px; padding: 6px 12px; font-size: 0.9rem; font-weight: 800;">
                      ➕ / ➖ Stok
                    </button>
                  </div>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      `
      }
    `;

    bindEvents();
  }

  function bindEvents() {
    document.getElementById('btn-open-purchase')?.addEventListener('click', () => {
      openPurchaseModal();
    });

    document.getElementById('btn-open-add-product')?.addEventListener('click', () => {
      openAddProductWizard();
    });

    document.getElementById('btn-empty-add-product')?.addEventListener('click', () => {
      openAddProductWizard();
    });

    // Whole card or button click to edit stock
    container.querySelectorAll('.stock-item-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        openEditStockModal(id);
      });
    });

    container.querySelectorAll('.btn-quick-purch').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        openPurchaseModal(id);
      });
    });

    container.querySelectorAll('.btn-edit-stock').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        openEditStockModal(id);
      });
    });
  }

  // ==========================================================================
  // V2.2 — MODAL BELANJA BARANG (KULAKAN)
  // ==========================================================================
  function openPurchaseModal(defaultProductId = null) {
    const modalContainer = document.getElementById('modal-container');
    const products = store.getProducts();
    if (products.length === 0) {
      showToast('Tambahkan barang terlebih dahulu ya Bu/Pak 😊', 'info');
      return;
    }

    let selectedProductId = defaultProductId || products[0].id;
    let quantity = 10;
    let totalCost = '';

    function getSelectedProduct() {
      return products.find((p) => p.id === selectedProductId) || products[0];
    }

    function renderPurchaseModal() {
      const prod = getSelectedProduct();
      const unitCost = quantity > 0 && totalCost > 0 ? Math.round(totalCost / quantity) : 0;

      modalContainer.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-sheet">
            <div class="modal-header">
              <div class="modal-title">Belanja Barang (Kulakan) 📦</div>
              <button class="modal-close-btn" id="btn-close-purch">✕</button>
            </div>

            <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 14px;">
              Catat barang yang baru dibeli untuk menambah stok dan memperbarui harga modal warung.
            </p>

            <!-- 1. Pilih Barang -->
            <div class="input-money-container" style="margin-bottom: 14px;">
              <label class="input-money-label" for="select-purch-prod">Nama Barang:</label>
              <select id="select-purch-prod" class="input-money-box" style="font-size: 1.1rem; font-weight: 800; padding: 10px;">
                ${products
                  .map(
                    (p) => `
                  <option value="${p.id}" ${p.id === selectedProductId ? 'selected' : ''}>
                    ${p.emoji} ${p.name} (Stok: ${p.stock} ${p.unit || 'buah'})
                  </option>
                `
                  )
                  .join('')}
              </select>
            </div>

            <!-- 2. Jumlah Barang Dibeli -->
            <div class="input-money-container" style="margin-bottom: 14px;">
              <label class="input-money-label" for="input-purch-qty">Jumlah yang Dibeli (${prod.unit || 'pcs'}):</label>
              <div style="display: flex; align-items: center; gap: 10px;">
                <button type="button" class="btn-huge btn-secondary" id="btn-purch-dec" style="flex: 1; min-height: 48px; font-size: 1.1rem; font-weight: 900;">
                  ➖
                </button>
                <input 
                  type="number" 
                  id="input-purch-qty" 
                  class="input-money-box" 
                  value="${quantity}" 
                  style="text-align: center; max-width: 110px; font-size: 1.5rem; font-weight: 900;" 
                />
                <button type="button" class="btn-huge btn-secondary" id="btn-purch-inc" style="flex: 1; min-height: 48px; font-size: 1.1rem; font-weight: 900;">
                  ➕
                </button>
              </div>
            </div>

            <!-- 3. Total Biaya Belanja -->
            <div class="input-money-container" style="margin-bottom: 16px;">
              <label class="input-money-label" for="input-purch-cost">Total Belanja (Total Uang Keluar):</label>
              <input 
                type="text" 
                inputmode="numeric" 
                id="input-purch-cost" 
                class="input-money-box" 
                value="${totalCost ? formatRupiah(totalCost) : ''}" 
                placeholder="Contoh: 50.000" 
                style="font-size: 1.35rem; font-weight: 900; color: #1D4ED8;"
              />
            </div>

            <!-- 4. Ringkasan & Harga Modal Otomatis -->
            <div style="background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: var(--radius-md); padding: 12px; margin-bottom: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 0.9rem; color: #1E40AF; font-weight: 700;">Harga Modal per unit:</span>
                <span style="font-size: 1.25rem; font-weight: 900; color: #1D4ED8;" id="label-unit-cost">
                  ${unitCost > 0 ? formatRupiah(unitCost) : 'Rp0'}
                </span>
              </div>
              <div style="font-size: 0.8rem; color: var(--color-text-muted); line-height: 1.4;">
                Efek: Stok ${prod.name} bertambah +${quantity}, uang di laci berkurang ${totalCost > 0 ? formatRupiah(totalCost) : 'Rp0'}, dan harga modal terbaru disimpan.
              </div>
            </div>

            <!-- 5. Tombol Aksi -->
            <div style="display: flex; gap: 10px;">
              <button class="btn-huge btn-secondary" id="btn-close-purch-action" style="flex: 1; min-height: 54px; font-size: 1rem;">
                <span>Batal</span>
              </button>
              <button class="btn-huge btn-primary" id="btn-submit-purch" style="flex: 2; min-height: 54px; font-size: 1.05rem; font-weight: 900; background: #2563EB;">
                <span>CATAT BELANJA</span>
                <span>✅</span>
              </button>
            </div>
          </div>
        </div>
      `;

      document.getElementById('btn-close-purch')?.addEventListener('click', () => (modalContainer.innerHTML = ''));
      document.getElementById('btn-close-purch-action')?.addEventListener('click', () => (modalContainer.innerHTML = ''));

      const selectProd = document.getElementById('select-purch-prod');
      selectProd?.addEventListener('change', (e) => {
        selectedProductId = e.target.value;
        renderPurchaseModal();
      });

      const qtyInput = document.getElementById('input-purch-qty');
      qtyInput?.addEventListener('input', (e) => {
        quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
        const costVal = parseRupiahInput(document.getElementById('input-purch-cost')?.value) || 0;
        const u = quantity > 0 && costVal > 0 ? Math.round(costVal / quantity) : 0;
        const lbl = document.getElementById('label-unit-cost');
        if (lbl) lbl.textContent = formatRupiah(u);
      });

      document.getElementById('btn-purch-dec')?.addEventListener('click', () => {
        if (quantity > 1) {
          quantity--;
          const input = document.getElementById('input-purch-qty');
          if (input) input.value = quantity;
          const costVal = parseRupiahInput(document.getElementById('input-purch-cost')?.value) || 0;
          const u = quantity > 0 && costVal > 0 ? Math.round(costVal / quantity) : 0;
          const lbl = document.getElementById('label-unit-cost');
          if (lbl) lbl.textContent = formatRupiah(u);
        }
      });

      document.getElementById('btn-purch-inc')?.addEventListener('click', () => {
        quantity++;
        const input = document.getElementById('input-purch-qty');
        if (input) input.value = quantity;
        const costVal = parseRupiahInput(document.getElementById('input-purch-cost')?.value) || 0;
        const u = quantity > 0 && costVal > 0 ? Math.round(costVal / quantity) : 0;
        const lbl = document.getElementById('label-unit-cost');
        if (lbl) lbl.textContent = formatRupiah(u);
      });

      const costInput = document.getElementById('input-purch-cost');
      costInput?.addEventListener('input', (e) => {
        totalCost = parseRupiahInput(e.target.value);
        e.target.value = totalCost ? formatRupiah(totalCost) : '';
        const unit = quantity > 0 && totalCost > 0 ? Math.round(totalCost / quantity) : 0;
        const lbl = document.getElementById('label-unit-cost');
        if (lbl) lbl.textContent = formatRupiah(unit);
      });

      document.getElementById('btn-submit-purch')?.addEventListener('click', () => {
        const prod = getSelectedProduct();
        const finalCost = parseRupiahInput(costInput?.value) || totalCost;
        if (!finalCost || finalCost <= 0) {
          showToast('Total belanja diisi dulu ya Bu/Pak 😊', 'error');
          return;
        }
        if (!quantity || quantity <= 0) {
          showToast('Jumlah barang harus lebih dari 0 ya 😊', 'error');
          return;
        }

        const unitCost = Math.round(finalCost / quantity);

        store.recordPurchase({
          productId: prod.id,
          productName: prod.name,
          quantity,
          totalCost: finalCost,
          unitCost
        });

        modalContainer.innerHTML = '';
        renderView();
        showToast(`Belanja ${prod.name} ${quantity} ${prod.unit || 'buah'} berhasil dicatat! 😊`, 'success');
      });
    }

    renderPurchaseModal();
  }

  function autoDetectEmoji(text) {
    const t = (text || '').toLowerCase();
    if (t.includes('mie') || t.includes('indomie') || t.includes('sedap')) return '🍜';
    if (t.includes('soto') || t.includes('bakso') || t.includes('sup')) return '🍲';
    if (t.includes('telur') || t.includes('telor')) return '🥚';
    if (t.includes('teh') || t.includes('es') || t.includes('jus')) return '🥤';
    if (t.includes('kopi')) return '☕';
    if (t.includes('roti') || t.includes('kue') || t.includes('biskuit')) return '🍞';
    if (t.includes('sabun') || t.includes('shampoo') || t.includes('rinso') || t.includes('daia')) return '🧼';
    if (t.includes('minyak') || t.includes('kecap') || t.includes('saus')) return '🧴';
    if (t.includes('beras') || t.includes('nasi')) return '🍚';
    if (t.includes('rokok')) return '🚬';
    if (t.includes('kerupuk') || t.includes('krupuk') || t.includes('snack') || t.includes('chiki')) return '🍘';
    return '📦';
  }

  // Step-by-step wizard for adding products
  function openAddProductWizard() {
    const modalContainer = document.getElementById('modal-container');
    let wizardStep = 1;
    let name = '';
    let emoji = '📦';
    let sellingPrice = '';
    let stock = '10';
    let costPrice = '';
    let unit = 'buah';

    const popularIcons = ['🍜', '🍲', '🥚', '🥤', '☕', '🍞', '🧼', '🧴', '🍘', '🍚', '📦'];

    function renderWizard() {
      if (wizardStep === 1) {
        modalContainer.innerHTML = `
          <div class="modal-overlay">
            <div class="modal-sheet">
              <div class="modal-header">
                <div class="modal-title">Tambah Barang (1/3) 📦</div>
                <button class="modal-close-btn" id="btn-close-wiz">✕</button>
              </div>

              <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Nama barang apa?</h3>
              <p style="font-size: 0.95rem; color: var(--color-text-muted); margin-bottom: 12px;">Contoh: Indomie Goreng, Es Teh, Telur</p>

              <input 
                type="text" 
                id="wiz-name" 
                class="input-money-box" 
                value="${name}" 
                placeholder="Ketik nama barang..." 
                autofocus
                style="margin-bottom: 16px;" 
              />

              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <label class="input-money-label" style="margin-bottom: 0;">Gambar Barang:</label>
                <span id="emoji-preview-badge" style="font-size: 1.6rem; line-height: 1;">${emoji}</span>
              </div>
              
              <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 10px;">Gambar otomatis dipilih sesuai nama, atau boleh pilih di bawah ini:</p>

              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">
                ${popularIcons
                  .map(
                    (ic) => `
                  <button type="button" class="btn-cash-quick btn-wiz-emoji ${emoji === ic ? 'selected' : ''}" data-emoji="${ic}" style="width: 48px; height: 48px; padding: 0; font-size: 1.5rem;">
                    ${ic}
                  </button>
                `
                  )
                  .join('')}
              </div>

              <button class="btn-huge btn-primary" id="btn-wiz-next1">
                <span>Lanjut</span>
                <span>➡️</span>
              </button>
            </div>
          </div>
        `;

        document.getElementById('btn-close-wiz')?.addEventListener('click', () => (modalContainer.innerHTML = ''));

        const nameInput = document.getElementById('wiz-name');
        nameInput?.addEventListener('input', (e) => {
          name = e.target.value;
          const detected = autoDetectEmoji(name);
          emoji = detected;
          const badge = document.getElementById('emoji-preview-badge');
          if (badge) badge.textContent = emoji;
          modalContainer.querySelectorAll('.btn-wiz-emoji').forEach((el) => {
            el.classList.toggle('selected', el.getAttribute('data-emoji') === emoji);
          });
        });

        modalContainer.querySelectorAll('.btn-wiz-emoji').forEach((b) => {
          b.addEventListener('click', () => {
            emoji = b.getAttribute('data-emoji');
            const badge = document.getElementById('emoji-preview-badge');
            if (badge) badge.textContent = emoji;
            modalContainer.querySelectorAll('.btn-wiz-emoji').forEach((el) => el.classList.remove('selected'));
            b.classList.add('selected');
          });
        });

        document.getElementById('btn-wiz-next1')?.addEventListener('click', () => {
          const val = document.getElementById('wiz-name')?.value.trim();
          if (!val) {
            showToast('Nama barang diisi dulu ya Bu/Pak 😊', 'error');
            return;
          }
          name = val;
          wizardStep = 2;
          renderWizard();
        });
      } else if (wizardStep === 2) {
        modalContainer.innerHTML = `
          <div class="modal-overlay">
            <div class="modal-sheet">
              <div class="modal-header">
                <div class="modal-title">Tambah Barang (2/3) 💰</div>
                <button class="modal-close-btn" id="btn-close-wiz">✕</button>
              </div>

              <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Berapa harga jualnya?</h3>
              <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 12px;">Untuk barang: <strong>${emoji} ${name}</strong></p>

              <input 
                type="text" 
                inputmode="numeric" 
                id="wiz-price" 
                class="input-money-box" 
                value="${sellingPrice ? formatRupiah(sellingPrice) : ''}" 
                placeholder="Contoh: 3500" 
                autofocus
                style="margin-bottom: 20px;" 
              />

              <div style="display: flex; gap: 10px;">
                <button class="btn-huge btn-secondary" id="btn-wiz-back2" style="flex: 1; min-height: 54px; font-size: 1rem;">
                  <span>Kembali</span>
                </button>
                <button class="btn-huge btn-primary" id="btn-wiz-next2" style="flex: 2; min-height: 54px;">
                  <span>Lanjut</span>
                  <span>➡️</span>
                </button>
              </div>
            </div>
          </div>
        `;

        document.getElementById('btn-close-wiz')?.addEventListener('click', () => (modalContainer.innerHTML = ''));
        document.getElementById('btn-wiz-back2')?.addEventListener('click', () => {
          wizardStep = 1;
          renderWizard();
        });

        const inputP = document.getElementById('wiz-price');
        inputP?.addEventListener('input', (e) => {
          sellingPrice = parseRupiahInput(e.target.value);
          e.target.value = sellingPrice ? formatRupiah(sellingPrice) : '';
        });

        document.getElementById('btn-wiz-next2')?.addEventListener('click', () => {
          if (!sellingPrice || sellingPrice <= 0) {
            showToast('Harga jual harus lebih dari Rp0 ya 😊', 'error');
            return;
          }
          wizardStep = 3;
          renderWizard();
        });
      } else if (wizardStep === 3) {
        modalContainer.innerHTML = `
          <div class="modal-overlay">
            <div class="modal-sheet">
              <div class="modal-header">
                <div class="modal-title">Tambah Barang (3/3) 📦</div>
                <button class="modal-close-btn" id="btn-close-wiz">✕</button>
              </div>

              <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Berapa stok sekarang?</h3>
              <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 12px;">Jumlah barang yang ada di warung saat ini</p>

              <input 
                type="number" 
                id="wiz-stock" 
                class="input-money-box" 
                value="${stock}" 
                placeholder="Contoh: 20" 
                autofocus
                style="margin-bottom: 14px;" 
              />

              <div class="input-money-container">
                <label class="input-money-label" for="wiz-cost">Harga modal kulakan (Boleh dilewati kalau lupa ya 😊):</label>
                <input 
                  type="text" 
                  inputmode="numeric" 
                  id="wiz-cost" 
                  class="input-money-box" 
                  value="${costPrice ? formatRupiah(costPrice) : ''}" 
                  placeholder="Rp0" 
                  style="font-size: 1.15rem;"
                />
              </div>

              <div style="background: #ECFDF5; border: 1.5px solid #A7F3D0; border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px;">
                <div style="font-weight: 800; color: #065F46; font-size: 1.05rem;">Sudah siap disimpan 😊</div>
                <div style="font-size: 0.9rem; color: #047857; margin-top: 2px;">
                  ${emoji} ${name} — ${formatRupiah(sellingPrice)}
                </div>
              </div>

              <div style="display: flex; gap: 10px;">
                <button class="btn-huge btn-secondary" id="btn-wiz-back3" style="flex: 1; min-height: 54px; font-size: 1rem;">
                  <span>Kembali</span>
                </button>
                <button class="btn-huge btn-success" id="btn-wiz-save" style="flex: 2; min-height: 54px;">
                  <span>SIMPAN BARANG</span>
                  <span>✅</span>
                </button>
              </div>
            </div>
          </div>
        `;

        document.getElementById('btn-close-wiz')?.addEventListener('click', () => (modalContainer.innerHTML = ''));
        document.getElementById('btn-wiz-back3')?.addEventListener('click', () => {
          wizardStep = 2;
          renderWizard();
        });

        const costInput = document.getElementById('wiz-cost');
        costInput?.addEventListener('input', (e) => {
          costPrice = parseRupiahInput(e.target.value);
          e.target.value = costPrice ? formatRupiah(costPrice) : '';
        });

        document.getElementById('btn-wiz-save')?.addEventListener('click', () => {
          const finalStock = parseInt(document.getElementById('wiz-stock')?.value, 10) || 0;
          store.addProduct({
            name,
            emoji,
            sellingPrice: Number(sellingPrice),
            costPrice: Number(costPrice) || 0,
            stock: finalStock,
            unit: 'buah'
          });

          modalContainer.innerHTML = '';
          renderView();
          showToast(`Barang ${name} berhasil disimpan 😊`);
        });
      }
    }

    renderWizard();
  }

  // Quick Edit Stock Modal
  function openEditStockModal(productId) {
    const modalContainer = document.getElementById('modal-container');
    const product = store.getProductById(productId);
    if (!product) return;

    let currentStock = product.stock || 0;

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-sheet">
          <div class="modal-header">
            <div class="modal-title">Tambah atau Kurang Barang 😊</div>
            <button class="modal-close-btn" id="btn-close-edit-stock">✕</button>
          </div>

          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 2.8rem;">${product.emoji}</span>
            <div>
              <div style="font-size: 1.3rem; font-weight: 800;">${product.name}</div>
              <div style="color: var(--color-primary-dark); font-weight: 700; font-size: 1.05rem;">${formatRupiah(product.sellingPrice)} / ${product.unit || 'buah'}</div>
            </div>
          </div>

          <label class="input-money-label" style="text-align: center; font-size: 1.05rem; margin-bottom: 8px;">
            Berapa jumlah stok di warung sekarang?
          </label>

          <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 16px;">
            <button class="btn-huge btn-secondary" id="btn-stock-dec" style="flex: 1; min-height: 52px; font-size: 1.05rem; font-weight: 800; border-color: #FED7AA; color: #C24417;">
              <span>➖ Kurangi</span>
            </button>
            <input 
              type="number" 
              id="input-stock-val" 
              class="input-money-box" 
              value="${currentStock}" 
              style="text-align: center; max-width: 100px; font-size: 2rem; font-weight: 900;" 
            />
            <button class="btn-huge btn-secondary" id="btn-stock-inc" style="flex: 1; min-height: 52px; font-size: 1.05rem; font-weight: 800; border-color: #A7F3D0; color: #047857;">
              <span>➕ Tambah</span>
            </button>
          </div>

          <div class="input-money-container" style="margin-bottom: 12px; text-align: left;">
            <label class="input-money-label" for="input-edit-sell">Harga Jual (Wajib):</label>
            <input 
              type="text" 
              inputmode="numeric" 
              id="input-edit-sell" 
              class="input-money-box" 
              value="${formatRupiah(product.sellingPrice)}" 
              style="font-size: 1.2rem; font-weight: 800;"
            />
          </div>

          <div class="input-money-container" style="margin-bottom: 18px; text-align: left;">
            <label class="input-money-label" for="input-edit-cost">Harga Modal (Opsional — boleh diisi nanti):</label>
            <input 
              type="text" 
              inputmode="numeric" 
              id="input-edit-cost" 
              class="input-money-box" 
              value="${product.costPrice ? formatRupiah(product.costPrice) : ''}" 
              placeholder="Rp0" 
              style="font-size: 1.15rem;"
            />
          </div>

          <button class="btn-huge btn-primary" id="btn-save-stock-update" style="margin-bottom: 10px;">
            <span>SIMPAN PERUBAHAN BARANG</span>
            <span>✅</span>
          </button>
          
          <button type="button" class="btn-small btn-secondary" id="btn-delete-prod" style="color: #DC2626; border-color: #FECACA; width: 100%;">
            <span>🗑️ Hapus Barang Ini</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-close-edit-stock')?.addEventListener('click', () => (modalContainer.innerHTML = ''));

    const inputVal = document.getElementById('input-stock-val');
    document.getElementById('btn-stock-dec')?.addEventListener('click', () => {
      let val = parseInt(inputVal.value, 10) || 0;
      if (val > 0) val--;
      inputVal.value = val;
    });

    document.getElementById('btn-stock-inc')?.addEventListener('click', () => {
      let val = parseInt(inputVal.value, 10) || 0;
      val++;
      inputVal.value = val;
    });

    const editSellInput = document.getElementById('input-edit-sell');
    editSellInput?.addEventListener('input', (e) => {
      const num = parseRupiahInput(e.target.value);
      e.target.value = num ? formatRupiah(num) : '';
    });

    const editCostInput = document.getElementById('input-edit-cost');
    editCostInput?.addEventListener('input', (e) => {
      const num = parseRupiahInput(e.target.value);
      e.target.value = num ? formatRupiah(num) : '';
    });

    document.getElementById('btn-save-stock-update')?.addEventListener('click', () => {
      const updatedStock = Math.max(0, parseInt(inputVal.value, 10) || 0);
      const updatedSell = parseRupiahInput(editSellInput?.value) || product.sellingPrice;
      const updatedCost = parseRupiahInput(editCostInput?.value) || 0;

      store.updateProduct(productId, {
        stock: updatedStock,
        sellingPrice: updatedSell,
        costPrice: updatedCost
      });
      modalContainer.innerHTML = '';
      renderView();
      showToast('Barang berhasil diperbarui 😊');
    });

    document.getElementById('btn-delete-prod')?.addEventListener('click', () => {
      if (confirm(`Hapus barang "${product.name}" dari daftar jualan warung, Bu/Pak?`)) {
        store.deleteProduct(productId);
        modalContainer.innerHTML = '';
        renderView();
        showToast(`Barang ${product.name} berhasil dihapus`);
      }
    });
  }

  renderView();
}
