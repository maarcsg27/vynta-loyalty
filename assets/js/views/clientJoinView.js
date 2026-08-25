/**
 * VYNTA LOYALTY - Customer Onboarding & Instant Card Join Portal
 */
import { businessService } from '../services/businessService.js';
import { loyaltyService } from '../services/loyaltyService.js';
import { customerService } from '../services/customerService.js';
import { renderLoyaltyCardHTML } from '../components/loyaltyCard.js';
import { toast } from '../components/toast.js';

export function renderClientJoinView(businessId = 'biz_cafe') {
  const container = document.createElement('div');
  container.className = 'min-h-screen bg-[#08090E] text-white flex flex-col items-center justify-center p-4 py-8 selection:bg-sky-500 selection:text-black';

  const business = businessService.getById(businessId) || businessService.getAll()[0];
  const program = loyaltyService.getProgram(business?.id);
  const branding = (program?.branding || business?.branding) || { primary_color: '#0EA5E9' };

  let currentPreviewName = 'Tu Nombre';

  function buildCardPreviewHtml(name) {
    return renderLoyaltyCardHTML({
      business,
      customer: { first_name: name || 'Tu Nombre', last_name: '' },
      card: { card_number: 'NUEVA TARJETA', stamps_count: 0, points_count: 0, secure_token: 'VYNTA-JOIN' },
      program,
      showQr: false,
      containerId: 'join-card-qr-box'
    });
  }

  container.innerHTML = `
    <div class="w-full max-w-md space-y-6">
      
      <!-- Business Header & Branding -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-zinc-400 mb-1">
          <span class="w-2 h-2 rounded-full animate-pulse" style="background-color: ${branding.primary_color}"></span>
          Club de Fidelización Oficial
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight">${business?.name || 'VYNTA'}</h1>
        <p class="text-xs text-zinc-400 font-medium">Acumula visitas y canjea premios exclusivos en cada consumo</p>
      </div>

      <!-- Real Visual Card Preview -->
      <div id="join-card-preview-container" class="transition-all duration-300 drop-shadow-2xl">
        ${buildCardPreviewHtml(currentPreviewName)}
      </div>

      <!-- Registration Form -->
      <div class="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
        <div class="border-b border-zinc-800 pb-3">
          <h2 class="text-sm font-black text-white flex items-center gap-2">
            <span>✨</span> Obtén tu Tarjeta Digital al Instante
          </h2>
          <p class="text-[11px] text-zinc-400 mt-0.5">Completa tus datos para activar tu pase y guardarlo en Apple o Google Wallet.</p>
        </div>

        <form id="form-join-card" class="space-y-3.5">
          <div>
            <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Nombre *</label>
            <input type="text" id="input-join-first-name" name="first_name" required placeholder="Ej: Lucía" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition">
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Apellidos (Opcional)</label>
            <input type="text" name="last_name" placeholder="Ej: Morales Ruiz" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition">
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Teléfono Móvil *</label>
            <input type="tel" name="phone" required placeholder="+34 600 000 000" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition">
          </div>

          <div>
            <label class="block text-[11px] font-semibold text-zinc-400 mb-1">Email (Opcional)</label>
            <input type="email" name="email" placeholder="tu@email.com" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition">
          </div>

          <button type="submit" class="w-full py-3.5 rounded-2xl font-black text-xs text-black shadow-xl transition transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-2" style="background-color: ${branding.primary_color}; box-shadow: 0 10px 25px -5px ${branding.primary_color}66;">
            ✔ Activar Mi Tarjeta y Abrir Pase
          </button>
        </form>
      </div>

      <!-- Footer Info -->
      <div class="text-center text-[10px] text-zinc-500 space-y-1">
        <p>📱 Compatible con Apple Wallet, Google Wallet y navegadores móviles</p>
        <p>Sin descargas de aplicaciones • Powered by <strong class="text-zinc-400">VYNTA</strong></p>
      </div>
    </div>
  `;

  // Live update card preview as customer types their name
  const nameInput = container.querySelector('#input-join-first-name');
  const cardPreviewContainer = container.querySelector('#join-card-preview-container');

  if (nameInput && cardPreviewContainer) {
    nameInput.addEventListener('input', () => {
      const typed = nameInput.value.trim() || 'Tu Nombre';
      cardPreviewContainer.innerHTML = buildCardPreviewHtml(typed);
    });
  }

  const form = container.querySelector('#form-join-card');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Activando Pase...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = customerService.create(business.id, data, { name: 'Autoregistro Cliente', role: 'CUSTOMER' });
      toast.fireConfetti();
      toast.success(res.isExisting ? '¡Bienvenido de nuevo! Abriendo tu tarjeta...' : '¡Tarjeta activada con éxito!');
      setTimeout(() => {
        window.location.hash = `#/c/${res.card.secure_token}`;
      }, 350);
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '✔ Activar Mi Tarjeta y Abrir Pase';
      toast.error(err.message);
    }
  });

  return container;
}