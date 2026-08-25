/**
 * VYNTA LOYALTY ? Business Admin Sidebar with Plan Entitlements
 */
import { authService } from '../services/authService.js';
import { businessService } from '../services/businessService.js';
import { planService } from '../services/planService.js';
import { Roles } from '../db/schema.js';

export function renderSidebar(activeTab = 'dashboard') {
  const session = authService.getSession();
  const isSuperAdmin = session?.role === Roles.SUPER_ADMIN;
  const businessId = session?.business_id;
  const business = businessId ? businessService.getById(businessId) : businessService.getAll()[0];
  const plan = planService.getBusinessPlan(business?.id);
  const isBasic = plan.id === 'BASIC';

  const wrapper = document.createDocumentFragment();

  const menuItems = isSuperAdmin ? [
    { id: 'vynta_dashboard', label: 'Panel Global VYNTA', icon: '▦', path: '#/vynta/dashboard' },
    { id: 'vynta_businesses', label: 'Negocios Registrados', icon: '▣', path: '#/vynta/businesses' },
    { id: 'vynta_activity', label: 'Auditoría Global', icon: '≡', path: '#/vynta/activity' },
    { id: 'divider', isDivider: true, label: 'Panel del Negocio Activo' },
    { id: 'dashboard', label: 'Inicio del Negocio', icon: '▥', path: '#/admin/dashboard' },
    { id: 'customers', label: 'Clientes y Tarjetas', icon: '☺', path: '#/admin/customers' },
    { id: 'my_cards', label: 'Mis Tarjetas', icon: '💳', path: '#/admin/my-cards' },
    { id: 'card_builder', label: 'Personalizar Tarjeta', icon: '✎', path: '#/admin/card-builder' },
    { id: 'rewards', label: 'Recompensas', icon: '★', path: '#/admin/rewards' },
    { id: 'single_use', label: 'Campañas', icon: '✨', path: '#/admin/single-use', isPro: true },
    { id: 'staff', label: 'Equipo y Personal', icon: '⚙', path: '#/admin/staff' },
    { id: 'analytics', label: 'Analíticas y Estadísticas', icon: '◴', path: '#/admin/analytics' },
    { id: 'activity', label: 'Historial de Actividad', icon: '≡', path: '#/admin/activity' },
    { id: 'plan', label: 'Mi Plan & Suscripción', icon: '⭐', path: '#/admin/plan' },
    { id: 'settings', label: 'Configuración', icon: '⚙', path: '#/admin/settings' }
  ] : [
    { id: 'dashboard', label: 'Inicio', icon: '▥', path: '#/admin/dashboard' },
    { id: 'customers', label: 'Clientes y Tarjetas', icon: '☺', path: '#/admin/customers' },
    { id: 'my_cards', label: 'Mis Tarjetas', icon: '💳', path: '#/admin/my-cards' },
    { id: 'card_builder', label: 'Personalizar Tarjeta', icon: '✎', path: '#/admin/card-builder' },
    { id: 'rewards', label: 'Recompensas', icon: '★', path: '#/admin/rewards' },
    { id: 'single_use', label: 'Campañas', icon: '✨', path: '#/admin/single-use', isPro: true },
    { id: 'scanner', label: 'Escáner QR', icon: '◫', path: '#/staff/scanner' },
    { id: 'staff', label: 'Equipo y Personal', icon: '⚙', path: '#/admin/staff' },
    { id: 'analytics', label: 'Analíticas y Estadísticas', icon: '◴', path: '#/admin/analytics' },
    { id: 'activity', label: 'Historial de Actividad', icon: '≡', path: '#/admin/activity' },
    { id: 'plan', label: 'Mi Plan & Suscripción', icon: '⭐', path: '#/admin/plan' },
    { id: 'settings', label: 'Configuración', icon: '⚙', path: '#/admin/settings' }
  ];

  function getSidebarMenuHTML() {
    return `
      <div class="space-y-3 flex-1 overflow-y-auto pr-1">
        <!-- Active Business Plan Badge -->
        ${business ? `
          <div class="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex items-center justify-between">
            <div class="min-w-0">
              <span class="text-[9px] uppercase font-extrabold text-zinc-500 block tracking-wider">Plan Activo</span>
              <span class="text-xs font-black text-white truncate block">${plan.name}</span>
            </div>
            <span class="px-2 py-0.5 rounded-lg text-[9px] font-extrabold font-mono border ${plan.badgeClass}">
              ${plan.name}
            </span>
          </div>
        ` : ''}

        <div class="space-y-1">
          ${menuItems.map(item => {
            if (item.isDivider) {
              return `<div class="pt-3 pb-1 px-3 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">${item.label}</div>`;
            }
            const isActive = activeTab === item.id;
            return `
              <a href="${item.path}" class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive 
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm font-bold' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }">
                <div class="flex items-center gap-3">
                  <span class="text-sm leading-none font-bold ${isActive ? 'text-sky-400' : 'text-zinc-500'}">${item.icon}</span>
                  <span>${item.label}</span>
                </div>
                ${item.isPro && isBasic ? `
                  <span class="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">PRO</span>
                ` : ''}
              </a>
            `;
          }).join('')}
        </div>
      </div>

      <div class="pt-4 border-t border-zinc-800/80 space-y-2">
        <a href="#/staff/scanner" class="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-sky-950/50 to-indigo-950/50 border border-sky-500/20 hover:border-sky-500/40 transition group">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 text-sm font-bold">◫</div>
            <div>
              <p class="text-xs font-bold text-white group-hover:text-sky-300 transition">Modo Escáner</p>
              <p class="text-[10px] text-zinc-400">Lectura rápida</p>
            </div>
          </div>
          <span class="text-xs text-sky-400">&rarr;</span>
        </a>

        <button class="btn-action-logout w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition cursor-pointer">
          <span>↵</span> Cerrar Sesión
        </button>
      </div>
    `;
  }

  // 1. DESKTOP SIDEBAR (Static on PC, hidden on mobile)
  const desktopSidebar = document.createElement('aside');
  desktopSidebar.className = 'w-64 bg-[#0E1017] border-r border-white/5 hidden lg:flex flex-col shrink-0 min-h-[calc(100vh-61px)] p-4 justify-between sticky top-[61px] h-[calc(100vh-61px)]';
  desktopSidebar.innerHTML = getSidebarMenuHTML();
  wrapper.appendChild(desktopSidebar);

  // 2. MOBILE & TABLET SLIDE-OVER DRAWER (hidden by default)
  const mobileDrawer = document.createElement('div');
  mobileDrawer.id = 'mobile-sidebar-drawer';
  mobileDrawer.className = 'fixed inset-0 z-50 lg:hidden hidden items-stretch';
  mobileDrawer.innerHTML = `
    <!-- Dark Backdrop -->
    <div id="mobile-sidebar-backdrop" class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"></div>

    <!-- Drawer Panel -->
    <div class="relative w-72 max-w-[85vw] bg-[#0E1017] border-r border-white/10 h-full p-4 flex flex-col justify-between shadow-2xl z-10">
      <div class="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 shadow">
            <img src="./assets/img/logo.png" alt="VYNTA" class="w-full h-full object-contain" />
          </div>
          <span class="font-extrabold text-sm text-white">VYNTA Menú</span>
        </div>
        <button type="button" id="btn-close-mobile-sidebar" class="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 text-xs font-bold cursor-pointer">
          ✕
        </button>
      </div>

      ${getSidebarMenuHTML()}
    </div>
  `;
  wrapper.appendChild(mobileDrawer);

  // Event handlers to close drawer
  function closeDrawer() {
    mobileDrawer.classList.add('hidden');
    mobileDrawer.classList.remove('flex');
  }

  const backdrop = mobileDrawer.querySelector('#mobile-sidebar-backdrop');
  const btnClose = mobileDrawer.querySelector('#btn-close-mobile-sidebar');

  if (backdrop) backdrop.addEventListener('click', closeDrawer);
  if (btnClose) btnClose.addEventListener('click', closeDrawer);

  mobileDrawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Logout buttons
  wrapper.querySelectorAll('.btn-action-logout').forEach(btn => {
    btn.addEventListener('click', () => {
      authService.logout();
    });
  });

  return wrapper;
}