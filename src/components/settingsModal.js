// Settings and Accessibility Modal for WARUNG OS
import { store } from '../data/store.js';
import { showToast } from '../utils/toast.js';

export function openSettingsModal(onUpdate) {
  const modalContainer = document.getElementById('modal-container');
  const settings = store.getSettings();
  const warung = store.getWarung();

  modalContainer.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-sheet">
        <div class="modal-header">
          <div class="modal-title">Pengaturan Warung ⚙️</div>
          <button class="modal-close-btn" id="btn-close-settings">✕</button>
        </div>

        <!-- Font Size Accessibility -->
        <div style="margin-bottom: 20px;">
          <label class="input-money-label" style="font-size: 1.05rem; margin-bottom: 8px;">
            Ukuran Tulisan Layar (Agar Mudah Dibaca):
          </label>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
            <button type="button" class="btn-cash-quick btn-font-option ${settings.fontSize === 'normal' ? 'selected' : ''}" data-size="normal" style="padding: 10px 4px;">
              <span style="font-size: 0.95rem; font-weight: 800;">Biasa</span>
            </button>
            <button type="button" class="btn-cash-quick btn-font-option ${settings.fontSize === 'large' ? 'selected' : ''}" data-size="large" style="padding: 10px 4px;">
              <span style="font-size: 1.15rem; font-weight: 800;">Besar</span>
            </button>
            <button type="button" class="btn-cash-quick btn-font-option ${settings.fontSize === 'xlarge' ? 'selected' : ''}" data-size="xlarge" style="padding: 10px 4px;">
              <span style="font-size: 1.35rem; font-weight: 900;">Sangat Besar</span>
            </button>
          </div>
        </div>

        <!-- Warung Info Edit -->
        <div class="input-money-container">
          <label class="input-money-label" for="input-edit-warung-name">Nama Warung Saat Ini:</label>
          <input 
            type="text" 
            id="input-edit-warung-name" 
            class="input-money-box" 
            value="${warung.name || 'Warung Bu Siti'}" 
          />
        </div>

        <!-- Demo Data Actions -->
        <div style="background: var(--color-bg-app); border: 2px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 20px;">
          <h4 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 6px;">Contoh Warung & Bantuan</h4>
          <p style="font-size: 0.88rem; color: var(--color-text-muted); margin-bottom: 12px; font-weight: 600;">
            Ingin melihat warung dengan contoh yang sudah ramai, atau ingin mulai kosong dari nol?
          </p>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn-small btn-secondary" id="btn-load-demo-data" style="font-weight: 800; border-color: var(--color-primary); min-height: 44px;">
              ✨ Muat Ulang Contoh Warung Bu Siti
            </button>
            <button class="btn-small btn-secondary" id="btn-clear-all-data" style="font-weight: 800; color: #DC2626; border-color: #FECACA; min-height: 44px;">
              🗑️ Kosongkan Semua & Mulai dari Nol
            </button>
          </div>
        </div>

        <button class="btn-huge btn-primary" id="btn-save-settings">
          <span>SIMPAN PENGATURAN</span>
          <span>✅</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-close-settings')?.addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });

  // Font size selection
  modalContainer.querySelectorAll('.btn-font-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = btn.getAttribute('data-size');
      modalContainer.querySelectorAll('.btn-font-option').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      applyFontSize(size);
      store.setFontSize(size);
    });
  });

  // Load demo data
  document.getElementById('btn-load-demo-data')?.addEventListener('click', () => {
    if (confirm('Muat ulang data demo Warung Bu Siti? Transaksi dan stok akan kembali seperti contoh.')) {
      store.resetToDemo();
      modalContainer.innerHTML = '';
      showToast('Data demo Warung Bu Siti berhasil dimuat 😊');
      if (onUpdate) onUpdate();
    }
  });

  // Clear data
  document.getElementById('btn-clear-all-data')?.addEventListener('click', () => {
    if (confirm('Yakin ingin mengosongkan semua data? Semua barang, jualan, dan utang akan dihapus.')) {
      store.clearAll();
      modalContainer.innerHTML = '';
      showToast('Semua data berhasil dibersihkan');
      if (onUpdate) onUpdate();
    }
  });

  // Save changes
  document.getElementById('btn-save-settings')?.addEventListener('click', () => {
    const newName = document.getElementById('input-edit-warung-name')?.value.trim();
    if (newName) {
      store.updateWarung(newName, warung.category);
    }
    modalContainer.innerHTML = '';
    showToast('Pengaturan disimpan 😊');
    if (onUpdate) onUpdate();
  });
}

export function applyFontSize(size) {
  document.body.classList.remove('font-large', 'font-xlarge');
  if (size === 'large') {
    document.body.classList.add('font-large');
  } else if (size === 'xlarge') {
    document.body.classList.add('font-xlarge');
  }
}
