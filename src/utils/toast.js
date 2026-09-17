// Simple, friendly toast feedback for Warung OS
let toastTimer = null;

export function showToast(message, type = 'success', duration = 2800) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  if (toastTimer) {
    clearTimeout(toastTimer);
    container.innerHTML = '';
  }

  const toast = document.createElement('div');
  toast.className = `toast-bubble ${type === 'error' ? 'toast-error' : 'toast-success'}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  toastTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => {
      container.innerHTML = '';
    }, 250);
  }, duration);
}
