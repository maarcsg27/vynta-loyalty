/**
 * VYNTA LOYALTY ? Unified Authentication Gateway (Admin, Staff & Customer)
 */
import { authService } from '../services/authService.js';
import { businessService } from '../services/businessService.js';
import { customerService } from '../services/customerService.js';
import { Roles } from '../db/schema.js';
import { toast } from '../components/toast.js';

export function renderLoginView() {
  const container = document.createElement('div');
  container.className = 'min-h-screen bg-[#08090E] text-white flex flex-col items-center justify-center p-4 selection:bg-sky-500 selection:text-black';

  const businesses = businessService.getAll();

  container.innerHTML = `
    <div class="w-full max-w-md space-y-6">
      
      <!-- Brand Header -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white p-2.5 shadow-2xl shadow-sky-500/20 mb-2 border border-white/40 overflow-hidden">
          <img src="./assets/img/logo.png" alt="VYNTA Logo" class="w-full h-full object-contain" />
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight text-white">VYNTA Loyalty</h1>
        <p class="text-xs text-zinc-400">Plataforma SaaS Multi-Tenant de Fidelizaci\u00F3n Digital</p>
      </div>

      <!-- Main Login Container Card -->
      <div class="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        
        <!-- Tabs Selector -->
        <div class="grid grid-cols-2 gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 text-xs">
          <button type="button" id="tab-btn-admin" class="py-2.5 rounded-xl font-bold transition bg-sky-500 text-black shadow-md">
            \u25A3 Admin
          </button>
          <button type="button" id="tab-btn-staff" class="py-2.5 rounded-xl font-bold transition text-zinc-400 hover:text-white">
            \u25EB Staff PIN
          </button>
        </div>

        <!-- TAB 1: ADMIN LOGIN (Super Admin & Business Owners) -->
        <div id="tab-content-admin" class="space-y-4">
          <form id="form-admin-login" class="space-y-3.5">
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Correo Electr\u00F3nico</label>
              <input type="email" id="input-admin-email" value="admin@vynta.com" required placeholder="admin@vynta.com" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500">
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="block text-[11px] font-semibold text-zinc-400">Contrase\u00F1a</label>
                <span class="text-[10px] text-zinc-500">Super Admin: admin123</span>
              </div>
              <input type="password" id="input-admin-pass" value="admin123" required placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500">
            </div>

            <button type="submit" class="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition transform hover:scale-[1.01]">
              Iniciar Sesi\u00F3n
            </button>
          </form>

          <!-- Quick 1-Click Super Admin Access -->
          <div class="pt-3 border-t border-zinc-800/80 space-y-2">
            <span class="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Acceso R\u00E1pido Oficial</span>
            <button type="button" data-demo-role="SUPER_ADMIN" class="btn-quick-demo w-full p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 hover:border-sky-500 text-left transition text-xs flex items-center justify-between group">
              <div>
                <span class="block font-bold text-sky-400 group-hover:text-sky-300 transition">\u25A6 Entrar como Super Admin</span>
                <span class="text-[10px] text-zinc-500">admin@vynta.com \u2022 Control Total de Comercios</span>
              </div>
              <span class="text-sky-400 font-bold text-sm group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </div>
        </div>

        <!-- TAB 2: STAFF QUICK PIN LOGIN -->
        <div id="tab-content-staff" class="space-y-4 hidden">
          <form id="form-staff-pin" class="space-y-3.5">
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Correo o Nombre del Comercio *</label>
              <input type="text" id="input-staff-biz" required placeholder="Ej: contacto@minegocio.com o Mi Negocio" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500">
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="block text-[11px] font-semibold text-zinc-400">PIN del Personal</label>
                <span class="text-[10px] text-zinc-500 font-mono">Por defecto: 1234</span>
              </div>
              <input type="password" id="input-staff-pin" maxlength="6" value="1234" required placeholder="1234" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono tracking-widest text-sky-400 placeholder-zinc-600 focus:outline-none focus:border-sky-500">
            </div>

            <button type="submit" class="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2">
              <span>\u25EB</span> Abrir Terminal de Esc\u00E1ner
            </button>
          </form>

          <div class="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 text-center">
            Dise\u00F1ado para camareros y dependientes en caja desde sus m\u00F3viles para otorgar sellos r\u00E1pidamente.
          </div>
        </div>

      </div>

      <!-- Footer Info -->
      <div class="text-center text-[11px] text-zinc-500">
        VYNTA Loyalty SaaS Platform \u2022 Aislamiento Seguro Multi-Tenant
      </div>
    </div>
  `;

  // Tab switching logic
  const tabAdmin = container.querySelector('#tab-btn-admin');
  const tabStaff = container.querySelector('#tab-btn-staff');

  const contentAdmin = container.querySelector('#tab-content-admin');
  const contentStaff = container.querySelector('#tab-content-staff');

  function setTab(activeTab) {
    [tabAdmin, tabStaff].forEach(t => {
      t.className = 'py-2.5 rounded-xl font-bold transition text-zinc-400 hover:text-white';
    });
    [contentAdmin, contentStaff].forEach(c => c.classList.add('hidden'));

    if (activeTab === 'admin') {
      tabAdmin.className = 'py-2.5 rounded-xl font-bold transition bg-sky-500 text-black shadow-md';
      contentAdmin.classList.remove('hidden');
    } else if (activeTab === 'staff') {
      tabStaff.className = 'py-2.5 rounded-xl font-bold transition bg-sky-500 text-black shadow-md';
      contentStaff.classList.remove('hidden');
    }
  }

  tabAdmin.addEventListener('click', () => setTab('admin'));
  tabStaff.addEventListener('click', () => setTab('staff'));

  // Form Admin Login
  container.querySelector('#form-admin-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = container.querySelector('#input-admin-email').value;
    const pass = container.querySelector('#input-admin-pass').value;

    try {
      const session = authService.login(email, pass);
      toast.success(`\u00A1Bienvenido, ${session.name}!`);
      if (session.role === Roles.SUPER_ADMIN) {
        window.location.hash = '#/vynta/dashboard';
      } else {
        window.location.hash = '#/admin/dashboard';
      }
    } catch (err) {
      toast.error(err.message);
    }
  });

  // Quick Demo Buttons
  container.querySelectorAll('.btn-quick-demo').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.demoRole;
      const bizId = btn.dataset.demoBiz;
      authService.quickDemoLogin(role, bizId);
      toast.success(`Accediendo como: ${role}`);
      if (role === Roles.SUPER_ADMIN) {
        window.location.hash = '#/vynta/dashboard';
      } else {
        window.location.hash = '#/admin/dashboard';
      }
    });
  });

  // Form Staff PIN Login
  container.querySelector('#form-staff-pin').addEventListener('submit', (e) => {
    e.preventDefault();
    const inputBiz = container.querySelector('#input-staff-biz');
    const bizIdentifier = inputBiz ? inputBiz.value.trim() : '';
    if (!bizIdentifier) {
      toast.warning('Por favor escribe el correo o nombre de tu comercio.');
      return;
    }
    const pin = container.querySelector('#input-staff-pin').value;

    try {
      authService.loginWithPin(bizIdentifier, pin);
      toast.success('Terminal de esc\u00E1ner autorizada');
      window.location.hash = '#/staff/scanner';
    } catch (err) {
      toast.error(err.message);
    }
  });

  return container;
}