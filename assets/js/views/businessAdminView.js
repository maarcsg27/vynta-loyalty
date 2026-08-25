/**
 * VYNTA LOYALTY ? Business Admin & Owner View
 */
import { businessService } from '../services/businessService.js';
import { customerService } from '../services/customerService.js';
import { loyaltyService } from '../services/loyaltyService.js';
import { rewardService } from '../services/rewardService.js';
import { couponService } from '../services/couponService.js';
import { singleUseService } from '../services/singleUseService.js';
import { planService, Features } from '../services/planService.js';
import { analyticsService } from '../services/analyticsService.js';
import { auditService } from '../services/auditService.js';
import { authService } from '../services/authService.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderCardBuilder } from '../components/cardBuilder.js';
import { renderLoyaltyCardHTML, renderAppleWalletPassHTML, renderGoogleWalletPassHTML, initQRCode } from '../components/loyaltyCard.js';
import { walletService } from '../services/walletService.js';
import { SingleUseStatus } from '../db/schema.js';
import { toast } from '../components/toast.js';

export function renderBusinessAdminView(activeTab = 'dashboard') {
  const session = authService.getSession();
  const businessId = session?.business_id;
  const business = (businessId ? businessService.getById(businessId) : null) || businessService.getAll()[0] || null;

  if (!business) {
    const emptyContainer = document.createElement('div');
    emptyContainer.className = 'max-w-xl mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh] text-center';
    emptyContainer.innerHTML = `
      <div class="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-4 w-full">
        <span class="text-4xl block">\uD83C\uDFE2</span>
        <h2 class="text-lg font-bold text-white">No tienes ning\u00FAn comercio activo</h2>
        <p class="text-xs text-zinc-400">Accede al Panel Super Admin para registrar tu primer comercio y gestionar tarjetas de fidelizaci\u00F3n.</p>
        <a href="#/vynta/dashboard" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-lg transition">
          <span>+</span> Ir al Panel Super Admin
        </a>
      </div>
    `;
    return emptyContainer;
  }

  const program = loyaltyService.getProgram(business.id);
  const stats = analyticsService.getBusinessStats(business.id);
  const customers = customerService.getAll(business.id);
  const rewards = rewardService.getAll(business.id);
  const coupons = couponService.getAll(business.id);
  const logs = auditService.getByBusiness(business.id, 25);

  const joinUrl = `${window.location.origin}${window.location.pathname}#/join/${business.id}`;

  const container = document.createElement('div');
  container.className = 'flex flex-col lg:flex-row min-h-[calc(100vh-61px)]';

  const sidebarEl = renderSidebar(activeTab);
  container.appendChild(sidebarEl);

  const mainContent = document.createElement('main');
  mainContent.className = activeTab === 'card_builder'
    ? 'flex-1 p-3 sm:p-4 lg:px-6 lg:py-3.5 max-w-7xl w-full mx-auto lg:h-[calc(100vh-61px)] flex flex-col min-w-0 overflow-y-auto lg:overflow-hidden'
    : 'flex-1 p-4 lg:p-6 xl:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto min-w-0';

  if (activeTab === 'card_builder') {
    mainContent.appendChild(renderCardBuilder(business.id));
  } else if (activeTab === 'customers') {
    mainContent.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 class="text-xl font-bold text-white flex items-center gap-2">
            <span>\u263A</span> Clientes y Tarjetas de Fidelizaci\u00F3n
          </h1>
          <p class="text-xs text-zinc-400 mt-1">Gestiona los clientes registrados en ${business.name}, sus sellos actuales y sus pases.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="btn-open-qr-banner" class="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sky-400 font-bold text-xs border border-sky-500/30 transition flex items-center gap-1.5">
            <span>\u25EB</span> QR de Captaci\u00F3n
          </button>
          <button id="btn-add-customer" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-lg transition flex items-center gap-1.5">
            <span>+</span> A\u00F1adir Cliente Manual
          </button>
        </div>
      </div>

      <div class="glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-zinc-300">
            <thead class="bg-zinc-900/80 text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th class="px-5 py-3 font-bold">Cliente</th>
                <th class="px-4 py-3 font-bold">Contacto</th>
                <th class="px-4 py-3 font-bold">Tarjeta #</th>
                <th class="px-4 py-3 font-bold">Sellos</th>
                <th class="px-4 py-3 font-bold">Estado</th>
                <th class="px-5 py-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/60">
              ${customers.map(c => {
                const card = customerService.getCardByCustomerId(business.id, c.id);
                const maxStamps = program ? program.stamps_required : 10;
                const stamps = card ? card.stamps_count : 0;
                const isReady = stamps >= maxStamps;

                return `
                  <tr class="hover:bg-zinc-900/40 transition">
                    <td class="px-5 py-4 font-bold text-white flex items-center gap-2">
                      <span class="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-black">
                        ${c.first_name.charAt(0)}
                      </span>
                      <span>${c.first_name} ${c.last_name || ''}</span>
                    </td>
                    <td class="px-4 py-4 text-zinc-400">
                      <div>${c.email}</div>
                      <div class="text-[10px] text-zinc-500">${c.phone}</div>
                    </td>
                    <td class="px-4 py-4 font-mono font-bold text-white">${card?.card_number || 'N/A'}</td>
                    <td class="px-4 py-4">
                      <span class="font-extrabold ${isReady ? 'text-emerald-400 font-mono text-sm' : 'text-sky-400 font-mono'}">
                        ${stamps} / ${maxStamps}
                      </span>
                    </td>
                    <td class="px-4 py-4">
                      ${isReady ? `
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Recompensa Lista
                        </span>
                      ` : `
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          Activa
                        </span>
                      `}
                    </td>
                    <td class="px-5 py-4 text-right space-x-2">
                      <button data-cust-id="${c.id}" class="btn-inspect-customer-card inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-bold transition">
                        <span>\u2605</span> Ver Tarjeta / Gestionar &rarr;
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal QR Acquisition Banner -->
      <div id="modal-qr-acquisition" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden items-center justify-center p-4">
        <div class="bg-[#12141C] border border-zinc-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 text-center relative">
          <button id="btn-close-qr-modal" class="absolute top-5 right-5 text-zinc-400 hover:text-white font-black text-lg">&times;</button>
          
          <div class="flex flex-col items-center space-y-2">
            <img src="${business.logo_url}" alt="${business.name}" class="w-16 h-16 rounded-2xl object-cover border border-white/20 shadow-lg">
            <h3 class="text-lg font-black text-white">${business.name}</h3>
            <p class="text-xs text-sky-400 font-bold uppercase tracking-wider">Cartel QR para Captaci\u00F3n de Clientes</p>
          </div>

          <div class="bg-white p-4 rounded-3xl shadow-2xl inline-block mx-auto text-black">
            <div id="modal-qr-box" class="w-48 h-48 flex items-center justify-center"></div>
            <p class="text-[10px] font-mono font-bold text-zinc-800 mt-2 uppercase tracking-wider">\u00A1Escanea para unirte!</p>
          </div>

          <div class="space-y-2 text-left bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Enlace Directo de Registro</span>
            <div class="flex items-center gap-2">
              <input type="text" readonly value="${joinUrl}" class="flex-1 bg-black/40 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 font-mono select-all">
              <button id="modal-btn-copy-link" class="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs rounded-xl shadow transition">
                Copiar
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2">
            <a href="${joinUrl}" target="_blank" class="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5">
              <span>\u2197</span> Abrir Enlace
            </a>
            <button id="btn-print-qr" class="py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5">
              <span>\u2399</span> Imprimir Cartel
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Create Customer Manual -->
      <div id="modal-create-customer" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden items-center justify-center p-4">
        <div class="bg-[#12141C] border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-base font-bold text-white">\u2728 Registrar Nuevo Cliente</h3>
            <button id="btn-close-cust-modal" class="text-zinc-400 hover:text-white font-bold">&times;</button>
          </div>

          <form id="form-create-customer" class="space-y-3">
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Nombre *</label>
              <input type="text" name="first_name" required placeholder="Ej: Luc\u00EDa" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Apellidos</label>
              <input type="text" name="last_name" placeholder="Ej: Morales G\u00F3mez" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Email *</label>
              <input type="email" name="email" required placeholder="lucia@email.com" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Tel\u00E9fono M\u00F3vil *</label>
              <input type="tel" name="phone" required placeholder="+34 612 345 678" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>

            <div class="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-300">
              Se generar\u00E1 autom\u00E1ticamente una tarjeta de fidelizaci\u00F3n con c\u00F3digo QR \u00FAnico para este cliente.
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button type="button" id="btn-cancel-cust-modal" class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800">Cancelar</button>
              <button type="submit" class="px-4 py-2 rounded-xl text-xs font-bold text-black bg-sky-500 hover:bg-sky-400 shadow-lg">Crear Cliente</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Inspect Customer Loyalty Card & Manage Stamps -->
      <div id="modal-inspect-card" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden items-center justify-center p-4">
        <div class="bg-[#12141C] border border-zinc-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-5 relative max-h-[95vh] overflow-y-auto">
          <button id="btn-close-inspect-modal" class="absolute top-5 right-5 text-zinc-400 hover:text-white font-black text-xl">&times;</button>
          
          <div class="flex items-center gap-3 border-b border-zinc-800 pb-3">
            <div id="inspect-cust-avatar" class="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 font-black text-base flex items-center justify-center border border-sky-500/30">
              C
            </div>
            <div>
              <h3 id="inspect-cust-name" class="text-base font-bold text-white leading-tight">Nombre Cliente</h3>
              <p id="inspect-cust-contact" class="text-xs text-zinc-400">email@cliente.com \u2022 +34 600 000 000</p>
            </div>
          </div>

          <!-- Live Digital Card Preview -->
          <div id="inspect-card-box" class="w-full flex justify-center">
            <!-- Rendered Card dynamically -->
          </div>

          <!-- Quick Stamp & Reward Control Bar -->
          <div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-zinc-300">Gesti\u00F3n de Sellos y Recompensas</span>
              <span id="inspect-stamp-badge" class="font-mono text-xs font-extrabold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                0 / 10 sellos
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button id="inspect-btn-add-stamp" class="py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-1.5 active:scale-95">
                <span>\u2795</span> +1 Sello
              </button>
              <button id="inspect-btn-remove-stamp" class="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs border border-zinc-700 transition flex items-center justify-center gap-1.5 active:scale-95">
                <span>\u2796</span> -1 Sello
              </button>
              <button id="inspect-btn-redeem" class="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1 active:scale-95">
                <span>\u2605</span> Canjear Premio
              </button>
            </div>
          </div>

          <!-- Pass Actions: Apple / Google Wallet & Link -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button id="inspect-btn-apple-wallet" class="py-2.5 rounded-xl bg-black border border-zinc-700 hover:border-zinc-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow transition">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 170 170"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.85-12.01-14.42-6.53-9.87-11.66-21.2-15.38-33.99-3.72-12.79-5.58-24.63-5.58-35.53 0-14.11 3.51-25.56 10.53-34.34 7.02-8.78 15.71-13.28 26.07-13.5 4.69 0 10.03 1.25 16.03 3.75 6 2.5 10.08 3.81 12.24 3.94 1.77-.13 5.92-1.44 12.45-3.94 6.53-2.5 11.75-3.69 15.66-3.56 11.52.48 20.73 4.61 27.63 12.39-9.88 5.98-14.73 14.28-14.56 24.89.17 8.35 3.32 15.31 9.44 20.89 6.12 5.57 13.5 8.94 22.14 10.1-2.02 5.86-4.43 11.75-7.23 17.68zM119.22 33.15c0-6.19 2.21-12.07 6.63-17.65 4.42-5.58 9.94-9.36 16.56-11.35.21 1.28.32 2.45.32 3.51 0 6.09-2.31 12.1-6.93 18.04-4.62 5.94-10.42 9.77-17.41 11.5-.22-1.39-.33-2.61-.33-3.66l1.16-.39z"/></svg>
              Apple Wallet
            </button>
            <button id="inspect-btn-google-wallet" class="py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow transition">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
              Google Wallet
            </button>
            <a id="inspect-link-public" href="#" target="_blank" class="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sky-400 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-sky-500/20 transition">
              <span>\u2197</span> Enlace P\u00FAblico
            </a>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-zinc-800">
            <button id="inspect-btn-delete-cust" class="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1">
              <span>\u2715</span> Eliminar Cliente
            </button>
            <button id="inspect-btn-close" class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    `;

    // Setup QR modal
    const qrModal = mainContent.querySelector('#modal-qr-acquisition');
    const btnOpenQr = mainContent.querySelector('#btn-open-qr-banner');
    const btnCloseQr = mainContent.querySelector('#btn-close-qr-modal');
    const btnCopyQr = mainContent.querySelector('#modal-btn-copy-link');
    const btnPrintQr = mainContent.querySelector('#btn-print-qr');

    if (btnOpenQr && qrModal) {
      btnOpenQr.addEventListener('click', () => {
        qrModal.classList.remove('hidden');
        qrModal.classList.add('flex');
        initQRCode('modal-qr-box', joinUrl, 190, 190);
      });
    }

    if (btnCloseQr && qrModal) {
      btnCloseQr.addEventListener('click', () => {
        qrModal.classList.add('hidden');
        qrModal.classList.remove('flex');
      });
    }

    if (btnCopyQr) {
      btnCopyQr.addEventListener('click', () => {
        navigator.clipboard.writeText(joinUrl);
        toast.success('Enlace de captaci\u00F3n copiado al portapapeles.');
      });
    }

    if (btnPrintQr) {
      btnPrintQr.addEventListener('click', () => {
        const printWin = window.open('', '_blank');
        printWin.document.write(`
          <html>
            <head>
              <title>Cartel QR \u2022 ${business.name}</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; background: #fff; color: #000; }
                .card { max-width: 400px; margin: 0 auto; border: 2px solid #000; border-radius: 24px; padding: 30px; }
                img.logo { width: 80px; height: 80px; border-radius: 16px; object-fit: cover; }
                h1 { margin: 15px 0 5px 0; font-size: 26px; }
                p.sub { font-size: 14px; color: #555; margin-bottom: 20px; font-weight: bold; }
                .qr-box { margin: 20px 0; }
                .footer { font-size: 12px; color: #888; margin-top: 15px; }
              </style>
            </head>
            <body>
              <div class="card">
                <img src="${business.logo_url}" class="logo" alt="Logo">
                <h1>${business.name}</h1>
                <p class="sub">\u00A1Escanea con tu m\u00F3vil y consigue tu tarjeta de sellos gratis!</p>
                <div class="qr-box">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(joinUrl)}" width="220" height="220" alt="QR">
                </div>
                <p style="font-weight: bold; font-size: 14px;">${program?.reward_name || 'Recompensas exclusivas'}</p>
                <p class="footer">Sin descargar aplicaciones \u2022 VYNTA Loyalty</p>
              </div>
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
          </html>
        `);
        printWin.document.close();
      });
    }

    const custModal = mainContent.querySelector('#modal-create-customer');
    const btnAddCust = mainContent.querySelector('#btn-add-customer');
    const btnCloseCust = mainContent.querySelector('#btn-close-cust-modal');
    const btnCancelCust = mainContent.querySelector('#btn-cancel-cust-modal');
    const formCust = mainContent.querySelector('#form-create-customer');

    if (btnAddCust) {
      btnAddCust.addEventListener('click', () => {
        custModal.classList.remove('hidden');
        custModal.classList.add('flex');
      });
    }

    const closeCModal = () => {
      custModal.classList.add('hidden');
      custModal.classList.remove('flex');
    };

    if (btnCloseCust) btnCloseCust.addEventListener('click', closeCModal);
    if (btnCancelCust) btnCancelCust.addEventListener('click', closeCModal);

    if (formCust) {
      formCust.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(formCust);
        const custData = Object.fromEntries(formData.entries());

        try {
          const res = customerService.create(business.id, custData, session);
          toast.success(`Cliente ${res.customer.first_name} creado con tarjeta #${res.card.card_number}`);
          closeCModal();
          setTimeout(() => window.location.reload(), 400);
        } catch (err) {
          toast.error(err.message);
        }
      });
    }

    // Setup Customer Card Inspection Modal & Live Stamp Controls
    const inspectModal = mainContent.querySelector('#modal-inspect-card');
    const inspectBox = mainContent.querySelector('#inspect-card-box');
    const inspectAvatar = mainContent.querySelector('#inspect-cust-avatar');
    const inspectName = mainContent.querySelector('#inspect-cust-name');
    const inspectContact = mainContent.querySelector('#inspect-cust-contact');
    const inspectBadge = mainContent.querySelector('#inspect-stamp-badge');
    const btnAddInspectStamp = mainContent.querySelector('#inspect-btn-add-stamp');
    const btnRemoveInspectStamp = mainContent.querySelector('#inspect-btn-remove-stamp');
    const btnRedeemInspect = mainContent.querySelector('#inspect-btn-redeem');
    const btnAppleInspect = mainContent.querySelector('#inspect-btn-apple-wallet');
    const btnGoogleInspect = mainContent.querySelector('#inspect-btn-google-wallet');
    const linkPublicInspect = mainContent.querySelector('#inspect-link-public');
    const btnDeleteInspectCust = mainContent.querySelector('#inspect-btn-delete-cust');
    const btnCloseInspect = mainContent.querySelector('#btn-close-inspect-modal');
    const btnCloseInspect2 = mainContent.querySelector('#inspect-btn-close');

    let currentInspectedCustId = null;

    const renderInspectedCard = (custId) => {
      const cust = customerService.getById(business.id, custId);
      if (!cust) return;
      currentInspectedCustId = custId;
      const card = customerService.getCardByCustomerId(business.id, custId);
      const prog = loyaltyService.getProgram(business.id);
      const maxStamps = prog ? prog.stamps_required : 10;
      const currentStamps = card ? card.stamps_count : 0;

      if (inspectAvatar) inspectAvatar.textContent = cust.first_name.charAt(0);
      if (inspectName) inspectName.textContent = `${cust.first_name} ${cust.last_name || ''} (#${card?.card_number || 'N/A'})`;
      if (inspectContact) inspectContact.textContent = `${cust.email} \u2022 ${cust.phone}`;
      if (inspectBadge) inspectBadge.textContent = `${currentStamps} / ${maxStamps} sellos`;

      if (linkPublicInspect && card) {
        linkPublicInspect.href = `#/c/${card.secure_token}`;
      }

      if (inspectBox) {
        inspectBox.innerHTML = renderLoyaltyCardHTML({
          business,
          customer: cust,
          card,
          program: prog,
          showQr: true,
          containerId: 'inspect-qr-preview'
        });

        setTimeout(() => {
          if (card) {
            initQRCode('inspect-qr-preview', `${window.location.origin}${window.location.pathname}#/c/${card.secure_token}`, 110, 110);
          }
        }, 40);
      }
    };

    mainContent.querySelectorAll('.btn-inspect-customer-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const custId = btn.getAttribute('data-cust-id');
        renderInspectedCard(custId);
        if (inspectModal) {
          inspectModal.classList.remove('hidden');
          inspectModal.classList.add('flex');
        }
      });
    });

    const closeInspectModal = () => {
      if (inspectModal) {
        inspectModal.classList.add('hidden');
        inspectModal.classList.remove('flex');
      }
    };

    if (btnCloseInspect) btnCloseInspect.addEventListener('click', closeInspectModal);
    if (btnCloseInspect2) btnCloseInspect2.addEventListener('click', closeInspectModal);

    if (btnAddInspectStamp) {
      btnAddInspectStamp.addEventListener('click', () => {
        if (!currentInspectedCustId) return;
        const card = customerService.getCardByCustomerId(business.id, currentInspectedCustId);
        if (!card) return;
        try {
          const res = loyaltyService.addStamp(business.id, card.id, session, 1);
          if (res.isCompleted) {
            toast.fireConfetti();
            toast.success(`\u2728 \u00A1Tarjeta Completada! ${res.card.stamps_count} sellos alcanzados.`);
          } else {
            toast.success(`+1 Sello asignado (${res.card.stamps_count} sellos actuales)`);
          }
          renderInspectedCard(currentInspectedCustId);
        } catch (err) {
          toast.error(err.message);
        }
      });
    }

    if (btnRemoveInspectStamp) {
      btnRemoveInspectStamp.addEventListener('click', () => {
        if (!currentInspectedCustId) return;
        const card = customerService.getCardByCustomerId(business.id, currentInspectedCustId);
        if (!card) return;
        try {
          const res = loyaltyService.removeStamp(business.id, card.id, session, 1);
          toast.success(`-1 Sello retirado (${res.card.stamps_count} sellos actuales)`);
          renderInspectedCard(currentInspectedCustId);
        } catch (err) {
          toast.error(err.message);
        }
      });
    }

    if (btnRedeemInspect) {
      btnRedeemInspect.addEventListener('click', () => {
        if (!currentInspectedCustId) return;
        const card = customerService.getCardByCustomerId(business.id, currentInspectedCustId);
        if (!card) return;
        try {
          rewardService.redeem(business.id, card.id, session);
          toast.fireConfetti();
          toast.success(`\u2605 \u00A1Recompensa canjeada con \u00E9xito! Tarjeta reiniciada.`);
          renderInspectedCard(currentInspectedCustId);
        } catch (err) {
          toast.error(err.message);
        }
      });
    }

    if (btnAppleInspect) {
      btnAppleInspect.addEventListener('click', async () => {
        if (!currentInspectedCustId) return;
        const cust = customerService.getById(business.id, currentInspectedCustId);
        const card = customerService.getCardByCustomerId(business.id, currentInspectedCustId);
        const prog = (card?.loyalty_program_id ? loyaltyService.getProgram(business.id, card.loyalty_program_id) : null) || loyaltyService.getProgram(business.id);
        const origText = btnAppleInspect.innerHTML;
        btnAppleInspect.disabled = true;
        btnAppleInspect.innerHTML = `Conectando...`;
        try {
          const pass = await walletService.generatePass({ business, customer: cust, card, program: prog });
          toast.fireConfetti();
          toast.success('Pase Apple Wallet listo');
          walletService.openApplePass(pass, `${cust.first_name}-pase.pkpass`);
        } catch (err) {
          toast.error(err.message);
        } finally {
          btnAppleInspect.disabled = false;
          btnAppleInspect.innerHTML = origText;
        }
      });
    }

    if (btnGoogleInspect) {
      btnGoogleInspect.addEventListener('click', async () => {
        if (!currentInspectedCustId) return;
        const cust = customerService.getById(business.id, currentInspectedCustId);
        const card = customerService.getCardByCustomerId(business.id, currentInspectedCustId);
        const prog = (card?.loyalty_program_id ? loyaltyService.getProgram(business.id, card.loyalty_program_id) : null) || loyaltyService.getProgram(business.id);
        const origText = btnGoogleInspect.innerHTML;
        btnGoogleInspect.disabled = true;
        btnGoogleInspect.innerHTML = `Conectando...`;
        try {
          const pass = await walletService.generatePass({ business, customer: cust, card, program: prog });
          toast.fireConfetti();
          toast.success('Enlace de Google Wallet generado');
          walletService.openGooglePass(pass);
        } catch (err) {
          toast.error(err.message);
        } finally {
          btnGoogleInspect.disabled = false;
          btnGoogleInspect.innerHTML = origText;
        }
      });
    }

    if (btnDeleteInspectCust) {
      btnDeleteInspectCust.addEventListener('click', () => {
        if (!currentInspectedCustId) return;
        const cust = customerService.getById(business.id, currentInspectedCustId);
        if (confirm(`\u00BFDeseas eliminar al cliente ${cust?.first_name}?`)) {
          customerService.delete(business.id, currentInspectedCustId, session);
          toast.success('Cliente eliminado');
          closeInspectModal();
          setTimeout(() => window.location.reload(), 300);
        }
      });
    }

  } else if (activeTab === 'my_cards') {
    const allPrograms = loyaltyService.getAllPrograms(business.id) || [];
    const allSingleCards = singleUseService.getAll(business.id) || [];
    const allCoupons = couponService.getAll(business.id) || [];
    const hasAnyCards = allPrograms.length > 0 || allSingleCards.length > 0 || allCoupons.length > 0;

    mainContent.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 class="text-xl font-bold text-white flex items-center gap-2">
            <span>\uD83D\uDCB3</span> Mis Tarjetas Digitales
          </h1>
          <p class="text-xs text-zinc-400 mt-1">Gestiona, visualiza y crea todos los modelos de tarjetas de fidelizaci\u00F3n y pases activos de ${business.name}.</p>
        </div>
        <div class="flex items-center gap-2">
          <a href="#/admin/card-builder" class="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sky-400 font-bold text-xs border border-sky-500/30 transition flex items-center gap-1.5 cursor-pointer">
            <span>\u270E</span> Personalizar Dise\u00F1o
          </a>
          <button id="btn-create-new-card" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer">
            <span>+</span> Crear Nueva Tarjeta
          </button>
        </div>
      </div>

      <!-- Quick Metrics Header -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div class="glass-panel p-4 rounded-2xl border border-white/5 space-y-1">
          <span class="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Tarjetas Creadas</span>
          <p class="text-xl font-black text-white font-mono">${allPrograms.length + (allSingleCards.length > 0 ? 1 : 0) + (allCoupons.length > 0 ? 1 : 0)}</p>
        </div>
        <div class="glass-panel p-4 rounded-2xl border border-white/5 space-y-1">
          <span class="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Clientes con Tarjeta</span>
          <p class="text-xl font-black text-sky-400 font-mono">${customers.length}</p>
        </div>
        <div class="glass-panel p-4 rounded-2xl border border-white/5 space-y-1">
          <span class="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Sellos Acumulados</span>
          <p class="text-xl font-black text-amber-400 font-mono">${stats.totalStamps || stats.totalStampsGiven || 0}</p>
        </div>
        <div class="glass-panel p-4 rounded-2xl border border-white/5 space-y-1">
          <span class="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Compatibilidad Wallets</span>
          <p class="text-xs font-bold text-emerald-400 mt-1">\u2714 Apple & Google Wallet</p>
        </div>
      </div>

      <!-- Cards Catalog Section -->
      ${!hasAnyCards ? `
        <div class="glass-panel p-10 rounded-3xl border border-white/5 text-center space-y-4 max-w-md mx-auto my-6">
          <div class="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 text-3xl font-black flex items-center justify-center mx-auto border border-sky-500/20">
            \uD83D\uDCB3
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-bold text-white">Sin Tarjetas Creadas</h3>
            <p class="text-xs text-zinc-400">A\u00FAn no has creado ninguna tarjeta de fidelizaci\u00F3n o modelo digital para ${business.name}.</p>
          </div>
          <button id="btn-create-first-card" class="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-lg transition inline-flex items-center gap-2 cursor-pointer">
            <span>+</span> Crear Primera Tarjeta
          </button>
        </div>
      ` : `
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-white flex items-center gap-2">
              <span>\u25A3</span> Cat\u00E1logo de Tarjetas de ${business.name} (${allPrograms.length})
            </h2>
            <span class="text-xs text-zinc-400">Pases compatibles con iOS y Android</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${allPrograms.map(prog => {
              const isMain = !!prog.active;
              const typeThemes = {
                points: {
                  label: 'Tarjeta Cliente (Puntos)',
                  icon: '\uD83D\uDCB3',
                  containerBorder: isMain ? 'border-sky-400 shadow-2xl ring-2 ring-sky-500/40' : 'border-sky-500/30 hover:border-sky-400/80 shadow-sky-950/20',
                  headerBg: prog.branding?.bg_gradient_from ? `linear-gradient(135deg, ${prog.branding.bg_gradient_from} 0%, ${prog.branding.bg_gradient_to || '#020617'} 100%)` : 'linear-gradient(135deg, #0F172A 0%, #020617 100%)',
                  typeTextClass: 'text-sky-400',
                  typeBadgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                  metaTextClass: 'text-sky-300',
                  dotColor: 'bg-sky-400',
                  indicatorClass: 'text-sky-300',
                  statLabel: 'PUNTOS META',
                  statValClass: 'text-sky-400',
                  walletBtn: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border-sky-500/30'
                },
                stamps: {
                  label: 'Tarjeta Loyalty (Sellos)',
                  icon: '\u2B50',
                  containerBorder: isMain ? 'border-amber-400 shadow-2xl ring-2 ring-amber-500/40' : 'border-amber-500/30 hover:border-amber-400/80 shadow-amber-950/20',
                  headerBg: prog.branding?.bg_gradient_from ? `linear-gradient(135deg, ${prog.branding.bg_gradient_from} 0%, ${prog.branding.bg_gradient_to || '#0B0905'} 100%)` : 'linear-gradient(135deg, #1C160C 0%, #0B0905 100%)',
                  typeTextClass: 'text-amber-400',
                  typeBadgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                  metaTextClass: 'text-amber-300',
                  dotColor: 'bg-amber-400',
                  indicatorClass: 'text-amber-300',
                  statLabel: 'SELLOS META',
                  statValClass: 'text-amber-400',
                  walletBtn: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                },
                single_use_promo: {
                  label: 'Tarjeta Promo (1 Solo Uso)',
                  icon: '\u2728',
                  containerBorder: isMain ? 'border-emerald-400 shadow-2xl ring-2 ring-emerald-500/40' : 'border-emerald-500/30 hover:border-emerald-400/80 shadow-emerald-950/20',
                  headerBg: prog.branding?.bg_gradient_from ? `linear-gradient(135deg, ${prog.branding.bg_gradient_from} 0%, ${prog.branding.bg_gradient_to || '#02140E'} 100%)` : 'linear-gradient(135deg, #06281E 0%, #02140E 100%)',
                  typeTextClass: 'text-emerald-400',
                  typeBadgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                  metaTextClass: 'text-emerald-300',
                  dotColor: 'bg-emerald-400',
                  indicatorClass: 'text-emerald-300',
                  statLabel: 'VALIDEZ',
                  statValClass: 'text-emerald-400',
                  walletBtn: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                },
                coupon_discount: {
                  label: 'Tarjeta Cup\u00F3n (Descuento)',
                  icon: '\u22C4',
                  containerBorder: isMain ? 'border-purple-400 shadow-2xl ring-2 ring-purple-500/40' : 'border-purple-500/30 hover:border-purple-400/80 shadow-purple-950/20',
                  headerBg: prog.branding?.bg_gradient_from ? `linear-gradient(135deg, ${prog.branding.bg_gradient_from} 0%, ${prog.branding.bg_gradient_to || '#0A0518'} 100%)` : 'linear-gradient(135deg, #1E1035 0%, #0A0518 100%)',
                  typeTextClass: 'text-purple-400',
                  typeBadgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                  metaTextClass: 'text-purple-300',
                  dotColor: 'bg-purple-400',
                  indicatorClass: 'text-purple-300',
                  statLabel: 'DESCUENTO',
                  statValClass: 'text-purple-400',
                  walletBtn: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30'
                }
              };

              const theme = typeThemes[prog.card_type] || typeThemes.points;
              const cardBgStyle = `background: ${theme.headerBg};`;

              return `
                <div class="glass-panel rounded-3xl border-2 ${theme.containerBorder} overflow-hidden flex flex-col justify-between transition group">
                  <!-- Mini Card Graphic Preview Header with Distinct Color Gradient -->
                  <div class="p-5 relative text-white border-b border-white/10" style="${cardBgStyle}">
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <img src="${business.logo_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=128&auto=format&fit=crop&q=80'}" alt="logo" class="w-10 h-10 rounded-xl object-cover border border-white/20 bg-black shrink-0">
                        <div class="min-w-0">
                          <span class="text-xs font-black text-white truncate block">${business.name}</span>
                          <span class="text-[10px] font-extrabold uppercase tracking-wider block ${theme.typeTextClass}">
                            ${theme.icon} ${theme.label}
                          </span>
                        </div>
                      </div>
                      ${isMain ? `
                        <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-500 text-black shadow-md shrink-0">
                          PRINCIPAL
                        </span>
                      ` : `
                        <span class="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${theme.typeBadgeClass} shrink-0">
                          ACTIVA
                        </span>
                      `}
                    </div>

                    <div class="mt-4 space-y-1">
                      <h3 class="text-sm font-black text-white truncate">${prog.name}</h3>
                      ${prog.card_type === 'stamps' ? `
                        <p class="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                          <span>\uD83C\uDF81</span> Meta: ${prog.stamps_required || 10} sellos &rarr; ${prog.reward_name || 'Premio'}
                        </p>
                      ` : prog.card_type === 'single_use_promo' ? `
                        <p class="text-xs text-emerald-300 font-bold flex items-center gap-1.5 truncate">
                          <span>\u2728</span> Beneficio: ${prog.promo_benefit || prog.reward_name || 'Consumici\u00F3n de Bienvenida'}
                        </p>
                      ` : prog.card_type === 'coupon_discount' ? `
                        <p class="text-xs text-purple-300 font-bold flex items-center gap-1.5 truncate">
                          <span>\uD83C\uDFF7\uFE0F</span> Descuento: ${prog.discount_value !== undefined ? (prog.discount_type === 'fixed' ? `${prog.discount_value}\u20AC DTO` : `${prog.discount_value}% DTO`) : (prog.reward_name || '20% Descuento')}
                        </p>
                      ` : `
                        <p class="text-xs text-sky-300 font-bold flex items-center gap-1.5">
                          <span>\uD83C\uDF81</span> Meta: ${prog.points_required || (prog.stamps_required * 10) || 100} pts &rarr; ${prog.reward_name || 'Regalo Exclusivo'}
                        </p>
                      `}
                    </div>

                    <!-- Mini Indicator Dots / Promo / Discount / Points in Theme Color -->
                    <div class="flex items-center gap-1 mt-3 pt-2 border-t border-white/10">
                      ${prog.card_type === 'stamps' ? `
                        ${Array.from({ length: Math.min(10, prog.stamps_required || 10) }).map((_, i) => `
                          <div class="w-2 h-2 rounded-full ${i < 3 ? 'bg-amber-400 shadow-sm' : 'bg-white/20'}"></div>
                        `).join('')}
                        ${(prog.stamps_required || 10) > 10 ? `<span class="text-[9px] text-zinc-400 font-mono">+${(prog.stamps_required || 10) - 10}</span>` : ''}
                      ` : prog.card_type === 'single_use_promo' ? `
                        <span class="text-[10px] font-mono font-bold text-emerald-300 truncate">\u2728 Tarjeta de un solo uso hasta finalizaci\u00F3n de la promoci\u00F3n</span>
                      ` : prog.card_type === 'coupon_discount' ? `
                        <span class="text-[10px] font-mono font-bold text-purple-300 truncate">\uD83C\uDF9F\uFE0F Descuento directo hasta su fecha de expiraci\u00F3n</span>
                      ` : `
                        <span class="text-[10px] font-mono font-bold text-sky-300">\u25EB Acumulaci\u00F3n de Puntos en Caja</span>
                      `}
                    </div>
                  </div>

                  <!-- Card Body & Stats with Theme Accents -->
                  <div class="p-5 space-y-4 bg-zinc-950/50 flex-1 flex flex-col justify-between">
                    <div class="space-y-2 text-xs">
                      <p class="text-zinc-400 text-[11px] line-clamp-2">
                        ${prog.description || (
                          prog.card_type === 'stamps' 
                            ? 'Tarjeta de sellos. En cada visita o consumici\u00F3n se estampan sellos.' 
                            : prog.card_type === 'single_use_promo'
                            ? 'Tarjeta de un solo uso. V\u00E1lida para canjear una sola vez hasta la finalizaci\u00F3n de la promoci\u00F3n.'
                            : prog.card_type === 'coupon_discount'
                            ? 'Tarjeta de descuento. Aplica el descuento configurado en caja hasta su fecha de expiraci\u00F3n.'
                            : 'Tarjeta de puntos. El cliente acumula puntos y consulta su saldo.'
                        )}
                      </p>
                      
                      <div class="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-[11px]">
                        <div class="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                          <span class="text-[9px] uppercase font-bold text-zinc-500 block">
                            ${theme.statLabel}
                          </span>
                          <span class="font-mono font-bold ${theme.statValClass} truncate block">
                            ${prog.card_type === 'stamps' ? `${prog.stamps_required || 10} Sellos` : prog.card_type === 'single_use_promo' ? (prog.valid_until ? `Hasta ${prog.valid_until}` : '1 Solo Canje') : prog.card_type === 'coupon_discount' ? `${prog.discount_value !== undefined ? (prog.discount_type === 'fixed' ? `${prog.discount_value}\u20AC OFF` : `${prog.discount_value}% DTO`) : 'Activo'}` : `${prog.points_required || 100} PTS`}
                          </span>
                        </div>
                        <div class="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                          <span class="text-[9px] uppercase font-bold text-zinc-500 block">Clientes Asignados</span>
                          <span class="font-mono font-bold text-white">${customers.length}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="space-y-2 pt-2 border-t border-zinc-800">
                      <div class="grid grid-cols-2 gap-2">
                        <a href="#/admin/card-builder" class="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-center">
                          <span>\u270E</span> Dise\u00F1ar
                        </a>
                        <button data-preview-prog-id="${prog.id}" class="btn-preview-wallet-pass py-2 px-3 rounded-xl ${theme.walletBtn} font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                          <span>\uD83D\uDC41</span> Wallets
                        </button>
                      </div>

                      ${!isMain ? `
                        <button data-set-main-prog-id="${prog.id}" class="btn-set-main-prog w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
                          <span>\u2B50</span> Establecer como Tarjeta Principal
                        </button>
                      ` : `
                        <button data-open-join-prog="${prog.id}" class="btn-open-prog-qr w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold shadow transition flex items-center justify-center gap-1.5 cursor-pointer">
                          <span>\u25EB</span> QR de Captaci\u00F3n de Clientes
                        </button>
                      `}

                      <button data-delete-prog-id="${prog.id}" data-prog-name="${prog.name}" class="btn-delete-card w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
                        <span>\uD83D\uDDD1\uFE0F</span> Eliminar Tarjeta
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}

            <!-- Single Use Cards Banner (If applicable) -->
            ${allSingleCards.length > 0 ? `
              <div class="glass-panel rounded-3xl border border-amber-500/30 overflow-hidden flex flex-col justify-between transition hover:border-amber-500/50">
                <div class="p-5 bg-gradient-to-br from-amber-950/40 to-black text-white border-b border-white/10 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>\u2728</span> Campa\u00F1a 1 Solo Uso
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      ${allSingleCards.length} Pases
                    </span>
                  </div>
                  <h3 class="text-sm font-black text-white">Tarjetas con QR de Un Solo Uso</h3>
                  <p class="text-xs text-zinc-400">Pases de canje \u00FAnico protegidos contra duplicaci\u00F3n para promociones r\u00E1pidas.</p>
                </div>

                <div class="p-5 bg-zinc-950/40 space-y-4 flex-1 flex flex-col justify-between">
                  <div class="grid grid-cols-2 gap-2 text-[11px]">
                    <div class="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
                      <span class="text-[9px] uppercase font-bold text-zinc-500 block">Pases Disponibles</span>
                      <span class="font-mono font-bold text-emerald-400">${allSingleCards.filter(c => c.status === SingleUseStatus.ACTIVE).length}</span>
                    </div>
                    <div class="bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
                      <span class="text-[9px] uppercase font-bold text-zinc-500 block">Pases Canjeados</span>
                      <span class="font-mono font-bold text-rose-400">${allSingleCards.filter(c => c.status === SingleUseStatus.USED).length}</span>
                    </div>
                  </div>

                  <a href="#/admin/single-use" class="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 text-center">
                    <span>\u2728</span> Administrar Tarjetas 1 Solo Uso &rarr;
                  </a>
                </div>
              </div>
            ` : ''}

            <!-- Coupons Banner (If applicable) -->
            ${allCoupons.length > 0 ? `
              <div class="glass-panel rounded-3xl border border-indigo-500/30 overflow-hidden flex flex-col justify-between transition hover:border-indigo-500/50">
                <div class="p-5 bg-gradient-to-br from-indigo-950/40 to-black text-white border-b border-white/10 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>\u22C4</span> Cupones de Descuento
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      ${allCoupons.length} Activos
                    </span>
                  </div>
                  <h3 class="text-sm font-black text-white">Cupones y Descuentos Directos</h3>
                  <p class="text-xs text-zinc-400">C\u00F3digos promocionales escaneables para descuentos instant\u00E1neos.</p>
                </div>

                <div class="p-5 bg-zinc-950/40 space-y-4 flex-1 flex flex-col justify-between">
                  <a href="#/admin/coupons" class="w-full py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 text-center">
                    <span>\u22C4</span> Administrar Cupones &rarr;
                  </a>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `}

      <!-- Modal Create New Card -->
      <div id="modal-create-card" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm hidden items-center justify-center p-4">
        <div class="bg-[#12141C] border border-zinc-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>\uD83D\uDCB3</span> Crear Nueva Tarjeta de Fidelizaci\u00F3n
            </h3>
            <button id="btn-close-create-card-modal" class="text-zinc-400 hover:text-white font-bold text-lg cursor-pointer">&times;</button>
          </div>

          <form id="form-create-new-card" class="space-y-3.5">
            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Nombre de la Tarjeta *</label>
              <input type="text" name="card_name" required placeholder="Ej: Tarjeta Cliente Puntos, Tarjeta Loyalty Sellos" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Tipo de Tarjeta *</label>
              <select name="card_type" id="select-modal-create-card-type" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer">
                <option value="points" selected>\uD83D\uDCB3 Tarjeta Cliente (Puntos) \u2022 Todos los Planes</option>
                <option value="stamps">\u2B50 Tarjeta Loyalty (Sellos) \u2022 Plan PRO</option>
                <option value="single_use_promo">\u2728 Tarjeta Promo (1 Solo Uso) \u2022 Plan PRO</option>
                <option value="coupon_discount">\u22C4 Tarjeta Cup\u00F3n (Descuento Directo) \u2022 Plan PRO</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Recompensa / Premio al Completar *</label>
              <input type="text" name="reward_name" required placeholder="Ej: 10\u20AC de Descuento, 1 Men\u00FA Gratis, 20% DTO" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Meta Requerida</label>
                <select name="stamps_required" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer">
                  <option value="5">5 Sellos / 50 Pts</option>
                  <option value="8">8 Sellos / 80 Pts</option>
                  <option value="10" selected>10 Sellos / 100 Pts (Est\u00E1ndar)</option>
                  <option value="15">15 Sellos / 150 Pts</option>
                  <option value="20">20 Sellos / 200 Pts</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Plan</label>
                <input type="text" readonly value="Activo en tu plan" class="w-full bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-sky-400 font-bold">
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Descripci\u00F3n para Clientes</label>
              <textarea name="description" rows="2" placeholder="Explica brevemente c\u00F3mo consiguen puntos o sellos tus clientes..." class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 resize-none"></textarea>
            </div>

            <div class="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <input type="checkbox" id="check-set-active" name="set_active" class="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-black border-zinc-700 cursor-pointer">
              <label for="check-set-active" class="text-xs text-zinc-300 cursor-pointer font-medium">Establecer como Tarjeta Principal activa inmediatamente</label>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button type="button" id="btn-cancel-create-card" class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 cursor-pointer">Cancelar</button>
              <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold text-black bg-sky-500 hover:bg-sky-400 shadow-lg cursor-pointer">Crear Tarjeta</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Preview in Apple & Google Wallet -->
      <div id="modal-preview-wallet-pass" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden items-center justify-center p-4">
        <div class="bg-[#12141C] border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 relative max-h-[95vh] overflow-y-auto">
          <button id="btn-close-wallet-pass-modal" class="absolute top-5 right-5 text-zinc-400 hover:text-white font-black text-xl cursor-pointer">&times;</button>
          
          <div class="text-center space-y-1">
            <h3 class="text-base font-bold text-white">Vista Previa en Billeteras Digitales</h3>
            <p id="preview-modal-prog-title" class="text-xs text-sky-400 font-bold">Tarjeta de Fidelizaci\u00F3n</p>
          </div>

          <!-- Switcher -->
          <div class="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 rounded-2xl border border-zinc-800 text-xs">
            <button type="button" id="btn-modal-view-apple" class="py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-white text-black shadow-md cursor-pointer">
              <span>\uD83C\uDF4E</span> Apple Wallet
            </button>
            <button type="button" id="btn-modal-view-google" class="py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white cursor-pointer">
              <span>\uD83E\uDD16</span> Google Wallet
            </button>
          </div>

          <!-- Render Container -->
          <div id="modal-pass-container" class="flex justify-center py-2 overflow-hidden"></div>

          <div class="flex justify-between items-center pt-2 border-t border-zinc-800 text-xs">
            <a href="#/admin/card-builder" class="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1">
              <span>\u270E</span> Ir al Dise\u00F1ador Completo &rarr;
            </a>
            <button id="btn-modal-close-wallet" class="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white font-semibold text-xs cursor-pointer">
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <!-- Acquisition QR modal for specific program -->
      <div id="modal-prog-qr-acquisition" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden items-center justify-center p-4">
        <div class="bg-[#12141C] border border-zinc-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 text-center relative">
          <button id="btn-close-prog-qr-modal" class="absolute top-5 right-5 text-zinc-400 hover:text-white font-black text-lg cursor-pointer">&times;</button>
          
          <div class="flex flex-col items-center space-y-2">
            <img src="${business.logo_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=128&auto=format&fit=crop&q=80'}" alt="${business.name}" class="w-16 h-16 rounded-2xl object-cover border border-white/20 shadow-lg">
            <h3 class="text-lg font-black text-white">${business.name}</h3>
            <p class="text-xs text-sky-400 font-bold uppercase tracking-wider">Cartel QR para Captaci\u00F3n de Clientes</p>
          </div>

          <div class="bg-white p-4 rounded-3xl shadow-2xl inline-block mx-auto text-black">
            <div id="prog-modal-qr-box" class="w-48 h-48 flex items-center justify-center"></div>
            <p class="text-[10px] font-mono font-bold text-zinc-800 mt-2 uppercase tracking-wider">\u00A1Escanea para unirte!</p>
          </div>

          <div class="space-y-2 text-left bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Enlace Directo de Registro</span>
            <div class="flex items-center gap-2">
              <input type="text" readonly value="${joinUrl}" class="flex-1 bg-black/40 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 font-mono select-all">
              <button id="modal-btn-copy-prog-link" class="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs rounded-xl shadow transition cursor-pointer">
                Copiar
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2">
            <a href="${joinUrl}" target="_blank" class="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5">
              <span>\u2197</span> Abrir Enlace
            </a>
            <button id="btn-print-prog-qr" class="py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer">
              <span>\u2399</span> Imprimir Cartel
            </button>
          </div>
        </div>
      </div>
    `;

    // Modal Create Card Logic
    const modalCreateCard = mainContent.querySelector('#modal-create-card');
    const btnOpenCreate = mainContent.querySelector('#btn-create-new-card');
    const btnOpenCreateFirst = mainContent.querySelector('#btn-create-first-card');
    const btnCloseCreate = mainContent.querySelector('#btn-close-create-card-modal');
    const btnCancelCreate = mainContent.querySelector('#btn-cancel-create-card');
    const formCreateCard = mainContent.querySelector('#form-create-new-card');

    const openCreateModal = () => {
      if (modalCreateCard) {
        modalCreateCard.classList.remove('hidden');
        modalCreateCard.classList.add('flex');
      }
    };

    if (btnOpenCreate) btnOpenCreate.addEventListener('click', openCreateModal);
    if (btnOpenCreateFirst) btnOpenCreateFirst.addEventListener('click', openCreateModal);

    const closeCreateCardModal = () => {
      if (modalCreateCard) {
        modalCreateCard.classList.add('hidden');
        modalCreateCard.classList.remove('flex');
        if (formCreateCard) formCreateCard.reset();
      }
    };

    if (btnCloseCreate) btnCloseCreate.addEventListener('click', closeCreateCardModal);
    if (btnCancelCreate) btnCancelCreate.addEventListener('click', closeCreateCardModal);

    if (formCreateCard) {
      formCreateCard.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(formCreateCard);
        const name = formData.get('card_name')?.trim();
        const rewardName = formData.get('reward_name')?.trim();
        const stampsRequired = Number(formData.get('stamps_required')) || 10;
        const cardType = formData.get('card_type') || 'stamps';
        const description = formData.get('description')?.trim() || '';
        const setActive = formData.get('set_active') === 'on';

        if (!name || !rewardName) {
          toast.error('Por favor completa todos los campos requeridos.');
          return;
        }

        try {
          const newProg = loyaltyService.createProgram(business.id, {
            name,
            reward_name: rewardName,
            stamps_required: stampsRequired,
            card_type: cardType,
            description,
            active: setActive
          }, session);

          if (setActive) {
            loyaltyService.setActiveProgram(business.id, newProg.id, session);
          }

          toast.fireConfetti();
          toast.success(`\u00A1Tarjeta "${name}" creada con \u00E9xito!`);
          closeCreateCardModal();
          setTimeout(() => window.location.reload(), 400);
        } catch (err) {
          toast.error(err.message);
        }
      });
    }

    // Set Main Program Button Handlers
    mainContent.querySelectorAll('.btn-set-main-prog').forEach(btn => {
      btn.addEventListener('click', () => {
        const progId = btn.getAttribute('data-set-main-prog-id');
        if (!progId) return;
        loyaltyService.setActiveProgram(business.id, progId, session);
        toast.success('\u00A1Tarjeta principal actualizada con \u00E9xito!');
        setTimeout(() => window.location.reload(), 300);
      });
    });

    // Delete Card Button Handlers
    mainContent.querySelectorAll('.btn-delete-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const progId = btn.getAttribute('data-delete-prog-id');
        const progName = btn.getAttribute('data-prog-name') || 'esta tarjeta';
        if (!progId) return;

        if (confirm(`\u00BFEst\u00E1s seguro de que deseas eliminar la tarjeta "${progName}"?\nEsta acci\u00F3n no se puede deshacer.`)) {
          try {
            loyaltyService.deleteProgram(business.id, progId, session);
            // Remove card from DOM instantly
            const card = btn.closest('.glass-panel, [class*="rounded-3xl"]');
            if (card) {
              card.style.transition = 'opacity 0.2s, transform 0.2s';
              card.style.opacity = '0';
              card.style.transform = 'scale(0.95)';
              setTimeout(() => card.remove(), 200);
            }
            toast.success(`Tarjeta "${progName}" eliminada correctamente.`);
          } catch (err) {
            toast.error(err.message);
          }
        }
      });
    });

    // Program QR Modal Logic
    const progQrModal = mainContent.querySelector('#modal-prog-qr-acquisition');
    const btnCloseProgQr = mainContent.querySelector('#btn-close-prog-qr-modal');
    const btnCopyProgQr = mainContent.querySelector('#modal-btn-copy-prog-link');
    const btnPrintProgQr = mainContent.querySelector('#btn-print-prog-qr');

    mainContent.querySelectorAll('.btn-open-prog-qr').forEach(btn => {
      btn.addEventListener('click', () => {
        if (progQrModal) {
          progQrModal.classList.remove('hidden');
          progQrModal.classList.add('flex');
          initQRCode('prog-modal-qr-box', joinUrl, 190, 190);
        }
      });
    });

    if (btnCloseProgQr && progQrModal) {
      btnCloseProgQr.addEventListener('click', () => {
        progQrModal.classList.add('hidden');
        progQrModal.classList.remove('flex');
      });
    }

    if (btnCopyProgQr) {
      btnCopyProgQr.addEventListener('click', () => {
        navigator.clipboard.writeText(joinUrl);
        toast.success('Enlace de registro copiado al portapapeles.');
      });
    }

    if (btnPrintProgQr) {
      btnPrintProgQr.addEventListener('click', () => {
        const printWin = window.open('', '_blank');
        printWin.document.write(`
          <html>
            <head>
              <title>Cartel QR \u2022 ${business.name}</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; background: #fff; color: #000; }
                .card { max-width: 400px; margin: 0 auto; border: 2px solid #000; border-radius: 24px; padding: 30px; }
                img.logo { width: 80px; height: 80px; border-radius: 16px; object-fit: cover; }
                h1 { margin: 15px 0 5px 0; font-size: 26px; }
                p.sub { font-size: 14px; color: #555; margin-bottom: 20px; font-weight: bold; }
                .qr-box { margin: 20px 0; }
                .footer { font-size: 12px; color: #888; margin-top: 15px; }
              </style>
            </head>
            <body>
              <div class="card">
                <img src="${business.logo_url || ''}" class="logo" alt="Logo">
                <h1>${business.name}</h1>
                <p class="sub">\u00A1Escanea con tu m\u00F3vil y consigue tu tarjeta de sellos gratis!</p>
                <div class="qr-box">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(joinUrl)}" width="220" height="220" alt="QR">
                </div>
                <p style="font-weight: bold; font-size: 14px;">${program?.reward_name || 'Recompensas exclusivas'}</p>
                <p class="footer">Sin descargar aplicaciones \u2022 VYNTA Loyalty</p>
              </div>
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
          </html>
        `);
        printWin.document.close();
      });
    }

    // Wallet Preview Modal Logic
    const walletPassModal = mainContent.querySelector('#modal-preview-wallet-pass');
    const modalPassContainer = mainContent.querySelector('#modal-pass-container');
    const btnModalApple = mainContent.querySelector('#btn-modal-view-apple');
    const btnModalGoogle = mainContent.querySelector('#btn-modal-view-google');
    const btnCloseWalletModal = mainContent.querySelector('#btn-close-wallet-pass-modal');
    const btnCloseWalletModal2 = mainContent.querySelector('#btn-modal-close-wallet');
    const previewProgTitle = mainContent.querySelector('#preview-modal-prog-title');

    let selectedProgForPreview = allPrograms.length > 0 ? allPrograms[0] : program;
    let modalWalletMode = 'apple';

    const renderModalPass = () => {
      if (!modalPassContainer) return;
      const progToRender = selectedProgForPreview || program || {
        name: 'Tarjeta Digital',
        stamps_required: 10,
        reward_name: 'Regalo Exclusivo'
      };

      const mockCard = {
        card_number: 'DEMO-0001',
        stamps_count: Math.min(4, progToRender.stamps_required || 10),
        secure_token: 'vyn_demo_preview_token'
      };
      const mockCustomer = {
        first_name: 'Mar\u00EDa',
        last_name: 'Garc\u00EDa'
      };

      if (modalWalletMode === 'apple') {
        modalPassContainer.innerHTML = renderAppleWalletPassHTML({
          business,
          customer: mockCustomer,
          card: mockCard,
          program: progToRender,
          containerId: 'modal-wallet-qr-box'
        });
      } else {
        modalPassContainer.innerHTML = renderGoogleWalletPassHTML({
          business,
          customer: mockCustomer,
          card: mockCard,
          program: progToRender,
          containerId: 'modal-wallet-qr-box'
        });
      }

      setTimeout(() => {
        initQRCode('modal-wallet-qr-box', `${window.location.origin}${window.location.pathname}#/c/vyn_demo_preview_token`, 130, 130);
      }, 40);
    };

    if (btnModalApple && btnModalGoogle) {
      btnModalApple.addEventListener('click', () => {
        modalWalletMode = 'apple';
        btnModalApple.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-white text-black shadow-md cursor-pointer';
        btnModalGoogle.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white cursor-pointer';
        renderModalPass();
      });

      btnModalGoogle.addEventListener('click', () => {
        modalWalletMode = 'google';
        btnModalGoogle.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-white text-black shadow-md cursor-pointer';
        btnModalApple.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white cursor-pointer';
        renderModalPass();
      });
    }

    mainContent.querySelectorAll('.btn-preview-wallet-pass').forEach(btn => {
      btn.addEventListener('click', () => {
        const progId = btn.getAttribute('data-preview-prog-id');
        selectedProgForPreview = allPrograms.find(p => p.id === progId) || program;
        if (previewProgTitle) previewProgTitle.textContent = selectedProgForPreview?.name || 'Tarjeta Digital';
        if (walletPassModal) {
          walletPassModal.classList.remove('hidden');
          walletPassModal.classList.add('flex');
          renderModalPass();
        }
      });
    });

    const closeWalletPassModal = () => {
      if (walletPassModal) {
        walletPassModal.classList.add('hidden');
        walletPassModal.classList.remove('flex');
      }
    };

    if (btnCloseWalletModal) btnCloseWalletModal.addEventListener('click', closeWalletPassModal);
    if (btnCloseWalletModal2) btnCloseWalletModal2.addEventListener('click', closeWalletPassModal);

  } else if (activeTab === 'rewards') {
    mainContent.innerHTML = `
      <div class="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 class="text-xl font-bold text-white flex items-center gap-2"><span>\u2605</span> Recompensas de Fidelizaci\u00F3n</h1>
          <p class="text-xs text-zinc-400 mt-1">Premios que los clientes pueden canjear al completar sus sellos.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${rewards.map(r => `
          <div class="glass-panel p-5 rounded-3xl border border-white/5 space-y-3">
            <div class="flex items-start justify-between">
              <div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  ${r.required_stamps} Sellos Requeridos
                </span>
                <h3 class="text-base font-bold text-white mt-2">${r.name}</h3>
                <p class="text-xs text-zinc-400 mt-1">${r.description}</p>
              </div>
              <span class="text-2xl font-bold text-amber-400">\u2605</span>
            </div>
            <div class="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex justify-between">
              <span>Estado: <strong class="text-emerald-400">Activo</strong></span>
              <span>Canjes hist\u00F3ricos: <strong class="text-white">${stats.totalRedemptions}</strong></span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (activeTab === 'coupons') {
    const hasCouponsAccess = planService.canAccessFeature(business.plan, Features.COUPONS);

    if (!hasCouponsAccess) {
      mainContent.innerHTML = `
        <div class="glass-panel p-8 rounded-3xl border border-sky-500/30 shadow-2xl max-w-2xl mx-auto text-center space-y-6">
          <div class="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 text-3xl font-black flex items-center justify-center mx-auto border border-sky-500/30">
            \u22C4
          </div>
          <div class="space-y-2">
            <span class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30">
              Funcionalidad Exclusiva Plan PRO
            </span>
            <h2 class="text-2xl font-black text-white">Cupones de Descuento de Un Solo Uso</h2>
            <p class="text-xs text-zinc-400 max-w-md mx-auto">Crea c\u00F3digos promocionales \u00FAnicos para tus campa\u00F1as en redes sociales o eventos, protegidos contra doble gasto.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left p-4 rounded-2xl bg-white/5 border border-white/10">
            <div class="flex items-start gap-2.5">
              <span class="text-emerald-400 font-bold">\u2714</span>
              <div>
                <h4 class="text-xs font-bold text-white">C\u00F3digos \u00DAnicos Antifraude</h4>
                <p class="text-[10px] text-zinc-400">Cada c\u00F3digo solo se puede canjear una sola vez.</p>
              </div>
            </div>
            <div class="flex items-start gap-2.5">
              <span class="text-emerald-400 font-bold">\u2714</span>
              <div>
                <h4 class="text-xs font-bold text-white">Canje en Esc\u00E1ner Staff</h4>
                <p class="text-[10px] text-zinc-400">Detecci\u00F3n autom\u00E1tica en el terminal del dependiente.</p>
              </div>
            </div>
          </div>

          <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button id="btn-upgrade-coupons-pro" class="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs shadow-xl transition transform hover:scale-[1.02] cursor-pointer">
              \u2728 MEJORAR A PLAN PRO (49\u20AC/mes)
            </button>
            <a href="#/admin/plan" class="w-full sm:w-auto px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition text-center">
              Comparar Planes
            </a>
          </div>
        </div>
      `;

      const btnUp = mainContent.querySelector('#btn-upgrade-coupons-pro');
      if (btnUp) {
        btnUp.addEventListener('click', () => {
          businessService.updatePlan(business.id, 'PRO', session);
          toast.fireConfetti();
          toast.success('\u00A1Plan actualizado con \u00E9xito a PRO!');
          setTimeout(() => window.location.reload(), 300);
        });
      }
    } else {
      mainContent.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold text-white flex items-center gap-2"><span>\u22C4</span> Cupones de Descuento</h1>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/10 text-sky-400 border border-sky-500/20">PRO</span>
            </div>
            <p class="text-xs text-zinc-400 mt-1">Genera c\u00F3digos promocionales \u00FAnicos protegidos contra doble gasto.</p>
          </div>
          <button id="btn-open-create-coupon" class="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-lg transition flex items-center gap-2 self-start sm:self-auto cursor-pointer">
            <span>+</span> Crear Nuevo Cup\u00F3n
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${coupons.length > 0 ? coupons.map(cp => `
            <div class="glass-panel p-5 rounded-3xl border border-white/5 space-y-3 relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-zinc-800 text-sky-400 border border-zinc-700">${cp.code}</span>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    cp.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-500'
                  }">
                    ${cp.status === 'available' ? 'Disponible' : 'Canjeado'}
                  </span>
                  <button data-delete-coupon-id="${cp.id}" data-coupon-title="${cp.title}" class="btn-delete-coupon p-1 text-zinc-500 hover:text-rose-400 transition cursor-pointer" title="Eliminar cup\u00F3n">
                    <span>\uD83D\uDDD1\uFE0F</span>
                  </button>
                </div>
              </div>
              <h3 class="text-sm font-bold text-white">${cp.title}</h3>
              <div class="text-[11px] text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <span>Valor: <strong class="text-white">${cp.discount_value}${cp.discount_type === 'percentage' ? '%' : '\u20AC'}</strong></span>
                <span>Caduca: ${new Date(cp.expires_at).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          `).join('') : `
            <div class="col-span-3 p-12 text-center glass-panel rounded-3xl space-y-3">
              <span class="text-4xl block">\u22C4</span>
              <p class="text-sm font-bold text-white">No tienes cupones creados todav\u00EDa</p>
              <p class="text-xs text-zinc-400">Crea tu primer cup\u00F3n promocional pulsando en el bot\u00F3n superior.</p>
            </div>
          `}
        </div>

        <!-- Modal Crear Cupon -->
        <div id="modal-create-coupon" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden items-center justify-center p-4">
          <div class="bg-[#12141C] border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 class="text-sm font-bold text-white flex items-center gap-2"><span>\u22C4</span> Crear Cup\u00F3n Promocional</h3>
              <button id="btn-close-coupon-modal" class="text-zinc-400 hover:text-white font-bold text-lg cursor-pointer">&times;</button>
            </div>
            <form id="form-create-coupon" class="space-y-3">
              <div>
                <label class="block text-[11px] font-semibold text-zinc-400 mb-1">T\u00EDtulo / Descripci\u00F3n del Cup\u00F3n *</label>
                <input type="text" name="title" required placeholder="Ej: 20% Descuento en Primera Compra" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-semibold text-zinc-400 mb-1">C\u00F3digo (Opcional)</label>
                  <input type="text" name="code" placeholder="AUTO o CPN-VERANO" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Descuento (%)</label>
                  <input type="number" name="discount_value" value="20" min="1" max="100" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
                </div>
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-zinc-400 mb-1">D\u00EDas de Validez</label>
                <input type="number" name="validity_days" value="30" min="1" max="365" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
              </div>
              <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button type="button" id="btn-cancel-coupon-modal" class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 cursor-pointer">Cancelar</button>
                <button type="submit" class="px-4 py-2 rounded-xl text-xs font-bold text-black bg-sky-500 hover:bg-sky-400 shadow-lg cursor-pointer">Crear Cup\u00F3n</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const modalCoupon = mainContent.querySelector('#modal-create-coupon');
      const btnOpenCoupon = mainContent.querySelector('#btn-open-create-coupon');
      const btnCloseCoupon = mainContent.querySelector('#btn-close-coupon-modal');
      const btnCancelCoupon = mainContent.querySelector('#btn-cancel-coupon-modal');
      const formCoupon = mainContent.querySelector('#form-create-coupon');

      if (btnOpenCoupon && modalCoupon) {
        btnOpenCoupon.addEventListener('click', () => {
          modalCoupon.classList.remove('hidden');
          modalCoupon.classList.add('flex');
        });
      }

      const closeCouponModal = () => {
        if (modalCoupon) {
          modalCoupon.classList.add('hidden');
          modalCoupon.classList.remove('flex');
        }
      };

      if (btnCloseCoupon) btnCloseCoupon.addEventListener('click', closeCouponModal);
      if (btnCancelCoupon) btnCancelCoupon.addEventListener('click', closeCouponModal);

      if (formCoupon) {
        formCoupon.addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(formCoupon);
          const title = fd.get('title');
          const code = fd.get('code') || undefined;
          const discountVal = parseFloat(fd.get('discount_value')) || 20;
          const days = parseInt(fd.get('validity_days')) || 30;
          const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

          try {
            couponService.create(business.id, {
              title,
              code,
              discount_type: 'percentage',
              discount_value: discountVal,
              expires_at: expiresAt
            }, session);
            toast.fireConfetti();
            toast.success('Cup\u00F3n creado con \u00E9xito');
            closeCouponModal();
            setTimeout(() => window.location.reload(), 300);
          } catch (err) {
            toast.error(err.message);
          }
        });
      }

      // Delete Coupon Handlers
      mainContent.querySelectorAll('.btn-delete-coupon').forEach(btn => {
        btn.addEventListener('click', () => {
          const cpnId = btn.getAttribute('data-delete-coupon-id');
          const cpnTitle = btn.getAttribute('data-coupon-title') || 'este cup\u00F3n';
          if (!cpnId) return;
          if (confirm(`\u00BFEst\u00E1s seguro de que deseas eliminar el cup\u00F3n "${cpnTitle}"?`)) {
            try {
              couponService.delete(business.id, cpnId, session);
              // Remove card from DOM instantly
              const card = btn.closest('.glass-panel');
              if (card) {
                card.style.transition = 'opacity 0.2s, transform 0.2s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.remove(), 200);
              }
              toast.success('Cup\u00F3n eliminado.');
            } catch (err) {
              toast.error(err.message);
            }
          }
        });
      });
    }

  } else if (activeTab === 'single_use') {
    const hasSingleUseAccess = planService.canAccessFeature(business.plan, Features.SINGLE_USE_CARDS);

    if (!hasSingleUseAccess) {
      mainContent.innerHTML = `
        <div class="glass-panel p-8 rounded-3xl border border-sky-500/30 shadow-2xl max-w-2xl mx-auto text-center space-y-6">
          <div class="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 text-3xl font-black flex items-center justify-center mx-auto border border-sky-500/30">
            \u2728
          </div>
          <div class="space-y-2">
            <span class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30">
              Funcionalidad Exclusiva Plan PRO
            </span>
            <h2 class="text-2xl font-black text-white">Tarjetas de Un Solo Uso & Campa\u00F1as</h2>
            <p class="text-xs text-zinc-400 max-w-md mx-auto">Crea campa\u00F1as masivas de captaci\u00F3n con lotes de tarjetas de 1 solo uso, c\u00F3digos QR individuales y canje instant\u00E1neo.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left p-4 rounded-2xl bg-white/5 border border-white/10">
            <div class="flex items-start gap-2.5">
              <span class="text-emerald-400 font-bold">\u2714</span>
              <div>
                <h4 class="text-xs font-bold text-white">Captaci\u00F3n en Folletos y Redes</h4>
                <p class="text-[10px] text-zinc-400">Genera 50, 100 o 500 pases con c\u00F3digos QR \u00FAnicos para repartir.</p>
              </div>
            </div>
            <div class="flex items-start gap-2.5">
              <span class="text-emerald-400 font-bold">\u2714</span>
              <div>
                <h4 class="text-xs font-bold text-white">Canje \u00DAnico Protegido</h4>
                <p class="text-[10px] text-zinc-400">Una vez escaneado y canjeado, el pase queda bloqueado para siempre.</p>
              </div>
            </div>
          </div>

          <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button id="btn-upgrade-singleuse-pro" class="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs shadow-xl transition transform hover:scale-[1.02] cursor-pointer">
              \u2728 MEJORAR A PLAN PRO (49\u20AC/mes)
            </button>
            <a href="#/admin/plan" class="w-full sm:w-auto px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition text-center">
              Comparar Planes
            </a>
          </div>
        </div>
      `;

      const btnUp = mainContent.querySelector('#btn-upgrade-singleuse-pro');
      if (btnUp) {
        btnUp.addEventListener('click', () => {
          businessService.updatePlan(business.id, 'PRO', session);
          toast.fireConfetti();
          toast.success('\u00A1Plan actualizado con \u00E9xito a PRO!');
          setTimeout(() => window.location.reload(), 300);
        });
      }
    } else {
      const suStats = singleUseService.getBusinessStats(business.id);
      const campaigns = singleUseService.getAllCampaigns(business.id);
      const allSingleCards = singleUseService.getAllCards(business.id);
      // Get existing Tarjeta Promo (single_use_promo) loyalty programs for the campaign selector
      const allPrograms = loyaltyService.getAllPrograms(business.id) || [];
      const promoCards = allPrograms.filter(p => p.card_type === 'single_use_promo');

      mainContent.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold text-white flex items-center gap-2"><span>\u2728</span> Campa\u00F1as</h1>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/10 text-sky-400 border border-sky-500/20">PRO</span>
            </div>
            <p class="text-xs text-zinc-400 mt-1">Crea campa\u00F1as asignando una tarjeta de 1 solo uso y genera lotes de pases QR listos para repartir.</p>
          </div>
          <button id="btn-open-create-campaign" class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 self-start sm:self-auto cursor-pointer">
            <span>\u2728</span> Nueva Campa\u00F1a de Captaci\u00F3n
          </button>
        </div>

        <!-- Metric Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div class="glass-panel p-4 rounded-2xl">
            <span class="text-[10px] text-zinc-400 uppercase font-bold">Campa\u00F1as</span>
            <p class="text-2xl font-extrabold text-white mt-1">${suStats.totalCampaigns}</p>
          </div>
          <div class="glass-panel p-4 rounded-2xl">
            <span class="text-[10px] text-zinc-400 uppercase font-bold">Tarjetas Generadas</span>
            <p class="text-2xl font-extrabold text-sky-400 mt-1">${suStats.totalCards}</p>
          </div>
          <div class="glass-panel p-4 rounded-2xl">
            <span class="text-[10px] text-zinc-400 uppercase font-bold">Pases Disponibles</span>
            <p class="text-2xl font-extrabold text-emerald-400 mt-1">${suStats.activeCards}</p>
          </div>
          <div class="glass-panel p-4 rounded-2xl">
            <span class="text-[10px] text-zinc-400 uppercase font-bold">Pases Canjeados</span>
            <p class="text-2xl font-extrabold text-amber-400 mt-1">${suStats.usedCards}</p>
          </div>
          <div class="glass-panel p-4 rounded-2xl col-span-2 sm:col-span-1">
            <span class="text-[10px] text-zinc-400 uppercase font-bold">Tasa de Canje</span>
            <p class="text-2xl font-extrabold text-purple-400 mt-1">${suStats.conversionRate}%</p>
          </div>
        </div>

        <!-- Campaigns Overview List -->
        <div class="space-y-4">
          <h2 class="text-sm font-bold text-white flex items-center gap-2"><span>\u25EB</span> Campa\u00F1as Activas</h2>
          ${campaigns.length > 0 ? `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${campaigns.map(camp => {
                const cDetails = singleUseService.getCampaignById(business.id, camp.id);
                return `
                  <div class="glass-panel p-5 rounded-3xl border border-white/5 space-y-3">
                    <div class="flex items-start justify-between">
                      <div>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVA</span>
                        <h3 class="text-base font-extrabold text-white mt-1">${camp.name}</h3>
                        <p class="text-xs text-amber-400 font-bold">\uD83C\uDF81 Premio: ${camp.reward_name}</p>
                      </div>
                      <div class="flex flex-col items-end gap-1.5">
                        <span class="font-mono text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg">${cDetails.used_count}/${cDetails.total_count} canjeadas</span>
                        <button data-delete-campaign-id="${camp.id}" data-camp-name="${camp.name}" class="btn-delete-campaign text-zinc-500 hover:text-rose-400 text-xs font-bold transition flex items-center gap-1 cursor-pointer" title="Eliminar campa\u00F1a y sus pases">
                          <span>\uD83D\uDDD1\uFE0F</span> Eliminar
                        </button>
                      </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div class="bg-gradient-to-r from-sky-500 to-emerald-400 h-2 rounded-full" style="width: ${cDetails.redemption_rate}%"></div>
                    </div>

                    <div class="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                      <span>V\u00E1lido hasta: ${new Date(camp.end_date).toLocaleDateString('es-ES')}</span>
                      <span class="text-emerald-400 font-bold">${cDetails.redemption_rate}% de \u00E9xito</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="p-8 text-center glass-panel rounded-3xl space-y-2">
              <span class="text-3xl block">\uD83C\uDF81</span>
              <p class="text-sm font-bold text-white">No tienes ninguna campa\u00F1a creada</p>
              <p class="text-xs text-zinc-400">Crea tu primera campa\u00F1a para generar autom\u00E1ticamente pases con QR de un solo uso.</p>
            </div>
          `}
        </div>

        <!-- Generated Single-Use Cards Table -->
        <div class="glass-panel p-5 rounded-3xl space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>\u2261</span> Listado de Tarjetas de 1 Solo Uso (${allSingleCards.length})
            </h3>
            <span class="text-[10px] text-zinc-400">Protegidas contra doble canje</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-zinc-400 bg-zinc-900/40 text-[10px] uppercase font-mono">
                <tr>
                  <th class="px-4 py-2.5 rounded-l-xl">N\u00BA Pase</th>
                  <th class="px-4 py-2.5">Recompensa</th>
                  <th class="px-4 py-2.5">Estado</th>
                  <th class="px-4 py-2.5">Caducidad</th>
                  <th class="px-4 py-2.5 text-right rounded-r-xl">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800/60">
                ${allSingleCards.slice(0, 50).map(sc => {
                  const isUsed = sc.status === SingleUseStatus.USED;
                  const isExp = sc.expires_at && new Date(sc.expires_at) < new Date();
                  return `
                    <tr class="hover:bg-zinc-900/40 transition">
                      <td class="px-4 py-3 font-mono font-bold text-white">${sc.card_number}</td>
                      <td class="px-4 py-3 text-zinc-300">${sc.reward_name}</td>
                      <td class="px-4 py-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isUsed ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : isExp ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }">
                          ${isUsed ? 'Canjeada' : isExp ? 'Caducada' : 'Disponible'}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-[11px] text-zinc-400">${new Date(sc.expires_at).toLocaleDateString('es-ES')}</td>
                      <td class="px-4 py-3 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button data-inspect-single="${sc.secure_token}" class="btn-inspect-single px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sky-400 font-bold text-[10px] border border-zinc-700 transition cursor-pointer">
                            Ver QR
                          </button>
                          <a href="#/c/${sc.secure_token}" target="_blank" class="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold text-[10px] border border-sky-500/30 transition">
                            Pase &rarr;
                          </a>
                          <button data-delete-single-card-id="${sc.id}" data-card-num="${sc.card_number}" class="btn-delete-single-card px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] border border-rose-500/30 transition cursor-pointer" title="Eliminar este pase">
                            <span>\uD83D\uDDD1\uFE0F</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modal Crear Campana -->
        <div id="modal-create-campaign" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden items-center justify-center p-4">
          <div class="bg-[#12141C] border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 class="text-sm font-bold text-white flex items-center gap-2"><span>\u2728</span> Crear Campa\u00F1a</h3>
              <button id="btn-close-campaign-modal" class="text-zinc-400 hover:text-white font-bold text-lg cursor-pointer">&times;</button>
            </div>
            <form id="form-create-campaign" class="space-y-3">
              <div>
                <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Tarjeta de la Campa\u00F1a *</label>
                ${promoCards.length > 0
                  ? `<select name="card_id" required class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
                      <option value="">-- Selecciona una Tarjeta Promo --</option>
                      ${promoCards.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>`
                  : `<div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
                      No tienes ninguna <strong>Tarjeta Promo (1 Solo Uso)</strong> creada. Cr\u00E9ala primero en <a href="#/admin/card-builder" class="underline font-bold">Personalizar Tarjeta</a>.
                    </div>`
                }
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Nombre de la Campa\u00F1a *</label>
                <input type="text" name="name" required placeholder="Ej: Apertura Local - Caf\u00E9 de Bienvenida" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Cantidad de Pases</label>
                  <input type="number" name="quantity" value="50" min="1" max="9999" placeholder="Ej: 50" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-zinc-400 mb-1">D\u00EDas de Validez</label>
                  <input type="number" name="validity_days" value="30" min="1" max="365" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500">
                </div>
              </div>
              <div class="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-[10px] text-sky-300">
                Se generar\u00E1n instant\u00E1neamente c\u00F3digos \u00FAnicos y tokens QR seguros listos para compartir o imprimir.
              </div>
              <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button type="button" id="btn-cancel-campaign-modal" class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 cursor-pointer">Cancelar</button>
                ${promoCards.length > 0
                  ? `<button type="submit" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg cursor-pointer">\u2728 Generar Campa\u00F1a</button>`
                  : `<a href="#/admin/card-builder" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 shadow-lg cursor-pointer">\u270E Crear Tarjeta Promo</a>`
                }
              </div>
            </form>
          </div>
        </div>

        <!-- Modal Inspeccionar QR Single Use -->
        <div id="modal-inspect-single-card" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm hidden items-center justify-center p-4">
          <div class="bg-[#12141C] border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center relative">
            <button id="btn-close-single-inspect" class="absolute top-4 right-4 text-zinc-400 hover:text-white font-bold text-lg cursor-pointer">&times;</button>
            <h3 id="single-inspect-title" class="text-sm font-bold text-white">Tarjeta de 1 Solo Uso</h3>
            <p id="single-inspect-reward" class="text-xs text-emerald-400 font-bold">Premio</p>
            <div class="bg-white p-4 rounded-3xl shadow-2xl inline-flex flex-col items-center justify-center mx-auto text-black">
              <div id="single-card-qr-target" class="w-36 h-36 flex items-center justify-center"></div>
              <span id="single-inspect-number" class="font-mono text-[10px] font-bold text-zinc-800 mt-1 uppercase">PRM-000000</span>
            </div>
            <div class="flex gap-2 pt-1">
              <button id="single-btn-copy-link" class="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sky-400 font-bold text-xs border border-zinc-700 transition cursor-pointer">
                Copiar Enlace
              </button>
              <button id="single-btn-close" class="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white font-semibold text-xs cursor-pointer">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      `;

      const modalCamp = mainContent.querySelector('#modal-create-campaign');
      const btnOpenCamp = mainContent.querySelector('#btn-open-create-campaign');
      const btnCloseCamp = mainContent.querySelector('#btn-close-campaign-modal');
      const btnCancelCamp = mainContent.querySelector('#btn-cancel-campaign-modal');
      const formCamp = mainContent.querySelector('#form-create-campaign');

      if (btnOpenCamp && modalCamp) {
        btnOpenCamp.addEventListener('click', () => {
          modalCamp.classList.remove('hidden');
          modalCamp.classList.add('flex');
        });
      }

      const closeCampModal = () => {
        if (modalCamp) {
          modalCamp.classList.add('hidden');
          modalCamp.classList.remove('flex');
        }
      };

      if (btnCloseCamp) btnCloseCamp.addEventListener('click', closeCampModal);
      if (btnCancelCamp) btnCancelCamp.addEventListener('click', closeCampModal);

      if (formCamp) {
        formCamp.addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(formCamp);
          const card_id = fd.get('card_id');
          const name = fd.get('name');
          const quantity = parseInt(fd.get('quantity')) || 50;
          const days = parseInt(fd.get('validity_days')) || 30;
          const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

          if (!card_id) {
            toast.error('Selecciona una Tarjeta Promo para la campa\u00F1a.');
            return;
          }

          // Get reward name from selected promo card
          const selectedCard = promoCards.find(p => p.id === card_id);
          const reward_name = selectedCard ? selectedCard.name : name;

          try {
            singleUseService.createCampaign(business.id, {
              name,
              card_id,
              reward_name,
              quantity,
              end_date: endDate
            }, session);
            toast.fireConfetti();
            toast.success(`\u2728 \u00A1Campa\u00F1a creada con ${quantity} pases generados!`);
            closeCampModal();
            setTimeout(() => window.location.reload(), 300);
          } catch (err) {
            toast.error(err.message);
          }
        });
      }

      // Single card QR modal handlers
      const modalSingleInspect = mainContent.querySelector('#modal-inspect-single-card');
      const btnCloseSingleInspect = mainContent.querySelector('#btn-close-single-inspect');
      const btnCloseSingleInspect2 = mainContent.querySelector('#single-btn-close');
      const btnCopySingleLink = mainContent.querySelector('#single-btn-copy-link');
      let currentInspectToken = null;

      const closeSingleInspectModal = () => {
        if (modalSingleInspect) {
          modalSingleInspect.classList.add('hidden');
          modalSingleInspect.classList.remove('flex');
        }
      };

      if (btnCloseSingleInspect) btnCloseSingleInspect.addEventListener('click', closeSingleInspectModal);
      if (btnCloseSingleInspect2) btnCloseSingleInspect2.addEventListener('click', closeSingleInspectModal);

      if (btnCopySingleLink) {
        btnCopySingleLink.addEventListener('click', () => {
          if (currentInspectToken) {
            const url = `${window.location.origin}${window.location.pathname}#/c/${currentInspectToken}`;
            navigator.clipboard.writeText(url);
            toast.success('Enlace copiado al portapapeles.');
          }
        });
      }

      mainContent.querySelectorAll('.btn-inspect-single').forEach(btn => {
        btn.addEventListener('click', () => {
          const token = btn.getAttribute('data-inspect-single');
          const sc = singleUseService.getCardByTokenOrNumber(token, business.id);
          if (!sc) return;
          currentInspectToken = token;

          mainContent.querySelector('#single-inspect-title').textContent = `Tarjeta #${sc.card_number}`;
          mainContent.querySelector('#single-inspect-reward').textContent = `\uD83C\uDF81 ${sc.reward_name}`;
          mainContent.querySelector('#single-inspect-number').textContent = sc.card_number;

          if (modalSingleInspect) {
            modalSingleInspect.classList.remove('hidden');
            modalSingleInspect.classList.add('flex');
            initQRCode('single-card-qr-target', `${window.location.origin}${window.location.pathname}#/c/${token}`, 140, 140);
          }
        });
      });

      // Delete Campaign Handlers
      mainContent.querySelectorAll('.btn-delete-campaign').forEach(btn => {
        btn.addEventListener('click', () => {
          const campId = btn.getAttribute('data-delete-campaign-id');
          const campName = btn.getAttribute('data-camp-name') || 'esta campa\u00F1a';
          if (!campId) return;
          if (confirm(`\u00BFEst\u00E1s seguro de que deseas eliminar la campa\u00F1a "${campName}" y todos sus pases asociados?`)) {
            try {
              singleUseService.deleteCampaign(business.id, campId, session);
              const card = btn.closest('.glass-panel, [class*="rounded-3xl"]');
              if (card) {
                card.style.transition = 'opacity 0.2s, transform 0.2s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.remove(), 200);
              }
              toast.success('Campa\u00F1a eliminada.');
            } catch (err) {
              toast.error(err.message);
            }
          }
        });
      });

      // Delete Single-Use Card Handlers
      mainContent.querySelectorAll('.btn-delete-single-card').forEach(btn => {
        btn.addEventListener('click', () => {
          const cardId = btn.getAttribute('data-delete-single-card-id');
          const cardNum = btn.getAttribute('data-card-num') || 'este pase';
          if (!cardId) return;
          if (confirm(`\u00BFEst\u00E1s seguro de que deseas eliminar el pase #${cardNum}?`)) {
            try {
              singleUseService.deleteCard(business.id, cardId, session);
              // Remove the table row from DOM instantly
              const row = btn.closest('tr');
              if (row) {
                row.style.transition = 'opacity 0.2s';
                row.style.opacity = '0';
                setTimeout(() => row.remove(), 200);
              }
              toast.success(`Pase #${cardNum} eliminado.`);
            } catch (err) {
              toast.error(err.message);
            }
          }
        });
      });
    }

  } else if (activeTab === 'plan') {
    const currentPlan = planService.getBusinessPlan(business.id);
    const plans = planService.getPlanMatrix();

    mainContent.innerHTML = `
      <div class="pb-4 border-b border-zinc-800">
        <h1 class="text-xl font-bold text-white flex items-center gap-2"><span>\u2B50</span> Mi Plan & Suscripci\u00F3n</h1>
        <p class="text-xs text-zinc-400 mt-1">Administra tu nivel de suscripci\u00F3n comercial y desbloquea nuevas capacidades de marketing.</p>
      </div>

      <!-- Current Active Plan Banner -->
      <div class="glass-panel p-6 rounded-3xl border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 text-2xl font-black flex items-center justify-center border border-sky-500/30">
            \u2B50
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-zinc-400 font-bold uppercase tracking-wider">Plan Activo Actual:</span>
              <span class="px-2.5 py-0.5 rounded-lg text-xs font-black border ${currentPlan.badgeClass}">${currentPlan.name}</span>
            </div>
            <h3 class="text-lg font-black text-white mt-0.5">${business.name}</h3>
            <p class="text-[11px] text-zinc-400">${currentPlan.description}</p>
          </div>
        </div>
        <div class="text-left sm:text-right">
          <span class="text-2xl font-black text-white font-mono">${currentPlan.price}</span>
          <span class="text-[10px] text-emerald-400 block font-bold">\u2714 Estado: Activo & Sincronizado</span>
        </div>
      </div>

      <!-- Plans Comparison Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        ${plans.map(p => {
          const isCurrent = p.id === currentPlan.id;
          return `
            <div class="glass-panel p-6 rounded-3xl border ${isCurrent ? 'border-sky-500/60 shadow-xl ring-1 ring-sky-500/30' : 'border-white/5'} flex flex-col justify-between space-y-5 relative">
              ${isCurrent ? `
                <span class="absolute -top-3 right-5 px-3 py-0.5 rounded-full text-[9px] font-black uppercase bg-sky-500 text-black shadow">PLAN ACTIVO</span>
              ` : ''}

              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-base font-black text-white">${p.label}</h3>
                  <span class="font-mono text-xs font-bold text-sky-400">${p.price}</span>
                </div>
                <p class="text-xs text-zinc-400">${p.description}</p>

                <div class="space-y-2 pt-2 border-t border-zinc-800 text-xs">
                  <div class="flex items-center gap-2 ${p.features.includes(Features.LOYALTY_CARD) ? 'text-zinc-200' : 'text-zinc-600'}">
                    <span>${p.features.includes(Features.LOYALTY_CARD) ? '\u2714' : '\u2715'}</span>
                    <span>Tarjeta de Fidelizaci\u00F3n Digital</span>
                  </div>
                  <div class="flex items-center gap-2 ${p.features.includes(Features.LOYALTY_CUSTOMIZATION) ? 'text-zinc-200' : 'text-zinc-600'}">
                    <span>${p.features.includes(Features.LOYALTY_CUSTOMIZATION) ? '\u2714' : '\u2715'}</span>
                    <span>Personalizaci\u00F3n de Tarjeta y Sellos (.png)</span>
                  </div>
                  <div class="flex items-center gap-2 ${p.features.includes(Features.REWARDS) ? 'text-zinc-200' : 'text-zinc-600'}">
                    <span>${p.features.includes(Features.REWARDS) ? '\u2714' : '\u2715'}</span>
                    <span>Sistema de Recompensas y Canje</span>
                  </div>
                  <div class="flex items-center gap-2 ${p.features.includes(Features.SINGLE_USE_CARDS) ? 'text-sky-300 font-bold' : 'text-zinc-600'}">
                    <span>${p.features.includes(Features.SINGLE_USE_CARDS) ? '\u2714' : '\u2715'}</span>
                    <span>Tarjetas de 1 Solo Uso & Campa\u00F1as</span>
                  </div>
                  <div class="flex items-center gap-2 ${p.features.includes(Features.COUPONS) ? 'text-sky-300 font-bold' : 'text-zinc-600'}">
                    <span>${p.features.includes(Features.COUPONS) ? '\u2714' : '\u2715'}</span>
                    <span>Cupones Promocionales</span>
                  </div>
                </div>
              </div>

              <div>
                <button data-switch-plan="${p.id}" ${isCurrent ? 'disabled' : ''} class="w-full py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  isCurrent 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : p.id === 'PRO' 
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg' 
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }">
                  ${isCurrent ? 'Plan Actual' : `Cambiar a ${p.name}`}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Safe Downgrade & Data Integrity Guarantee -->
      <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-xs text-zinc-400 flex items-center gap-3">
        <span class="text-xl text-sky-400 font-black">\uD83D\uDEE1</span>
        <div>
          <strong class="text-white">Garant\u00EDa de Integridad de Datos VYNTA:</strong> Todos los clientes, tarjetas de sellos, campa\u00F1as creadas y registros hist\u00F3ricos permanecen 100% seguros y guardados en tu cuenta incluso si cambias de plan.
        </div>
      </div>
    `;

    mainContent.querySelectorAll('button[data-switch-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        const newPlan = btn.getAttribute('data-switch-plan');
        if (confirm(`\u00BFDeseas cambiar el plan del comercio a ${newPlan}?`)) {
          businessService.updatePlan(business.id, newPlan, session);
          toast.fireConfetti();
          toast.success(`\u2728 \u00A1Plan cambiado a ${newPlan} correctamente!`);
          setTimeout(() => window.location.reload(), 300);
        }
      });
    });

  } else if (activeTab === 'analytics') {
    mainContent.innerHTML = `
      <div class="pb-4 border-b border-zinc-800">
        <h1 class="text-xl font-bold text-white flex items-center gap-2"><span>\u25E4</span> Anal\u00EDticas Detalladas</h1>
        <p class="text-xs text-zinc-400 mt-1">M\u00E9tricas de retenci\u00F3n, canjes y actividad de fidelizaci\u00F3n de ${business.name}.</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="glass-panel p-4 rounded-2xl">
          <span class="text-[10px] text-zinc-400 uppercase font-bold">Media Sellos / Cliente</span>
          <p class="text-2xl font-extrabold text-sky-400 mt-1">${stats.avgStampsPerCustomer}</p>
        </div>
        <div class="glass-panel p-4 rounded-2xl">
          <span class="text-[10px] text-zinc-400 uppercase font-bold">Tasa de Canje</span>
          <p class="text-2xl font-extrabold text-emerald-400 mt-1">${stats.redemptionRate}%</p>
        </div>
        <div class="glass-panel p-4 rounded-2xl">
          <span class="text-[10px] text-zinc-400 uppercase font-bold">Tarjetas Completadas</span>
          <p class="text-2xl font-extrabold text-amber-400 mt-1">${stats.completedCards}</p>
        </div>
        <div class="glass-panel p-4 rounded-2xl">
          <span class="text-[10px] text-zinc-400 uppercase font-bold">Cupones Canjeados</span>
          <p class="text-2xl font-extrabold text-purple-400 mt-1">${stats.couponsRedeemed}</p>
        </div>
      </div>
    `;
  } else if (activeTab === 'activity') {
    mainContent.innerHTML = `
      <div class="pb-4 border-b border-zinc-800">
        <h1 class="text-xl font-bold text-white flex items-center gap-2"><span>\u2261</span> Historial de Auditor\u00EDa & Actividad</h1>
        <p class="text-xs text-zinc-400 mt-1">Registro inmutable de todas las operaciones realizadas en ${business.name}.</p>
      </div>

      <div class="space-y-2.5">
        ${logs.map(log => `
          <div class="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-xs">
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 rounded-full ${log.action.includes('STAMP') ? 'bg-sky-400' : 'bg-emerald-400'}"></span>
              <div>
                <p class="font-medium text-white">${log.description}</p>
                <p class="text-[10px] text-zinc-500">Operador: <strong class="text-zinc-400">${log.user_name}</strong> \u2022 ${new Date(log.created_at).toLocaleString('es-ES')}</p>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-400">${log.action}</span>
          </div>
        `).join('')}
      </div>
    `;
  } else if (activeTab === 'staff') {
    mainContent.innerHTML = `
      <div class="pb-4 border-b border-zinc-800 flex justify-between items-center">
        <div>
          <h1 class="text-xl font-bold text-white flex items-center gap-2"><span>\u2699</span> Equipo y Personal del Local</h1>
          <p class="text-xs text-zinc-400 mt-1">Trabajadores autorizados para usar el esc\u00E1ner y asignar sellos.</p>
        </div>
      </div>

      <div class="glass-panel p-5 rounded-3xl space-y-4 max-w-lg">
        <h3 class="text-sm font-bold text-white">PIN de Acceso R\u00E1pido del Personal</h3>
        <p class="text-xs text-zinc-400">Este c\u00F3digo PIN de 4 d\u00EDgitos permite a los dependientes acceder inmediatamente al esc\u00E1ner en sus tel\u00E9fonos m\u00F3viles.</p>
        
        <div class="flex items-center gap-3">
          <input type="text" id="input-staff-pin" value="${business.settings?.staff_pin || '1234'}" maxlength="6" class="w-36 font-mono text-center font-bold text-lg bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sky-400 focus:outline-none">
          <button id="btn-save-staff-pin" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-lg">Guardar PIN</button>
        </div>
      </div>
    `;

    mainContent.querySelector('#btn-save-staff-pin').addEventListener('click', () => {
      const pin = mainContent.querySelector('#input-staff-pin').value;
      businessService.updateSettings(business.id, { staff_pin: pin }, session);
      toast.success('PIN de personal actualizado correctamente.');
    });
  } else if (activeTab === 'settings') {
    mainContent.innerHTML = `
      <div class="pb-4 border-b border-zinc-800">
        <h1 class="text-xl font-bold text-white flex items-center gap-2"><span>\u2699</span> Configuraci\u00F3n del Negocio</h1>
        <p class="text-xs text-zinc-400 mt-1">L\u00EDmites antifraude, datos fiscales e integraciones.</p>
      </div>

      <div class="glass-panel p-6 rounded-3xl space-y-5 max-w-xl">
        <div>
          <label class="block text-xs font-bold text-white mb-1">Nombre Comercial</label>
          <input type="text" id="input-biz-name" value="${business.name}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white">
        </div>

        <div>
          <label class="block text-xs font-bold text-white mb-1">L\u00EDmite Antifraude (M\u00E1x. sellos por cliente al d\u00EDa)</label>
          <input type="number" id="input-max-stamps-day" value="${business.settings?.max_stamps_per_day || 2}" min="1" max="10" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white">
          <p class="text-[10px] text-zinc-500 mt-1">Evita que un cliente reciba sellos duplicados accidentalmente el mismo d\u00EDa.</p>
        </div>

        <button id="btn-save-settings" class="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-lg">Guardar Configuraci\u00F3n</button>
      </div>
    `;

    mainContent.querySelector('#btn-save-settings').addEventListener('click', () => {
      const name = mainContent.querySelector('#input-biz-name').value;
      const maxStamps = parseInt(mainContent.querySelector('#input-max-stamps-day').value) || 2;
      businessService.update(business.id, { name }, session);
      businessService.updateSettings(business.id, { max_stamps_per_day: maxStamps }, session);
      toast.success('Configuraci\u00F3n guardada.');
    });
  } else {
    // DASHBOARD HOME VIEW
    mainContent.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-white/5">
        <div class="flex items-center gap-4">
          <img src="${business.logo_url}" alt="${business.name}" class="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-lg">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold text-white">${business.name}</h1>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Activo</span>
            </div>
            <p class="text-xs text-zinc-400 mt-1">Programa actual: <strong class="text-sky-400">${program?.name || 'Fidelizaci\u00F3n'}</strong> (${program?.stamps_required || 10} sellos)</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <a href="#/admin/card-builder" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition flex items-center gap-1.5">
            <span>\u270E</span> Personalizar Tarjeta
          </a>
          <a href="#/staff/scanner" class="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-lg transition flex items-center gap-1.5">
            <span>\u25EB</span> Abrir Esc\u00E1ner
          </a>
        </div>
      </div>

      <!-- ONBOARDING QR BANNER / CAPTACI?N DE CLIENTES -->
      <div class="glass-panel p-6 rounded-3xl border border-sky-500/30 bg-gradient-to-r from-sky-950/30 to-indigo-950/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-2 flex-1">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase tracking-widest">
              Cartel QR de Mostrador / Mesas
            </span>
          </div>
          <h2 class="text-lg font-bold text-white">\u25EB Captaci\u00F3n R\u00E1pida de Clientes</h2>
          <p class="text-xs text-zinc-300">
            Tus clientes pueden escanear este c\u00F3digo QR o abrir el enlace con su tel\u00E9fono para obtener su tarjeta digital en 3 segundos sin instalar apps.
          </p>

          <div class="flex flex-wrap items-center gap-2 pt-2">
            <button id="btn-copy-join-link" class="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white font-bold text-xs transition flex items-center gap-1.5">
              <span>\u22C4</span> Copiar Enlace
            </button>
            <button id="btn-dash-open-qr" class="px-3.5 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold text-xs transition flex items-center gap-1.5">
              <span>\u2399</span> Ver Cartel / Imprimir
            </button>
            <a href="${joinUrl}" target="_blank" class="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition flex items-center gap-1.5">
              <span>\u2197</span> Probar Registro
            </a>
          </div>
        </div>

        <div id="btn-dash-qr-box" class="bg-white p-3 rounded-2xl shadow-2xl flex flex-col items-center justify-center shrink-0 cursor-pointer" title="Haz clic para ampliar o imprimir">
          <div id="join-qr-container" class="w-32 h-32 flex items-center justify-center"></div>
          <span class="text-[9px] font-mono font-bold text-zinc-700 mt-1 uppercase">${business.name}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="glass-panel p-5 rounded-3xl space-y-1">
          <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Clientes Registrados</span>
          <span class="text-2xl lg:text-3xl font-extrabold text-sky-400">${stats.totalCustomers}</span>
          <p class="text-[10px] text-zinc-400 font-semibold">${stats.activeCards} tarjetas activas</p>
        </div>

        <div class="glass-panel p-5 rounded-3xl space-y-1">
          <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Sellos Otorgados</span>
          <span class="text-2xl lg:text-3xl font-extrabold text-amber-400">${stats.totalStamps}</span>
          <p class="text-[10px] text-emerald-400 font-semibold">Media: ${stats.avgStampsPerCustomer} / cliente</p>
        </div>

        <div class="glass-panel p-5 rounded-3xl space-y-1">
          <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Recompensas Listas</span>
          <span class="text-2xl lg:text-3xl font-extrabold text-emerald-400">${stats.completedCards}</span>
          <p class="text-[10px] text-zinc-400 font-semibold">Listas para canjear</p>
        </div>

        <div class="glass-panel p-5 rounded-3xl space-y-1">
          <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Canjes Realizados</span>
          <span class="text-2xl lg:text-3xl font-extrabold text-purple-400">${stats.totalRedemptions}</span>
          <p class="text-[10px] text-sky-400 font-semibold">Tasa de \u00E9xito: ${stats.redemptionRate}%</p>
        </div>
      </div>

      <div class="glass-panel p-5 rounded-3xl space-y-4">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <span>\u263A</span> Clientes y Progreso Reciente
          </h3>
          <a href="#/admin/customers" class="text-xs text-sky-400 hover:text-sky-300 font-semibold">Ver todos (${customers.length}) &rarr;</a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          ${customers.slice(0, 3).map(c => {
            const card = customerService.getCardByCustomerId(business.id, c.id);
            const maxStamps = program ? program.stamps_required : 10;
            const currentStamps = card ? card.stamps_count : 0;
            return `
              <div class="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-white text-xs">${c.first_name} ${c.last_name || ''}</span>
                  <span class="font-mono text-[10px] text-sky-400 font-bold">${currentStamps}/${maxStamps} sellos</span>
                </div>
                <div class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div class="h-full bg-sky-400 rounded-full" style="width: ${(currentStamps / maxStamps) * 100}%;"></div>
                </div>
                <div class="flex justify-between items-center pt-1 text-[10px] text-zinc-500">
                  <span>#${card?.card_number || 'N/A'}</span>
                  <a href="#/c/${card?.secure_token}" target="_blank" class="text-sky-400 hover:underline">Ver tarjeta</a>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Modal QR Acquisition in Dashboard -->
      <div id="modal-qr-acquisition-dash" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden items-center justify-center p-4">
        <div class="bg-[#12141C] border border-zinc-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 text-center relative">
          <button id="btn-close-qr-dash-modal" class="absolute top-5 right-5 text-zinc-400 hover:text-white font-black text-lg">&times;</button>
          
          <div class="flex flex-col items-center space-y-2">
            <img src="${business.logo_url}" alt="${business.name}" class="w-16 h-16 rounded-2xl object-cover border border-white/20 shadow-lg">
            <h3 class="text-lg font-black text-white">${business.name}</h3>
            <p class="text-xs text-sky-400 font-bold uppercase tracking-wider">Cartel QR para Captaci\u00F3n de Clientes</p>
          </div>

          <div class="bg-white p-4 rounded-3xl shadow-2xl inline-block mx-auto">
            <div id="modal-qr-box-dash" class="w-48 h-48 flex items-center justify-center"></div>
            <p class="text-[10px] font-mono font-bold text-zinc-800 mt-2 uppercase tracking-wider">\u00A1Escanea para unirte!</p>
          </div>

          <div class="space-y-2 text-left bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Enlace Directo de Registro</span>
            <div class="flex items-center gap-2">
              <input type="text" readonly value="${joinUrl}" class="flex-1 bg-black/40 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 font-mono select-all">
              <button id="modal-btn-copy-link-dash" class="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs rounded-xl shadow transition">
                Copiar
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2">
            <a href="${joinUrl}" target="_blank" class="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5">
              <span>\u2197</span> Abrir Enlace
            </a>
            <button id="btn-print-qr-dash" class="py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-1.5">
              <span>\u2399</span> Imprimir Cartel
            </button>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      initQRCode('join-qr-container', joinUrl, 120, 120);
    }, 50);

    const btnCopy = mainContent.querySelector('#btn-copy-join-link');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(joinUrl);
        toast.success('Enlace de captación copiado al portapapeles.');
      });
    }



    const qrDashModal = mainContent.querySelector('#modal-qr-acquisition-dash');
    const btnDashOpenQr = mainContent.querySelector('#btn-dash-open-qr');
    const btnDashQrBox = mainContent.querySelector('#btn-dash-qr-box');
    const btnCloseDashQr = mainContent.querySelector('#btn-close-qr-dash-modal');
    const btnCopyDashQr = mainContent.querySelector('#modal-btn-copy-link-dash');
    const btnPrintDashQr = mainContent.querySelector('#btn-print-qr-dash');

    const openDashModal = () => {
      if (qrDashModal) {
        qrDashModal.classList.remove('hidden');
        qrDashModal.classList.add('flex');
        initQRCode('modal-qr-box-dash', joinUrl, 190, 190);
      }
    };

    if (btnDashOpenQr) btnDashOpenQr.addEventListener('click', openDashModal);
    if (btnDashQrBox) btnDashQrBox.addEventListener('click', openDashModal);
    if (btnCloseDashQr && qrDashModal) {
      btnCloseDashQr.addEventListener('click', () => {
        qrDashModal.classList.add('hidden');
        qrDashModal.classList.remove('flex');
      });
    }

    if (btnCopyDashQr) {
      btnCopyDashQr.addEventListener('click', () => {
        navigator.clipboard.writeText(joinUrl);
        toast.success('Enlace de captaci\u00F3n copiado al portapapeles.');
      });
    }

    if (btnPrintDashQr) {
      btnPrintDashQr.addEventListener('click', () => {
        const printWin = window.open('', '_blank');
        printWin.document.write(`
          <html>
            <head>
              <title>Cartel QR \u2022 ${business.name}</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; background: #fff; color: #000; }
                .card { max-width: 400px; margin: 0 auto; border: 2px solid #000; border-radius: 24px; padding: 30px; }
                img.logo { width: 80px; height: 80px; border-radius: 16px; object-fit: cover; }
                h1 { margin: 15px 0 5px 0; font-size: 26px; }
                p.sub { font-size: 14px; color: #555; margin-bottom: 20px; font-weight: bold; }
                .qr-box { margin: 20px 0; }
                .footer { font-size: 12px; color: #888; margin-top: 15px; }
              </style>
            </head>
            <body>
              <div class="card">
                <img src="${business.logo_url}" class="logo" alt="Logo">
                <h1>${business.name}</h1>
                <p class="sub">\u00A1Escanea con tu m\u00F3vil y consigue tu tarjeta de sellos gratis!</p>
                <div class="qr-box">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(joinUrl)}" width="220" height="220" alt="QR">
                </div>
                <p style="font-weight: bold; font-size: 14px;">${program?.reward_name || 'Recompensas exclusivas'}</p>
                <p class="footer">Sin descargar aplicaciones \u2022 VYNTA Loyalty</p>
              </div>
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
          </html>
        `);
        printWin.document.close();
      });
    }
  }

  container.appendChild(mainContent);
  return container;
}
