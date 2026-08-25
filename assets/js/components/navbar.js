/**
 * VYNTA LOYALTY ? Navigation, Role & Logout Header
 */
import { authService } from '../services/authService.js';
import { businessService } from '../services/businessService.js';
import { Roles } from '../db/schema.js';
import { toast } from './toast.js';

export function renderNavbar(currentPath = '') {
  const session = authService.getSession();
  const businesses = businessService.getAll();
  const activeBiz = businesses.find(b => b.id === session?.business_id) || businesses[0];

  const path = currentPath || window.location.hash || '#/vynta/dashboard';
  const isVynta = path.startsWith('#/vynta');
  const isAdmin = path.startsWith('#/admin');
  const isStaff = path.startsWith('#/staff');
  const isCustomer = path.startsWith('#/c/') || path.startsWith('#/join');
  const isSuperAdmin = session?.role === Roles.SUPER_ADMIN;

  const header = document.createElement('header');
  header.className = 'w-full bg-[#0E1017]/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between';

  header.innerHTML = `
    <!-- Brand / Active Business Indicator -->
    <div class="flex items-center gap-2.5 sm:gap-3">
      <!-- Mobile / Tablet Hamburger Menu Button -->
      ${session ? `
        <button type="button" id="btn-mobile-sidebar-toggle" aria-label="Abrir Menú de Navegación" class="lg:hidden p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-sky-500/40 text-zinc-300 hover:text-white transition flex items-center justify-center cursor-pointer shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      ` : ''}

      <a href="${isSuperAdmin ? '#/vynta/dashboard' : '#/admin/dashboard'}" class="flex items-center gap-2.5 group">
        <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 shadow-lg border border-white/20 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
          <img src="./assets/img/logo.png" alt="VYNTA Logo" class="w-full h-full object-contain" />
        </div>
        <div class="hidden sm:block">
          <span class="text-base font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">VYNTA</span>
          <span class="text-[9px] block text-sky-400 font-extrabold uppercase tracking-widest leading-none">LOYALTY</span>
        </div>
      </a>

      <!-- ON/OFF Day-Night Theme Switch (Between Logo and Business Dropdown) -->
      <div class="flex items-center pl-2 sm:pl-3 border-l border-zinc-800" title="Cambiar a Modo D\u00EDa / Noche">
        <button type="button" id="btn-theme-toggle" aria-label="Cambiar Modo D\u00EDa/Noche" class="group relative inline-flex items-center h-7 w-[52px] rounded-full p-0.5 transition-all duration-300 focus:outline-none cursor-pointer select-none bg-zinc-900 border border-zinc-700 hover:border-sky-500/50 shadow-inner">
          <span class="sr-only">Modo D\u00EDa/Noche</span>
          <div class="w-full flex items-center justify-between px-1.5 pointer-events-none text-[10px] leading-none select-none">
            <span>\uD83C\uDF19</span>
            <span>\u2600\uFE0F</span>
          </div>
          <span id="theme-toggle-knob" class="absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 ease-in-out flex items-center justify-center bg-gradient-to-tr from-sky-400 to-indigo-500 text-white"></span>
        </button>
      </div>

      ${isSuperAdmin ? `
        <div class="relative flex items-center pl-2.5 sm:pl-3 border-l border-zinc-800">
          <div class="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 rounded-xl px-3 py-1.5 transition">
            <span class="w-2 h-2 rounded-full ${businesses.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}"></span>
            <select id="tenant-select" class="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-2">
              ${businesses.length > 0 ? businesses.map(b => `
                <option value="${b.id}" ${b.id === activeBiz?.id ? 'selected' : ''} class="bg-zinc-900 text-white">
                  ${b.name} (${b.status === 'active' ? 'Activo' : 'Pausado'})
                </option>
              `).join('') : `
                <option value="" class="bg-zinc-900 text-zinc-400">Sin comercios creados</option>
              `}
            </select>
          </div>
        </div>
      ` : (session && activeBiz ? `
        <div class="hidden sm:flex items-center gap-2 pl-2.5 sm:pl-3 border-l border-zinc-800">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span class="text-xs font-bold text-white">${activeBiz.name}</span>
        </div>
      ` : '')}
    </div>

    <!-- Center Navigation Tabs -->
    <div class="hidden md:flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-white/5 text-xs">
      ${isSuperAdmin ? `
        <a href="#/vynta/dashboard" class="px-3.5 py-1.5 rounded-lg font-medium transition ${
          isVynta 
            ? 'bg-sky-500 text-black font-extrabold shadow-md' 
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
        }">
          Super Admin
        </a>
      ` : ''}
      <a href="#/admin/dashboard" class="px-3.5 py-1.5 rounded-lg font-medium transition ${
        isAdmin 
          ? 'bg-sky-500 text-black font-extrabold shadow-md' 
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
      }">
        Panel Negocio
      </a>
      <a href="#/staff/scanner" class="px-3.5 py-1.5 rounded-lg font-medium transition ${
        isStaff 
          ? 'bg-sky-500 text-black font-extrabold shadow-md' 
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
      }">
        Esc\u00E1ner Staff
      </a>
    </div>

    <!-- Right Controls: Profile & Logout -->
    <div class="flex items-center gap-3">
      <!-- Live Cloud Sync Indicator -->
      <div title="Sincronizaci\u00F3n en la Nube Activa" class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-[10px] font-bold text-sky-400">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Nube Activa</span>
      </div>

      <a href="#/staff/scanner" class="hidden sm:flex items-center gap-1.5 ${
        isStaff ? 'bg-sky-400 text-black font-extrabold' : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white'
      } px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg transition transform hover:scale-[1.02]">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
        Esc\u00E1ner
      </a>

      ${session ? `
        <div class="hidden lg:flex flex-col text-right">
          <span class="text-xs font-bold text-white leading-tight">${session.name}</span>
          <span class="text-[9px] font-mono text-sky-400 font-bold uppercase">${session.role}</span>
        </div>
        <button id="btn-logout" title="Cerrar Sesi\u00F3n" class="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 text-xs font-bold transition flex items-center gap-1.5">
          <span>\u21A9</span> Salir
        </button>
      ` : `
        <a href="#/login" class="px-3.5 py-1.5 rounded-xl bg-sky-500 text-black font-bold text-xs shadow-lg transition">
          Iniciar Sesi\u00F3n
        </a>
      `}
    </div>
  `;

  const tenantSelect = header.querySelector('#tenant-select');
  if (tenantSelect) {
    tenantSelect.addEventListener('change', (e) => {
      authService.setBusinessContext(e.target.value);
      toast.success(`Cambiado al contexto de: ${tenantSelect.options[tenantSelect.selectedIndex].text.trim()}`);
      window.location.reload();
    });
  }

  const btnMobileToggle = header.querySelector('#btn-mobile-sidebar-toggle');
  if (btnMobileToggle) {
    btnMobileToggle.addEventListener('click', () => {
      const drawer = document.getElementById('mobile-sidebar-drawer');
      if (drawer) {
        drawer.classList.remove('hidden');
        drawer.classList.add('flex');
      }
    });
  }

  // --- THEME (DAY / NIGHT) TOGGLE HANDLER ---
  const btnThemeToggle = header.querySelector('#btn-theme-toggle');
  const knob = header.querySelector('#theme-toggle-knob');

  function updateThemeUI(isLight) {
    if (!btnThemeToggle || !knob) return;
    if (isLight) {
      btnThemeToggle.className = 'group relative inline-flex items-center h-7 w-[52px] rounded-full p-0.5 transition-all duration-300 focus:outline-none cursor-pointer select-none bg-amber-100 border border-amber-300 hover:border-amber-400 shadow-inner';
      knob.style.transform = 'translateX(24px)';
      knob.className = 'absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 ease-in-out flex items-center justify-center bg-gradient-to-tr from-amber-400 to-amber-500 text-white';
    } else {
      btnThemeToggle.className = 'group relative inline-flex items-center h-7 w-[52px] rounded-full p-0.5 transition-all duration-300 focus:outline-none cursor-pointer select-none bg-zinc-900 border border-zinc-700 hover:border-sky-500/50 shadow-inner';
      knob.style.transform = 'translateX(0px)';
      knob.className = 'absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 ease-in-out flex items-center justify-center bg-gradient-to-tr from-sky-400 to-indigo-500 text-white';
    }
  }

  const isCurrentLight = document.documentElement.classList.contains('light') || (localStorage.getItem('vynta_theme') === 'light');
  updateThemeUI(isCurrentLight);

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const isNowLight = document.documentElement.classList.contains('light');
      if (isNowLight) {
        // Switch to Dark (Noche)
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        localStorage.setItem('vynta_theme', 'dark');
        updateThemeUI(false);
        toast.success('\uD83C\uDF19 Modo Noche activado');
      } else {
        // Switch to Light (Día)
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        localStorage.setItem('vynta_theme', 'light');
        updateThemeUI(true);
        toast.success('\u2600\uFE0F Modo D\u00EDa activado');
      }
    });
  }

  return header;
}