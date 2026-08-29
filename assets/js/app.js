/**
 * VYNTA LOYALTY ? Main Application Router, Route Guards & Live Multi-Device Sync
 */
import { authService } from './services/authService.js';
import { db } from './db/storage.js';
import { syncService } from './services/syncService.js';
import { Roles } from './db/schema.js';
import { renderNavbar } from './components/navbar.js';
import { renderLoginView } from './views/loginView.js';
import { renderClientJoinView } from './views/clientJoinView.js';
import { renderVyntaAdminView } from './views/vyntaAdminView.js';
import { renderBusinessAdminView } from './views/businessAdminView.js';
import { renderStaffScannerView } from './views/staffScannerView.js';
import { renderCustomerPortalView } from './views/customerPortalView.js';

class AppRouter {
  constructor() {
    this.appRoot = document.getElementById('app') || document.body;
    
    // Initialize Theme (Modo Día / Noche)
    const savedTheme = localStorage.getItem('vynta_theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }

    // Initialize real-time cross-device cloud sync safely
    try {
      syncService.init();
    } catch (e) {
      console.warn('SyncService init error:', e);
    }

    window.addEventListener('hashchange', () => {
      try { syncService.pullFromCloud(); } catch(e) {}
      this.handleRoute();
    });

    window.addEventListener('focus', () => {
      try {
        syncService.pullFromCloud();
        syncService.fetchRecentEvents();
      } catch (e) {}
      const hash = window.location.hash || '';
      if (hash.startsWith('#/admin') || hash.startsWith('#/vynta') || hash === '#/login') {
        this.handleRoute();
      }
    });

    db.subscribe('change', () => {
      const hash = window.location.hash || '';
      if (hash.startsWith('#/admin') || hash.startsWith('#/vynta') || hash === '#/login') {
        this.handleRoute();
      }
    });

    // Execute route immediately so app renders right away!
    this.handleRoute();
  }

  handleRoute() {
    try {
      if (!this.appRoot) {
        this.appRoot = document.getElementById('app') || document.body;
      }
      const hash = window.location.hash || '#/login';
      this.appRoot.innerHTML = '';

      // Public Route 1: Customer Card View (#/c/:token)
      if (hash.startsWith('#/c/')) {
        const token = hash.replace('#/c/', '').split('?')[0];
        const customerView = renderCustomerPortalView(token);
        this.appRoot.appendChild(customerView);
        return;
      }

      // Public Route 2: Customer Self-Registration & Onboarding (#/join/:business_id)
      if (hash.startsWith('#/join/')) {
        const bizId = hash.replace('#/join/', '').split('?')[0];
        const joinView = renderClientJoinView(bizId);
        this.appRoot.appendChild(joinView);
        return;
      }

      // Public Route 3: Login Gateway View (#/login)
      if (hash === '#/login' || hash === '' || hash === '#/') {
        if (authService.isAuthenticated()) {
          const session = authService.getSession();
          if (session.role === Roles.SUPER_ADMIN) {
            window.location.hash = '#/vynta/dashboard';
            return;
          } else if (session.role === Roles.STAFF) {
            window.location.hash = '#/staff/scanner';
            return;
          } else {
            window.location.hash = '#/admin/dashboard';
            return;
          }
        }
        const loginView = renderLoginView();
        this.appRoot.appendChild(loginView);
        return;
      }

      // Protected Route: Staff Scanner
      if (hash.startsWith('#/staff')) {
        if (!authService.isAuthenticated()) {
          window.location.hash = '#/login';
          return;
        }
        const navbar = renderNavbar(hash);
        this.appRoot.appendChild(navbar);
        const staffView = renderStaffScannerView();
        this.appRoot.appendChild(staffView);
        return;
      }

      // Protected Route: Super Admin
      if (hash.startsWith('#/vynta')) {
        if (!authService.isAuthenticated()) {
          window.location.hash = '#/login';
          return;
        }
        const navbar = renderNavbar(hash);
        this.appRoot.appendChild(navbar);
        const vyntaView = renderVyntaAdminView();
        this.appRoot.appendChild(vyntaView);
        return;
      }

      // Protected Route: Business Admin
      if (hash.startsWith('#/admin')) {
        if (!authService.isAuthenticated()) {
          window.location.hash = '#/login';
          return;
        }
        const navbar = renderNavbar(hash);
        this.appRoot.appendChild(navbar);

        let subTab = 'dashboard';
        if (hash.includes('/customers')) subTab = 'customers';
        else if (hash.includes('/my-cards')) subTab = 'my_cards';
        else if (hash.includes('/card-builder')) subTab = 'card_builder';
        else if (hash.includes('/rewards')) subTab = 'rewards';
        else if (hash.includes('/single-use')) subTab = 'single_use';
        else if (hash.includes('/coupons')) subTab = 'coupons';
        else if (hash.includes('/staff')) subTab = 'staff';
        else if (hash.includes('/analytics')) subTab = 'analytics';
        else if (hash.includes('/activity')) subTab = 'activity';
        else if (hash.includes('/plan')) subTab = 'plan';
        else if (hash.includes('/settings')) subTab = 'settings';

        const bizView = renderBusinessAdminView(subTab);
        this.appRoot.appendChild(bizView);
        return;
      }

      // Fallback: Login
      window.location.hash = '#/login';
    } catch (err) {
      console.error('VYNTA AppRouter Error:', err);
      this.appRoot.innerHTML = `
        <div class="min-h-screen bg-[#090A0F] text-white flex flex-col items-center justify-center p-6 text-center">
          <div class="glass-panel max-w-md w-full p-6 sm:p-8 rounded-3xl border border-rose-500/30 space-y-4 shadow-2xl">
            <div class="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto text-2xl font-bold">
              !
            </div>
            <h2 class="text-lg font-bold text-white">Optimizando la interfaz...</h2>
            <p class="text-xs text-zinc-300">
              Se ha detectado una versión anterior en caché. Pulsa el botón de abajo para sincronizar al instante con la última versión.
            </p>
            <div class="space-y-2 pt-2">
              <button onclick="localStorage.clear(); window.location.hash='#/admin/dashboard'; window.location.reload();" class="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-lg transition">
                Recargar y Actualizar
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }
}

// Clean any existing Service Worker registrations to prevent caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let r of registrations) {
      r.unregister();
    }
  }).catch(() => {});
}

new AppRouter();