/**
 * VYNTA LOYALTY ? Super Admin (VYNTA Platform) View
 */
import { businessService } from '../services/businessService.js';
import { analyticsService } from '../services/analyticsService.js';
import { auditService } from '../services/auditService.js';
import { authService } from '../services/authService.js';
import { Roles } from '../db/schema.js';
import { toast } from '../components/toast.js';
import { renderNavbar } from '../components/navbar.js';

export function renderVyntaAdminView() {
  const container = document.createElement('div');
  container.className = 'max-w-7xl mx-auto p-4 lg:p-8 space-y-8';

  const stats = analyticsService.getGlobalStats();
  const session = authService.getSession();
  const globalLogs = auditService.getAll(30);

  container.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-sky-500/10 text-sky-400 border border-sky-500/20">
            VYNTA CORE \u2022 SUPER ADMIN
          </span>
        </div>
        <h1 class="text-2xl lg:text-3xl font-extrabold text-white mt-1.5 tracking-tight">Panel Central Multi-Tenant</h1>
        <p class="text-xs text-zinc-400">Control global de todos los comercios, tarjetas emitidas y volumen de fidelizaci\u00F3n.</p>
      </div>

      <div class="flex items-center gap-3">
        <button id="btn-open-create-biz" class="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg transition transform hover:scale-[1.02] flex items-center gap-2">
          <span class="text-sm font-black">+</span> Crear Nuevo Negocio
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-5 rounded-3xl space-y-1">
        <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Negocios Activos</span>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl lg:text-3xl font-extrabold text-white">${stats.activeBusinesses}</span>
          <span class="text-[10px] text-zinc-500 font-semibold">/ ${stats.totalBusinesses} total</span>
        </div>
        <p class="text-[10px] text-emerald-400 font-semibold">100% operativos</p>
      </div>

      <div class="glass-panel p-5 rounded-3xl space-y-1">
        <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Clientes Registrados</span>
        <span class="text-2xl lg:text-3xl font-extrabold text-sky-400">${stats.totalCustomers}</span>
        <p class="text-[10px] text-zinc-400 font-semibold">${stats.totalCards} tarjetas activas</p>
      </div>

      <div class="glass-panel p-5 rounded-3xl space-y-1">
        <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Sellos Entregados</span>
        <span class="text-2xl lg:text-3xl font-extrabold text-amber-400">${stats.totalStamps}</span>
        <p class="text-[10px] text-emerald-400 font-semibold">&uarr; En crecimiento</p>
      </div>

      <div class="glass-panel p-5 rounded-3xl space-y-1">
        <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Recompensas Canjeadas</span>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl lg:text-3xl font-extrabold text-emerald-400">${stats.totalRedemptions}</span>
          <span class="text-[10px] text-zinc-500 font-semibold">(${stats.completedCards} listas)</span>
        </div>
        <p class="text-[10px] text-sky-400 font-semibold">Retenci\u00F3n: ${stats.retentionRate}%</p>
      </div>
    </div>

    <div class="glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
      <div class="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span>\u25A3</span> Comercios Registrados en VYNTA
          </h2>
          <p class="text-xs text-zinc-400">Espacios independientes con aislamiento de datos y fidelizaci\u00F3n personalizada.</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-zinc-300">
          <thead class="bg-zinc-900/80 text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
            <tr>
              <th class="px-5 py-3 font-bold">Comercio</th>
              <th class="px-4 py-3 font-bold">Plan</th>
              <th class="px-4 py-3 font-bold">Clientes</th>
              <th class="px-4 py-3 font-bold">Sellos</th>
              <th class="px-4 py-3 font-bold">Canjes</th>
              <th class="px-4 py-3 font-bold">Estado</th>
              <th class="px-5 py-3 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800/60" id="biz-table-body">
            ${stats.businessesData.length > 0 ? stats.businessesData.map(b => `
              <tr class="hover:bg-zinc-900/40 transition">
                <td class="px-5 py-4 flex items-center gap-3">
                  <img src="${b.logo_url}" alt="${b.name}" class="w-9 h-9 rounded-xl object-cover border border-white/10">
                  <div>
                    <span class="font-bold text-white block">${b.name}</span>
                    <span class="text-[10px] text-zinc-500">${b.email} \u2022 ${b.address || 'Sin direcci\u00F3n'}</span>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <span class="px-2.5 py-1 rounded-lg text-[10px] font-mono font-black ${
                    b.plan === 'PRO' 
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' 
                      : b.plan === 'ENTERPRISE' 
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' 
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }">
                    ${b.plan || 'BASIC'}
                  </span>
                </td>
                <td class="px-4 py-4 font-bold text-white">${b.customerCount}</td>
                <td class="px-4 py-4 font-bold text-amber-400">${b.stampCount}</td>
                <td class="px-4 py-4 font-bold text-emerald-400">${b.redemptionCount}</td>
                <td class="px-4 py-4">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    b.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }">
                    ${b.status === 'active' ? 'Activo' : 'Suspendido'}
                  </span>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <button data-edit-biz="${b.id}" class="btn-edit-biz px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-zinc-500 font-bold transition flex items-center gap-1.5 text-[11px]" title="Editar informaci\u00F3n del negocio">
                      <span>\u270E</span> Editar
                    </button>
                    <button data-switch-biz="${b.id}" class="btn-switch-biz px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold transition flex items-center gap-1 text-[11px]">
                      Entrar &rarr;
                    </button>
                  </div>
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="7" class="px-6 py-12 text-center text-zinc-500">
                  <span class="text-3xl block mb-2">\uD83C\uDFE2</span>
                  <p class="text-sm font-semibold text-zinc-300">No hay comercios registrados todav\u00EDa</p>
                  <p class="text-xs text-zinc-500 mt-1">Haz clic en "+ Crear Nuevo Negocio" arriba para registrar tu primer comercio.</p>
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>

    <div class="glass-panel p-5 rounded-3xl space-y-4">
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div class="flex items-center gap-2.5">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <span>\u2261</span> Actividad Global de Todos los Comercios
          </h3>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            En Directo
          </span>
        </div>
        <span class="text-[10px] text-zinc-500 font-mono">Multi-Dispositivo Global</span>
      </div>

      <div class="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        ${globalLogs.length > 0 ? globalLogs.map(log => `
          <div class="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-xs hover:border-zinc-700 transition">
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full ${log.action.includes('STAMP') ? 'bg-sky-400' : log.action.includes('REDEEM') ? 'bg-emerald-400' : log.action.includes('EMAIL') ? 'bg-indigo-400' : 'bg-amber-400'}"></span>
              <div>
                <p class="font-medium text-white">${log.description}</p>
                <p class="text-[10px] text-zinc-500">Por: <strong class="text-zinc-400">${log.user_name}</strong> \u2022 ${new Date(log.created_at).toLocaleString('es-ES')}</p>
              </div>
            </div>
            <span class="font-mono text-[9px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">${log.business_id || 'PLATAFORMA'}</span>
          </div>
        `).join('') : `
          <div class="p-6 text-center text-zinc-500 text-xs">
            No hay actividades registradas todav\u00EDa.
          </div>
        `}
      </div>
    </div>

    <!-- Modal: Crear Negocio -->
    <div id="modal-create-biz" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden items-center justify-center p-4">
      <div class="bg-[#12141C] border border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <span>\u2728</span> Registrar Nuevo Negocio
          </h3>
          <button id="btn-close-modal-biz" class="text-zinc-400 hover:text-white text-lg font-bold">&times;</button>
        </div>

        <form id="form-create-biz" class="space-y-4">
          <div>
            <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Nombre Comercial *</label>
            <input type="text" name="name" required placeholder="Ej: Pizzer\u00EDa Bella Napoli" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Email de Contacto *</label>
              <input type="email" name="email" required placeholder="contacto@negocio.com" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Tel\u00E9fono</label>
              <input type="tel" name="phone" placeholder="+34 600 000 000" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">CIF / NIF</label>
              <input type="text" name="tax_id" placeholder="B-12345678" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Plan VYNTA</label>
              <select name="plan" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none">
                <option value="BASIC">BASIC (1 Local)</option>
                <option value="PRO" selected>PRO (Multi-Staff + Cupones)</option>
                <option value="ENTERPRISE">ENTERPRISE (Custom)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Contrase\u00F1a Due\u00F1o (Login)</label>
              <input type="password" name="password" value="admin123" placeholder="admin123" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">PIN del Personal (Staff)</label>
              <input type="password" name="staff_pin" maxlength="6" value="1234" placeholder="1234" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Direcci\u00F3n F\u00EDsica</label>
            <input type="text" name="address" placeholder="Calle Ejemplo 12, Ciudad" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
          </div>

          <div class="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-300 flex items-center gap-2">
            <span>\u2709</span>
            <span>Las credenciales se enviar\u00E1n autom\u00E1ticamente al correo de contacto especificado.</span>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button type="button" id="btn-cancel-modal-biz" class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800">Cancelar</button>
            <button type="submit" class="px-4 py-2 rounded-xl text-xs font-bold text-black bg-sky-500 hover:bg-sky-400 shadow-lg">Crear y Enviar Accesos</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Editar Negocio -->
    <div id="modal-edit-biz" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden items-center justify-center p-4">
      <div class="bg-[#12141C] border border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <span>\u270E</span> Editar Informaci\u00F3n del Negocio
          </h3>
          <button id="btn-close-modal-edit-biz" class="text-zinc-400 hover:text-white text-lg font-bold">&times;</button>
        </div>

        <form id="form-edit-biz" class="space-y-4">
          <input type="hidden" name="id" id="edit-biz-id">

          <div>
            <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Nombre Comercial *</label>
            <input type="text" name="name" id="edit-biz-name" required placeholder="Ej: Pizzer\u00EDa Bella Napoli" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Email de Contacto *</label>
              <input type="email" name="email" id="edit-biz-email" required placeholder="contacto@negocio.com" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Tel\u00E9fono</label>
              <input type="tel" name="phone" id="edit-biz-phone" placeholder="+34 600 000 000" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">CIF / NIF</label>
              <input type="text" name="tax_id" id="edit-biz-tax-id" placeholder="B-12345678" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Plan VYNTA</label>
              <select name="plan" id="edit-biz-plan" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none">
                <option value="BASIC">BASIC (1 Local)</option>
                <option value="PRO">PRO (Multi-Staff + Cupones)</option>
                <option value="ENTERPRISE">ENTERPRISE (Custom)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Estado del Comercio</label>
              <select name="status" id="edit-biz-status" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none">
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">PIN del Personal (Staff)</label>
              <input type="password" name="staff_pin" id="edit-biz-pin" maxlength="6" placeholder="1234" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500">
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Direcci\u00F3n F\u00EDsica</label>
            <input type="text" name="address" id="edit-biz-address" placeholder="Calle Ejemplo 12, Ciudad" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-zinc-800">
            <button type="button" id="btn-delete-modal-edit-biz" class="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer">
              <span>\uD83D\uDDD1</span> Eliminar Negocio
            </button>
            <div class="flex gap-2">
              <button type="button" id="btn-cancel-modal-edit-biz" class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800">Cancelar</button>
              <button type="submit" class="px-4 py-2 rounded-xl text-xs font-bold text-black bg-sky-500 hover:bg-sky-400 shadow-lg">Guardar Cambios</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  // Create Business Modal Logic
  const modalCreate = container.querySelector('#modal-create-biz');
  const btnOpenModal = container.querySelector('#btn-open-create-biz');
  const btnCloseModal = container.querySelector('#btn-close-modal-biz');
  const btnCancelModal = container.querySelector('#btn-cancel-modal-biz');
  const formCreate = container.querySelector('#form-create-biz');

  btnOpenModal.addEventListener('click', () => {
    modalCreate.classList.remove('hidden');
    modalCreate.classList.add('flex');
  });

  const closeModalCreate = () => {
    modalCreate.classList.add('hidden');
    modalCreate.classList.remove('flex');
  };

  btnCloseModal.addEventListener('click', closeModalCreate);
  btnCancelModal.addEventListener('click', closeModalCreate);

  formCreate.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(formCreate);
    const newBizData = Object.fromEntries(formData.entries());

    try {
      const created = businessService.create(newBizData, session);
      toast.fireConfetti();
      toast.success(`\u00A1Negocio "${created.name}" registrado con \u00E9xito!`);
      closeModalCreate();
      
      authService.setRole(Roles.BUSINESS_OWNER, created.id);
      setTimeout(() => {
        window.location.hash = '#/admin/dashboard';
      }, 400);
    } catch (err) {
      toast.error(err.message || 'Error creando negocio');
    }
  });

  // Edit Business Modal Logic
  const modalEdit = container.querySelector('#modal-edit-biz');
  const btnCloseEditModal = container.querySelector('#btn-close-modal-edit-biz');
  const btnCancelEditModal = container.querySelector('#btn-cancel-modal-edit-biz');
  const btnDeleteEditModal = container.querySelector('#btn-delete-modal-edit-biz');
  const formEdit = container.querySelector('#form-edit-biz');

  const closeModalEdit = () => {
    modalEdit.classList.add('hidden');
    modalEdit.classList.remove('flex');
  };

  btnCloseEditModal.addEventListener('click', closeModalEdit);
  btnCancelEditModal.addEventListener('click', closeModalEdit);

  container.querySelectorAll('.btn-edit-biz').forEach(btn => {
    btn.addEventListener('click', () => {
      const bizId = btn.dataset.editBiz;
      const biz = businessService.getById(bizId);
      if (!biz) {
        toast.error('Negocio no encontrado');
        return;
      }

      formEdit.querySelector('#edit-biz-id').value = biz.id;
      formEdit.querySelector('#edit-biz-name').value = biz.name || '';
      formEdit.querySelector('#edit-biz-email').value = biz.email || '';
      formEdit.querySelector('#edit-biz-phone').value = biz.phone || '';
      formEdit.querySelector('#edit-biz-tax-id').value = biz.tax_id || '';
      formEdit.querySelector('#edit-biz-plan').value = biz.plan || 'PRO';
      formEdit.querySelector('#edit-biz-status').value = biz.status || 'active';
      formEdit.querySelector('#edit-biz-pin').value = biz.settings?.staff_pin || '1234';
      formEdit.querySelector('#edit-biz-address').value = biz.address || '';

      modalEdit.classList.remove('hidden');
      modalEdit.classList.add('flex');
    });
  });

  btnDeleteEditModal.addEventListener('click', () => {
    const bizId = formEdit.querySelector('#edit-biz-id').value;
    const biz = businessService.getById(bizId);
    if (!biz) return;

    if (confirm(`\u00BFEst\u00E1s seguro de que deseas eliminar definitivamente "${biz.name}"? Se borrar\u00E1n todas sus tarjetas, clientes y configuraciones.`)) {
      try {
        businessService.delete(bizId, session);
        toast.success(`Negocio "${biz.name}" eliminado con \u00E9xito.`);
        closeModalEdit();

        // Refresh view to reflect changes
        const appRoot = document.getElementById('app');
        if (appRoot) {
          appRoot.innerHTML = '';
          const navbar = renderNavbar('#/vynta/dashboard');
          appRoot.appendChild(navbar);
          appRoot.appendChild(renderVyntaAdminView());
        }
      } catch (err) {
        toast.error(err.message || 'Error al eliminar el negocio');
      }
    }
  });

  formEdit.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(formEdit);
    const updatedData = Object.fromEntries(formData.entries());
    const bizId = updatedData.id;

    try {
      const currentBiz = businessService.getById(bizId);
      if (!currentBiz) throw new Error('Negocio no encontrado');

      const updates = {
        name: updatedData.name,
        email: updatedData.email,
        phone: updatedData.phone || '',
        tax_id: updatedData.tax_id || '',
        plan: updatedData.plan,
        status: updatedData.status,
        address: updatedData.address || '',
        settings: {
          ...currentBiz.settings,
          staff_pin: updatedData.staff_pin || '1234'
        }
      };

      const result = businessService.update(bizId, updates, session);
      toast.success(`\u00A1Informaci\u00F3n de "${result.name}" actualizada con \u00E9xito!`);
      closeModalEdit();

      // Refresh view to reflect changes
      const appRoot = document.getElementById('app');
      if (appRoot) {
        appRoot.innerHTML = '';
        const navbar = renderNavbar('#/vynta/dashboard');
        appRoot.appendChild(navbar);
        appRoot.appendChild(renderVyntaAdminView());
      }
    } catch (err) {
      toast.error(err.message || 'Error al actualizar el negocio');
    }
  });

  container.querySelectorAll('.btn-switch-biz').forEach(btn => {
    btn.addEventListener('click', () => {
      const bizId = btn.dataset.switchBiz;
      const targetBiz = businessService.getById(bizId);
      authService.setRole(Roles.BUSINESS_OWNER, bizId);
      toast.success(`Accediendo al panel de: ${targetBiz ? targetBiz.name : 'Negocio'}`);
      setTimeout(() => {
        window.location.hash = '#/admin/dashboard';
      }, 300);
    });
  });

  return container;
}