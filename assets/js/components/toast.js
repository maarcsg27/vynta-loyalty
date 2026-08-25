/**
 * VYNTA LOYALTY ? Toast & Confetti System
 */

export const toast = {
  show(message, type = 'success', duration = 3500) {
    let container = document.getElementById('vynta-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vynta-toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none';
      document.body.appendChild(container);
    }

    const toastEl = document.createElement('div');
    const isSuccess = type === 'success';
    const isError = type === 'error';

    const bgClass = isSuccess 
      ? 'bg-zinc-900 border-emerald-500/50 text-emerald-300' 
      : isError 
        ? 'bg-zinc-900 border-rose-500/50 text-rose-300' 
        : 'bg-zinc-900 border-amber-500/50 text-amber-300';

    const icon = isSuccess 
      ? '\u2714' 
      : isError 
        ? '\u2716' 
        : 'i';

    toastEl.className = `flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-lg transform transition-all duration-300 translate-y-4 opacity-0 pointer-events-auto ${bgClass}`;
    toastEl.innerHTML = `
      <span class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs bg-white/10 shrink-0">${icon}</span>
      <p class="text-xs font-medium text-white flex-1">${message}</p>
    `;

    container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.classList.remove('translate-y-4', 'opacity-0');
      toastEl.classList.add('translate-y-0', 'opacity-100');
    }, 10);

    setTimeout(() => {
      toastEl.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => toastEl.remove(), 300);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error', 4500); },
  warning(msg) { this.show(msg, 'warning'); },

  fireConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }
};