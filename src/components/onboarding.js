// Onboarding flow for WARUNG OS
import { store } from '../data/store.js';
import { showToast } from '../utils/toast.js';

export function renderOnboarding(container, onComplete) {
  let step = 1; // 1: Welcome, 2: Nama Warung, 3: Kategori, 4: Selesai
  let warungName = 'Warung Bu Siti';
  let selectedCategory = '🛒 Sembako';

  function render() {
    container.innerHTML = '';
    container.classList.remove('hidden');

    const wrapper = document.createElement('div');
    wrapper.className = 'onboarding-screen';

    if (step === 1) {
      wrapper.innerHTML = `
        <div class="onboarding-logo">🏪</div>
        <h1 class="onboarding-title">WARUNG OS</h1>
        <p class="onboarding-tagline">Warung jadi lebih gampang 😊</p>
        
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 24px;">
          <button class="btn-huge btn-primary" id="btn-onboard-start">
            <span>MULAI WARUNG SAYA</span>
            <span>➡️</span>
          </button>
          
          <button class="btn-huge btn-secondary" id="btn-onboard-demo" style="font-size: 1.1rem; border-color: #FED7AA; background: #FFFBF7;">
            <span>✨ Coba Contoh Warung (Sudah Ada Isinya)</span>
          </button>
        </div>
      `;
    } else if (step === 2) {
      wrapper.innerHTML = `
        <div class="onboarding-step-card">
          <span style="font-size: 0.95rem; font-weight: 800; color: var(--color-primary); display: block; margin-bottom: 8px;">Pertanyaan 1 dari 2</span>
          <h2 class="onboarding-input-label">Yuk kenalan dengan warungmu 😊</h2>
          <label style="font-size: 1.05rem; font-weight: 700; color: var(--color-text-muted); display: block; margin-bottom: 8px;">Nama warung kamu apa?</label>
          <input 
            type="text" 
            id="input-warung-name" 
            class="input-money-box" 
            value="${warungName}" 
            placeholder="Contoh: Warung Bu Siti" 
            autofocus 
          />
        </div>

        <button class="btn-huge btn-primary" id="btn-onboard-next2">
          <span>Lanjut</span>
          <span>➡️</span>
        </button>
      `;
    } else if (step === 3) {
      const categories = [
        { emoji: '🍜', label: 'Makanan' },
        { emoji: '🥤', label: 'Minuman' },
        { emoji: '🛒', label: 'Sembako' },
        { emoji: '🧺', label: 'Campuran' },
        { emoji: '✏️', label: 'Lainnya' }
      ];

      wrapper.innerHTML = `
        <div class="onboarding-step-card">
          <span style="font-size: 0.95rem; font-weight: 800; color: var(--color-primary); display: block; margin-bottom: 8px;">Pertanyaan 2 dari 2</span>
          <h2 class="onboarding-input-label">Warung kamu biasanya jual apa?</h2>
          <div class="onboarding-category-grid" id="cat-grid">
            ${categories
              .map(
                (c) => `
              <button type="button" class="category-choice-btn ${selectedCategory.includes(c.label) ? 'selected' : ''}" data-cat="${c.emoji} ${c.label}">
                <span style="font-size: 2rem;">${c.emoji}</span>
                <span>${c.label}</span>
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <button class="btn-huge btn-primary" id="btn-onboard-finish">
          <span>Selesai 😊</span>
        </button>
      `;
    } else if (step === 4) {
      wrapper.innerHTML = `
        <div class="onboarding-logo">🎉</div>
        <h2 class="onboarding-title" style="font-size: 1.8rem; margin-bottom: 8px;">Siap!</h2>
        <p class="onboarding-tagline" style="font-size: 1.2rem; margin-bottom: 28px;">
          Warung kamu <strong>${warungName}</strong> sudah siap digunakan 😊
        </p>

        <button class="btn-huge btn-success" id="btn-onboard-enter">
          <span>MASUK WARUNG</span>
          <span>🚪</span>
        </button>
      `;
    }

    container.appendChild(wrapper);
    bindEvents();
  }

  function bindEvents() {
    if (step === 1) {
      document.getElementById('btn-onboard-start')?.addEventListener('click', () => {
        step = 2;
        render();
      });

      document.getElementById('btn-onboard-demo')?.addEventListener('click', () => {
        store.resetToDemo();
        store.setOnboarded(true);
        container.classList.add('hidden');
        showToast('Selamat datang di Warung Bu Siti 😊');
        if (onComplete) onComplete();
      });
    } else if (step === 2) {
      const input = document.getElementById('input-warung-name');
      document.getElementById('btn-onboard-next2')?.addEventListener('click', () => {
        const val = input ? input.value.trim() : '';
        if (!val) {
          showToast('Nama warung diisi dulu ya Bu/Pak 😊', 'error');
          return;
        }
        warungName = val;
        step = 3;
        render();
      });
    } else if (step === 3) {
      const catBtns = container.querySelectorAll('.category-choice-btn');
      catBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          catBtns.forEach((b) => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedCategory = btn.getAttribute('data-cat');
        });
      });

      document.getElementById('btn-onboard-finish')?.addEventListener('click', () => {
        store.updateWarung(warungName, selectedCategory);
        step = 4;
        render();
      });
    } else if (step === 4) {
      document.getElementById('btn-onboard-enter')?.addEventListener('click', () => {
        store.setOnboarded(true);
        container.classList.add('hidden');
        showToast(`Selamat berjualan di ${warungName}! 😊`);
        if (onComplete) onComplete();
      });
    }
  }

  render();
}
