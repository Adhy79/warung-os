// WARUNG OS V1 - Main Entry & Controller
import { store } from './data/store.js';
import { renderOnboarding } from './components/onboarding.js';
import { renderBeranda } from './components/beranda.js';
import { renderJualan } from './components/jualan.js';
import { renderBarang } from './components/barang.js';
import { renderUang } from './components/uang.js';
import { renderNgutang } from './components/ngutang.js';
import { renderNgomong } from './components/ngomong.js';
import { renderTanya } from './components/tanya.js';
import { openSettingsModal, applyFontSize } from './components/settingsModal.js';
import { showToast } from './utils/toast.js';

let activeTab = 'beranda';

function updateHeader() {
  const warung = store.getWarung();
  const nameEl = document.getElementById('header-shop-name');
  const greetingEl = document.getElementById('header-greeting');

  if (nameEl) {
    nameEl.textContent = (warung.name || 'WARUNG BU SITI').toUpperCase();
  }

  if (greetingEl) {
    const hour = new Date().getHours();
    let text = 'Selamat pagi 😊';
    if (hour >= 11 && hour < 15) text = 'Selamat siang 😊';
    else if (hour >= 15 && hour < 18) text = 'Selamat sore 😊';
    else if (hour >= 18) text = 'Selamat malam 😊';
    greetingEl.textContent = text;
  }
}

function switchTab(tabName) {
  activeTab = tabName;

  // Update nav buttons
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach((btn) => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Hide all sections
  const sections = document.querySelectorAll('.view-section');
  sections.forEach((sec) => sec.classList.remove('active'));

  // Show target section and render
  const activeSec = document.getElementById(`view-${tabName}`);
  if (activeSec) {
    activeSec.classList.add('active');
    renderActiveTabContent(tabName, activeSec);
  }

  // Scroll to top of view container
  const viewContent = document.getElementById('view-content');
  if (viewContent) viewContent.scrollTop = 0;
}

function renderActiveTabContent(tabName, container) {
  switch (tabName) {
    case 'beranda':
      renderBeranda(container, switchTab);
      break;
    case 'jualan':
      renderJualan(container, switchTab);
      break;
    case 'barang':
      renderBarang(container);
      break;
    case 'uang':
      renderUang(container);
      break;
    case 'ngutang':
      renderNgutang(container);
      break;
    case 'ngomong':
    case 'tanya':
      renderNgomong(container);
      break;
    default:
      renderBeranda(container, switchTab);
  }
}

function setupNavigation() {
  // Bottom Navigation Click
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Header Aa quick font size toggle
  const btnFont = document.getElementById('btn-font-size');
  btnFont?.addEventListener('click', () => {
    const settings = store.getSettings();
    const current = settings.fontSize || 'normal';
    let next = 'large';
    let label = 'Besar';

    let tip = '';

    if (current === 'normal') {
      next = 'large';
      label = 'Besar';
      tip = 'Ukuran tulisan: BESAR 😊 (Ketuk lagi untuk makin besar)';
    } else if (current === 'large') {
      next = 'xlarge';
      label = 'Sangat Besar';
      tip = 'Ukuran tulisan: SANGAT BESAR 😊 (Paling besar & jelas)';
    } else {
      next = 'normal';
      label = 'Biasa';
      tip = 'Ukuran tulisan kembali ke: BIASA 😊';
    }

    store.setFontSize(next);
    applyFontSize(next);
    showToast(tip);
  });

  // Header 🤖 Tanya Quick Button
  const btnTanyaHeader = document.getElementById('btn-quick-tanya');
  btnTanyaHeader?.addEventListener('click', () => {
    switchTab('tanya');
  });

  // Header Settings Button
  const btnSettings = document.getElementById('btn-settings');
  btnSettings?.addEventListener('click', () => {
    openSettingsModal(() => {
      updateHeader();
      switchTab(activeTab);
    });
  });

  // Clicking brand goes to Beranda
  const brandClick = document.getElementById('header-brand-click');
  brandClick?.addEventListener('click', () => {
    switchTab('beranda');
  });
}

function checkOnboardingAndInit() {
  const data = store.load();
  const settings = store.getSettings();

  // Apply saved font size scale
  if (settings.fontSize) {
    applyFontSize(settings.fontSize);
  }

  updateHeader();

  const onboardingContainer = document.getElementById('onboarding-container');

  if (!data.isOnboarded) {
    renderOnboarding(onboardingContainer, () => {
      updateHeader();
      switchTab('beranda');
    });
  } else {
    onboardingContainer?.classList.add('hidden');
    switchTab('beranda');
  }

  // Subscribe to store updates to keep views synchronized
  store.subscribe(() => {
    updateHeader();
  });
}

// Boot the application
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  checkOnboardingAndInit();
});
