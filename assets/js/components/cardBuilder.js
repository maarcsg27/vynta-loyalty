/**
 * VYNTA LOYALTY - Real-Time Card Builder & Multi-Card Customizer
 */
import { businessService } from '../services/businessService.js';
import { loyaltyService } from '../services/loyaltyService.js';
import { planService } from '../services/planService.js';
import { authService } from '../services/authService.js';
import { renderAppleWalletPassHTML, renderGoogleWalletPassHTML, initQRCode } from './loyaltyCard.js';
import { toast } from './toast.js';

export function renderCardBuilder(businessId) {
  const business = businessService.getById(businessId) || businessService.getAll()[0];
  const session = authService.getSession();
  const plan = planService.getBusinessPlan(business?.id);
  const isBasic = plan.id === 'BASIC';

  let allPrograms = loyaltyService.getAllPrograms(business?.id) || [];
  if (allPrograms.length === 0 && business?.id) {
    const defaultProg = loyaltyService.createProgram(business.id, {
      name: 'Tarjeta Cliente Principal',
      reward_name: 'Premio Especial',
      stamps_required: 10,
      points_required: 100,
      card_type: 'points',
      active: true
    }, session);
    allPrograms = [defaultProg];
  }

  const lastActiveProgramId = localStorage.getItem(`vynta_last_active_program_${business?.id}`);
  let activeProgram = (lastActiveProgramId && allPrograms.find(p => p.id === lastActiveProgramId))
    || allPrograms.find(p => p.active)
    || allPrograms[0]
    || {
      id: 'prog_default',
      name: 'Tarjeta Cliente Principal',
      reward_name: 'Premio Especial',
      stamps_required: 10,
      points_required: 100,
      card_type: 'points'
    };

  const container = document.createElement('div');
  container.className = 'flex flex-col h-full w-full space-y-3 min-w-0';

  let activeWalletMode = 'apple'; // 'apple' or 'google'
  let currentLogoUrl = activeProgram.branding?.logo_url || business?.logo_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=128&auto=format&fit=crop&q=80';

  let currentBranding = {
    logo_url: activeProgram.branding?.logo_url || null,
    primary_color: activeProgram.branding?.primary_color || business?.branding?.primary_color || '#0EA5E9',
    secondary_color: activeProgram.branding?.secondary_color || business?.branding?.secondary_color || '#0369A1',
    bg_gradient_from: activeProgram.branding?.bg_gradient_from || business?.branding?.bg_gradient_from || '#0F172A',
    bg_gradient_to: activeProgram.branding?.bg_gradient_to || business?.branding?.bg_gradient_to || '#020617',
    bg_image_url: activeProgram.branding?.bg_image_url || null,
    overlay_opacity: (activeProgram.branding?.overlay_opacity !== undefined) ? activeProgram.branding.overlay_opacity : 0.70,
    stamp_icon: activeProgram.branding?.stamp_icon || 'star',
    stamp_completed_image: activeProgram.branding?.stamp_completed_image || activeProgram.branding?.stamp_custom_image || null,
    stamp_uncompleted_image: activeProgram.branding?.stamp_uncompleted_image || null,
    stamp_custom_image: activeProgram.branding?.stamp_completed_image || activeProgram.branding?.stamp_custom_image || null,
    border_radius: activeProgram.branding?.border_radius || business?.branding?.border_radius || '24px',
    text_color: activeProgram.branding?.text_color || business?.branding?.text_color || '#FFFFFF'
  };

  let cardName = activeProgram.name || 'Tarjeta Digital';
  let totalStamps = Number(activeProgram.stamps_required) || 10;
  let pointsRequired = Number(activeProgram.points_required) || (totalStamps * 10 || 100);
  let pointsRatio = Number(activeProgram.points_ratio) || 10;
  let rewardName = activeProgram.reward_name || 'Recompensa Exclusiva';
  let promoBenefit = activeProgram.promo_benefit || 'Consumici\u00F3n de Bienvenida Gratis';
  let validUntil = activeProgram.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  let terms = activeProgram.terms || 'V\u00E1lido 1 canje por cliente.';
  let discountType = activeProgram.discount_type || 'percentage';
  let discountValue = activeProgram.discount_value !== undefined ? activeProgram.discount_value : 20;
  let couponCode = activeProgram.coupon_code || 'VYNTA-PROMO';
  let minSpend = activeProgram.min_spend || 'Sin consumo m\u00EDnimo';

  function normalizeHex(hex, fallback = '#0F172A') {
    if (!hex || typeof hex !== 'string') return fallback;
    let clean = hex.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (clean.length === 4) {
      clean = '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      return clean.toUpperCase();
    }
    return fallback;
  }

  function getCardTypeLabel(type) {
    if (type === 'stamps') return 'Tarjeta Loyalty (Sellos)';
    if (type === 'single_use_promo') return 'Tarjeta Promo (1 Solo Uso)';
    if (type === 'coupon_discount') return 'Tarjeta Cup\u00F3n (Descuentos)';
    return 'Tarjeta Cliente (Puntos)';
  }

  function getCardTypeIcon(type) {
    if (type === 'stamps') return '\u2B50';
    if (type === 'single_use_promo') return '\u2728';
    if (type === 'coupon_discount') return '\u22C4';
    return '\uD83D\uDCB3';
  }

  function getCardTypeBadgeClass(type) {
    if (type === 'stamps') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (type === 'single_use_promo') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (type === 'coupon_discount') return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
  }

  function getCardTypeDefaultColors(type) {
    if (type === 'stamps') {
      return {
        primary_color: '#F59E0B',
        secondary_color: '#B45309',
        bg_gradient_from: '#1C160C',
        bg_gradient_to: '#0B0905',
        stamp_icon: 'star'
      };
    }
    if (type === 'single_use_promo') {
      return {
        primary_color: '#10B981',
        secondary_color: '#047857',
        bg_gradient_from: '#06281E',
        bg_gradient_to: '#02140E',
        stamp_icon: 'gift'
      };
    }
    if (type === 'coupon_discount') {
      return {
        primary_color: '#8B5CF6',
        secondary_color: '#6D28D9',
        bg_gradient_from: '#1E1035',
        bg_gradient_to: '#0A0518',
        stamp_icon: 'diamond'
      };
    }
    return {
      primary_color: '#0EA5E9',
      secondary_color: '#0369A1',
      bg_gradient_from: '#0F172A',
      bg_gradient_to: '#020617',
      stamp_icon: 'star'
    };
  }

  function updatePreview() {
    const previewContainer = container.querySelector('#card-preview-container');
    if (!previewContainer) return;

    const mockBusiness = {
      ...business,
      logo_url: currentLogoUrl,
      branding: currentBranding
    };

    const mockProgram = {
      ...activeProgram,
      name: cardName,
      stamps_required: totalStamps,
      points_required: pointsRequired,
      points_ratio: pointsRatio,
      reward_name: rewardName,
      promo_benefit: promoBenefit,
      valid_until: validUntil,
      terms: terms,
      discount_type: discountType,
      discount_value: discountValue,
      coupon_code: couponCode,
      min_spend: minSpend,
      branding: currentBranding
    };

    const mockCard = {
      card_number: 'DEMO-0001',
      stamps_count: Math.min(4, totalStamps),
      points_count: Math.min(250, pointsRequired),
      secure_token: 'vyn_demo_preview_token'
    };

    const mockCustomer = {
      first_name: 'Mar\u00EDa',
      last_name: 'Garc\u00EDa'
    };

    if (activeWalletMode === 'apple') {
      previewContainer.innerHTML = renderAppleWalletPassHTML({
        business: mockBusiness,
        customer: mockCustomer,
        card: mockCard,
        program: mockProgram,
        containerId: 'preview-qrcode-box'
      });
    } else {
      previewContainer.innerHTML = renderGoogleWalletPassHTML({
        business: mockBusiness,
        customer: mockCustomer,
        card: mockCard,
        program: mockProgram,
        containerId: 'preview-qrcode-box'
      });
    }

    setTimeout(() => {
      initQRCode('preview-qrcode-box', `${window.location.origin}${window.location.pathname}#/c/vyn_demo_preview_token`, 130, 130);
    }, 40);
  }

  function renderForm() {
    container.innerHTML = `
      <!-- Hidden standalone file inputs outside labels -->
      <input type="file" id="file-card-bg-upload" accept=".png, .jpg, .jpeg, .svg, .webp, image/*" class="hidden">
      <input type="file" id="file-logo-upload" accept=".png, .jpg, .jpeg, .svg, .webp, image/*" class="hidden">
      <input type="file" id="file-stamp-upload" accept=".png, .jpg, .jpeg, .svg, .webp, image/*" class="hidden">
      <input type="file" id="file-stamp-completed-upload" accept=".png, .jpg, .jpeg, .svg, .webp, image/*" class="hidden">
      <input type="file" id="file-stamp-uncompleted-upload" accept=".png, .jpg, .jpeg, .svg, .webp, image/*" class="hidden">

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800 shrink-0">
        <div>
          <h1 class="text-xl font-bold text-white flex items-center gap-2">
            <span>\u270E</span> Dise\u00F1ador y Personalizador de Tarjetas
          </h1>
          <p class="text-xs text-zinc-400 mt-0.5">Crea, edita y personaliza cada modelo de tarjeta digital de forma independiente para Apple & Google Wallet.</p>
        </div>
        <button id="btn-save-branding" class="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-lg transition transform hover:scale-[1.02] flex items-center gap-2 shrink-0 cursor-pointer">
          <span>\u2714</span> Guardar Tarjeta
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full flex-1 min-h-0 pt-1 lg:overflow-hidden items-start">
        <!-- LEFT COLUMN: Independent Scrolling Form Area -->
        <div class="lg:col-span-7 space-y-5 w-full lg:h-full lg:overflow-y-auto pr-2 pb-28" style="scrollbar-gutter: stable;">

          <!-- TOP ACTION BAR: CARD SELECTOR & CREATOR -->
          ${(() => {
            const topBarThemes = {
              points: {
                border: 'border-sky-500/40 bg-gradient-to-r from-sky-950/50 via-zinc-900 to-sky-950/30',
                labelColor: 'text-sky-400',
                badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                focusBorder: 'focus:border-sky-500'
              },
              stamps: {
                border: 'border-amber-500/40 bg-gradient-to-r from-amber-950/50 via-zinc-900 to-amber-950/30',
                labelColor: 'text-amber-400',
                badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                focusBorder: 'focus:border-amber-500'
              },
              single_use_promo: {
                border: 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/50 via-zinc-900 to-emerald-950/30',
                labelColor: 'text-emerald-400',
                badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                focusBorder: 'focus:border-emerald-500'
              },
              coupon_discount: {
                border: 'border-purple-500/40 bg-gradient-to-r from-purple-950/50 via-zinc-900 to-purple-950/30',
                labelColor: 'text-purple-400',
                badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                focusBorder: 'focus:border-purple-500'
              }
            };
            const barTheme = topBarThemes[activeProgram.card_type] || topBarThemes.points;

            return `
              <div class="glass-panel p-4 sm:p-5 rounded-3xl border-2 ${barTheme.border} shadow-2xl space-y-4">
                <!-- Header Row: Status and Action Buttons -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-center flex-wrap gap-2 min-w-0">
                    <span class="text-[10px] font-extrabold uppercase tracking-wider ${barTheme.labelColor}">Editando Tarjeta:</span>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${barTheme.badge} flex items-center gap-1">
                      ${getCardTypeIcon(activeProgram.card_type)} ${getCardTypeLabel(activeProgram.card_type)}
                    </span>
                  </div>

                  <div class="flex items-center gap-2 flex-wrap">
                    <!-- Button to Create New Card -->
                    <button type="button" id="btn-open-create-card-modal" class="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shadow-lg transition transform hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer">
                      <span class="font-extrabold">+</span> Crear Nueva Tarjeta
                    </button>

                    ${allPrograms.length > 1 ? `
                      <button type="button" id="btn-delete-current-builder-card" title="Eliminar esta tarjeta" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center cursor-pointer">
                        <span>\uD83D\uDDD1\uFE0F</span>
                      </button>
                    ` : ''}
                  </div>
                </div>

                <!-- Controls Grid: Card Selector & Name Edit -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10">
                  <div class="space-y-1.5">
                    <label for="select-card-to-edit" class="block text-[11px] font-bold text-zinc-300">Cambiar / Seleccionar Tarjeta:</label>
                    <select id="select-card-to-edit" class="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none cursor-pointer transition">
                      ${allPrograms.map(p => `
                        <option value="${p.id}" ${p.id === activeProgram.id ? 'selected' : ''}>
                          ${p.id === activeProgram.id ? '\u25B6 ' : ''}${getCardTypeIcon(p.card_type)} ${p.name} \u2022 ${getCardTypeLabel(p.card_type)}
                        </option>
                      `).join('')}
                    </select>
                  </div>

                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <label for="input-card-title-name" class="block text-[11px] font-bold text-zinc-300">Nombre de la Tarjeta / Programa:</label>
                      <span id="char-count-card-name" class="text-[10px] font-mono text-zinc-400 font-bold">${cardName.length} / 45 car.</span>
                    </div>
                    <input type="text" id="input-card-title-name" maxlength="45" value="${cardName}" placeholder="Nombre de esta tarjeta..." class="w-full bg-zinc-900/90 border border-zinc-700 hover:border-zinc-600 ${barTheme.focusBorder} rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition">
                    <p class="text-[10px] text-zinc-400">M\u00E1x. 45 caracteres (Google Wallet y Apple Wallet cortar\u00E1n con "..." si se supera este l\u00EDmite).</p>
                  </div>
                </div>
              </div>
            `;
          })()}

          <!-- 1. IMPORTAR LOGOTIPO DEL COMERCIO -->
          <div class="glass-panel p-5 rounded-3xl space-y-4 border border-white/5">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <span>\uD83D\uDDBC\uFE0F</span> 1. Logotipo del Comercio (Apple & Google Wallet)
                </h2>
                <p class="text-[11px] text-zinc-400 mt-0.5">Se mostrar\u00E1 en la esquina superior de la tarjeta en el m\u00F3vil.</p>
              </div>
              <span class="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">Cabecera</span>
            </div>

            <!-- Wallet Specs Helper Badge -->
            <div class="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/30 space-y-1.5 text-xs text-sky-200">
              <div class="flex items-center gap-2 font-bold text-sky-300">
                <span>\u2139\uFE0F</span> Requisitos oficiales de Logotipo para Wallet:
              </div>
              <ul class="list-disc list-inside text-[11px] space-y-0.5 text-zinc-300">
                <li><strong>Tama\u00F1o ideal:</strong> <code>660 x 660 px</code> (M\u00EDnimo: <code>480 x 480 px</code>), proporci\u00F3n 1:1.</li>
                <li><strong>Formato:</strong> PNG con <strong>fondo transparente</strong>.</li>
                <li><strong>Regla de oro Google Wallet:</strong> Se recorta autom\u00E1ticamente en forma de <strong>c\u00EDrculo</strong>. Aseg\u00FArate de que el icono est\u00E9 centrado y deja un 15% de margen libre en las esquinas.</li>
              </ul>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div class="sm:col-span-4 flex flex-col items-center justify-center p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                <div class="w-20 h-20 rounded-2xl border border-white/20 shadow-md bg-white/90 flex items-center justify-center p-1.5 overflow-hidden">
                  <img id="img-logo-preview" src="${currentLogoUrl}" alt="Logo" class="max-w-full max-h-full object-contain">
                </div>
                <span class="text-[10px] text-zinc-400 mt-2 font-bold">Previsualizaci\u00F3n en Pase</span>
              </div>

              <div class="sm:col-span-8 space-y-3">
                <div id="dropzone-logo" class="border-2 border-dashed border-zinc-700 hover:border-sky-500 rounded-2xl p-4 text-center cursor-pointer transition bg-zinc-900/40 hover:bg-sky-500/5 group">
                  <span class="text-xl block mb-1 group-hover:scale-110 transition">\u2912</span>
                  <p class="text-xs font-bold text-white group-hover:text-sky-400 transition">\u00A1Arrastra tu logo PNG transparente aqu\u00ED o pulsa para subir!</p>
                  <p class="text-[10px] text-zinc-500 mt-0.5">PNG transparente recomendado (m\u00E1x. 5MB)</p>
                  <div class="mt-2.5 flex justify-center">
                    <button type="button" id="btn-trigger-logo-select" class="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer">
                      <span>\uD83D\uDCC1</span> Seleccionar Archivo PNG
                    </button>
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">O pegar enlace directo de imagen (URL)</label>
                  <input type="url" id="input-logo-url" value="${currentLogoUrl.startsWith('data:') ? '' : currentLogoUrl}" placeholder="https://mi-dominio.com/logo.png" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 font-mono">
                </div>
              </div>
            </div>

            <!-- Red Error Alert Container for Logo -->
            <div id="alert-logo-error" class="hidden mt-3 p-3.5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-200 text-xs space-y-1.5 animate-fade-in shadow-lg">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-start gap-2.5">
                  <span class="text-rose-400 text-base leading-none shrink-0 mt-0.5">\u26A0\uFE0F</span>
                  <div>
                    <strong class="font-bold text-rose-300 block text-xs">No se puede a\u00F1adir el archivo porque no cumple con los requisitos:</strong>
                    <p class="text-[11px] text-rose-200 mt-1 leading-relaxed" id="alert-logo-error-msg"></p>
                  </div>
                </div>
                <button type="button" class="btn-dismiss-alert text-rose-400 hover:text-white text-sm font-bold cursor-pointer px-1.5 leading-none" data-target="alert-logo-error">\u2715</button>
              </div>
            </div>

            <!-- Quick Selection Library: Saved Logos -->
            <div class="mt-3 pt-3 border-t border-zinc-800/80 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>\uD83D\uDCBE</span> Logos Guardados (Selecci\u00F3n R\u00E1pida):
                </span>
                <span class="text-[9px] text-zinc-500 font-mono">Disponibles para futuras ediciones</span>
              </div>
              <div id="quick-saved-logo-list" class="flex flex-wrap gap-2 items-center"></div>
            </div>

            <div class="pt-2 border-t border-zinc-800/80">
              <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Logos de Muestra R\u00E1pidos</span>
              <div class="flex flex-wrap gap-2">
                <button type="button" data-sample-logo="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=128&auto=format&fit=crop&q=80" class="btn-sample-logo px-3 py-1.5 rounded-xl text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition">Cafeter\u00EDa</button>
                <button type="button" data-sample-logo="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=128&auto=format&fit=crop&q=80" class="btn-sample-logo px-3 py-1.5 rounded-xl text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition">Barber\u00EDa</button>
                <button type="button" data-sample-logo="https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=128&auto=format&fit=crop&q=80" class="btn-sample-logo px-3 py-1.5 rounded-xl text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition">Tatuajes</button>
                <button type="button" data-sample-logo="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=128&auto=format&fit=crop&q=80" class="btn-sample-logo px-3 py-1.5 rounded-xl text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition">Burger</button>
                <button type="button" data-sample-logo="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=128&auto=format&fit=crop&q=80" class="btn-sample-logo px-3 py-1.5 rounded-xl text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition">Fitness</button>
              </div>
            </div>
          </div>

          <!-- ADAPTIVE SECTIONS ACCORDING TO CARD TYPE -->
          ${activeProgram.card_type === 'single_use_promo' ? `
            <!-- SPECIFIC FOR PROMO (1 SOLO USO) -->
            <div class="glass-panel p-5 rounded-3xl space-y-4 border border-emerald-500/30 shadow-lg">
              <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <span>\u2728</span> 2. Beneficio de Bienvenida & Textos Cortos
                </h2>
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/50">
                  1 Solo Uso
                </span>
              </div>

              <!-- Short Text Guidelines Helper -->
              <div class="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1 text-xs text-emerald-200">
                <div class="flex items-center gap-1.5 font-bold text-emerald-300">
                  <span>\uD83C\uDFF7\uFE0F</span> Textos y Etiquetas Cortas para Wallet:
                </div>
                <p class="text-[11px] text-zinc-300">
                  Las Wallets tienen espacio limitado. Mant\u00E9n el beneficio corto (m\u00E1x. 25-30 caracteres) como <em>\u201C15\u20AC Descuento Bienvenida\u201D</em> o <em>\u201C1 Bebida Gratis\u201D</em>.
                </p>
              </div>

              <div class="space-y-3.5">
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-xs font-bold text-zinc-300">Beneficio / Premio de Bienvenida *</label>
                    <span id="char-count-promo-benefit" class="text-[10px] font-mono text-zinc-400 font-bold">${promoBenefit.length} / 30 car.</span>
                  </div>
                  <input type="text" id="input-promo-benefit" maxlength="30" value="${promoBenefit}" placeholder="Ej: 1 Bebida Gratis, 15\u20AC DTO Bienvenida" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500">
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-bold text-zinc-300 mb-1">Fecha L\u00EDmite de Validez</label>
                    <input type="date" id="input-valid-until" value="${validUntil}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-zinc-300 mb-1">Tipo de Canje</label>
                    <input type="text" readonly value="1 Solo Uso por Cliente" class="w-full bg-black/40 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-bold">
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-zinc-300 mb-1">T\u00E9rminos y Condiciones Cortos</label>
                  <input type="text" id="input-promo-terms" maxlength="80" value="${terms}" placeholder="Ej: V\u00E1lido 1 canje por cliente. No acumulable." class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500">
                </div>
              </div>
            </div>
          ` : activeProgram.card_type === 'coupon_discount' ? `
            <!-- SPECIFIC FOR CUPON (DESCUENTOS) -->
            <div class="glass-panel p-5 rounded-3xl space-y-4 border border-purple-500/30 shadow-lg">
              <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <span>\u22C4</span> 2. Par\u00E1metros del Cup\u00F3n de Descuento
                </h2>
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/50">
                  Cup\u00F3n DTO
                </span>
              </div>

              <!-- Short Text Guidelines Helper -->
              <div class="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-1 text-xs text-purple-200">
                <div class="flex items-center gap-1.5 font-bold text-purple-300">
                  <span>\uD83C\uDFF7\uFE0F</span> Etiquetas Cortas para Wallet:
                </div>
                <p class="text-[11px] text-zinc-300">
                  Se mostrar\u00E1n etiquetas directas como <strong>DTO</strong>, <strong>C\u00D3DIGO</strong> y <strong>CONDICIONES</strong> en el pase del m\u00F3vil.
                </p>
              </div>

              <div class="space-y-3.5">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-bold text-zinc-300 mb-1">Tipo de Descuento</label>
                    <select id="select-discount-type" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer">
                      <option value="percentage" ${discountType === 'percentage' ? 'selected' : ''}>Porcentaje (%)</option>
                      <option value="fixed" ${discountType === 'fixed' ? 'selected' : ''}>Importe Fijo (\u20AC)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-zinc-300 mb-1">Valor del Descuento</label>
                    <input type="number" id="input-discount-val" value="${discountValue}" min="1" max="100" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono">
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-bold text-zinc-300 mb-1">C\u00F3digo del Cup\u00F3n (Corto)</label>
                    <input type="text" id="input-coupon-code" maxlength="15" value="${couponCode}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono uppercase font-bold focus:outline-none focus:border-purple-500">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-zinc-300 mb-1">Gasto M\u00EDnimo</label>
                    <input type="text" id="input-min-spend" maxlength="25" value="${minSpend}" placeholder="Ej: Pedido m\u00EDnimo 20\u20AC" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500">
                  </div>
                </div>
              </div>
            </div>
          ` : activeProgram.card_type === 'stamps' ? `
            <!-- SPECIFIC FOR TARJETA LOYALTY (SELLOS) -->
            <div class="glass-panel p-5 rounded-3xl space-y-5 border border-amber-500/20 shadow-lg">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div>
                  <h2 class="text-sm font-bold text-white flex items-center gap-2">
                    <span>\u2605</span> 2. Dise\u00F1o e Imagen de los Sellos (.PNG / Iconos)
                  </h2>
                  <p class="text-[11px] text-zinc-400 mt-0.5">Configura de forma independiente la foto del sello completado y del sello sin completar.</p>
                </div>
                <span id="badge-stamp-mode" class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${
                  currentBranding.stamp_completed_image && currentBranding.stamp_uncompleted_image
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : currentBranding.stamp_completed_image
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                }">
                  ${
                    currentBranding.stamp_completed_image && currentBranding.stamp_uncompleted_image
                      ? '\u2714 2 Sellos Personalizados Activos'
                      : currentBranding.stamp_completed_image
                      ? '\u2714 Sello Completado Personalizado'
                      : 'Iconos Vectoriales'
                  }
                </span>
              </div>

              <!-- DUAL STAMP CUSTOMIZATION GRID (COMPLETED vs UNCOMPLETED) -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <!-- 2.1 SELLO COMPLETADO (OBTENIDO / ACTIVO) -->
                <div class="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-3 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-1.5">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        <span class="text-xs font-bold text-white">Sello Completado</span>
                        <span class="text-[10px] text-emerald-400 font-semibold">(Obtenido)</span>
                      </div>
                      <button type="button" id="btn-clear-stamp-completed-img" class="${currentBranding.stamp_completed_image ? '' : 'hidden'} text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer">
                        <span>\u2715</span> Quitar
                      </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div id="box-stamp-completed-preview" class="sm:col-span-5 h-24 rounded-2xl border-2 border-dashed border-amber-500/40 flex flex-col items-center justify-center bg-black/60 shrink-0 overflow-hidden p-2 text-center">
                        ${currentBranding.stamp_completed_image ? `
                          <img src="${currentBranding.stamp_completed_image}" class="w-12 h-12 object-contain filter drop-shadow" alt="sello completado preview">
                          <span class="text-[9px] text-amber-300 mt-1 font-bold">.PNG Activo</span>
                        ` : `
                          <span class="text-2xl text-amber-400 font-bold">\u2605</span>
                          <span class="text-[9px] text-zinc-500 font-bold mt-1">Sin Imagen</span>
                        `}
                      </div>

                      <div class="sm:col-span-7 space-y-2">
                        <div id="dropzone-stamp-completed" class="border border-dashed border-amber-500/40 hover:border-amber-400 rounded-xl p-2.5 text-center cursor-pointer transition bg-amber-500/5 hover:bg-amber-500/15 group">
                          <p class="text-[11px] font-bold text-amber-300 group-hover:text-amber-200 transition flex items-center justify-center gap-1">
                            <span>\u2912</span> Arrastra o sube PNG
                          </p>
                          <button type="button" id="btn-trigger-stamp-completed-select" class="mt-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition flex items-center justify-center gap-1 w-full cursor-pointer">
                            <span>\uD83D\uDCC1</span> Subir Sello Activo
                          </button>
                        </div>

                        <input type="url" id="input-stamp-completed-url" value="${currentBranding.stamp_completed_image && !currentBranding.stamp_completed_image.startsWith('data:') ? currentBranding.stamp_completed_image : ''}" placeholder="O pegar enlace URL..." class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono">
                      </div>
                    </div>
                  </div>

                  <!-- Red Error Alert Container for Stamp Completed -->
                  <div id="alert-stamp_completed-error" class="hidden mt-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-200 text-xs space-y-1 animate-fade-in">
                    <div class="flex items-start justify-between gap-1.5">
                      <div class="flex items-start gap-2">
                        <span class="text-rose-400 text-sm leading-none shrink-0 mt-0.5">\u26A0\uFE0F</span>
                        <div>
                          <strong class="font-bold text-rose-300 block text-[11px]">No se puede a\u00F1adir el archivo:</strong>
                          <p class="text-[10px] text-rose-200 mt-0.5 leading-relaxed" id="alert-stamp_completed-error-msg"></p>
                        </div>
                      </div>
                      <button type="button" class="btn-dismiss-alert text-rose-400 hover:text-white text-xs font-bold px-1" data-target="alert-stamp_completed-error">\u2715</button>
                    </div>
                  </div>

                  <!-- Quick Selection Library: Saved Completed Stamps -->
                  <div class="pt-2 border-t border-zinc-800/80 space-y-1">
                    <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Sellos Activos Guardados:</span>
                    <div id="quick-saved-stamp_completed-list" class="flex flex-wrap gap-1.5 items-center"></div>
                  </div>

                  <!-- Fast Sample Completed Stamps -->
                  <div class="pt-2 border-t border-zinc-800/80">
                    <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Muestras Sello Activo:</span>
                    <div class="flex flex-wrap gap-1.5">
                      <button type="button" data-sample-completed="https://cdn-icons-png.flaticon.com/512/924/924514.png" class="btn-sample-stamp-completed px-2 py-0.5 rounded-md text-[10px] bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\u2615</span> Caf\u00E9</button>
                      <button type="button" data-sample-completed="https://cdn-icons-png.flaticon.com/512/1000/1000966.png" class="btn-sample-stamp-completed px-2 py-0.5 rounded-md text-[10px] bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\u2702\uFE0F</span> Barber\u00EDa</button>
                      <button type="button" data-sample-completed="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" class="btn-sample-stamp-completed px-2 py-0.5 rounded-md text-[10px] bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\u2B50</span> Estrella</button>
                      <button type="button" data-sample-completed="https://cdn-icons-png.flaticon.com/512/785/785116.png" class="btn-sample-stamp-completed px-2 py-0.5 rounded-md text-[10px] bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\u2764\uFE0F</span> Coraz\u00F3n</button>
                      <button type="button" data-sample-completed="https://cdn-icons-png.flaticon.com/512/4213/4213651.png" class="btn-sample-stamp-completed px-2 py-0.5 rounded-md text-[10px] bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\uD83C\uDF81</span> Regalo</button>
                    </div>
                  </div>
                </div>

                <!-- 2.2 SELLO SIN COMPLETAR (PENDIENTE / VACIO) -->
                <div class="p-4 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-3 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-1.5">
                        <span class="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
                        <span class="text-xs font-bold text-white">Sello Sin Completar</span>
                        <span class="text-[10px] text-zinc-400 font-semibold">(Pendiente / Vac\u00EDo)</span>
                      </div>
                      <button type="button" id="btn-clear-stamp-uncompleted-img" class="${currentBranding.stamp_uncompleted_image ? '' : 'hidden'} text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer">
                        <span>\u2715</span> Quitar
                      </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div id="box-stamp-uncompleted-preview" class="sm:col-span-5 h-24 rounded-2xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center bg-black/60 shrink-0 overflow-hidden p-2 text-center">
                        ${currentBranding.stamp_uncompleted_image ? `
                          <img src="${currentBranding.stamp_uncompleted_image}" class="w-12 h-12 object-contain opacity-75 filter drop-shadow" alt="sello sin completar preview">
                          <span class="text-[9px] text-zinc-300 mt-1 font-bold">.PNG Vac\u00EDo</span>
                        ` : `
                          <span class="text-2xl text-zinc-500 font-bold">\u2606</span>
                          <span class="text-[9px] text-zinc-400 font-bold mt-1">Sin Imagen (Silueta)</span>
                        `}
                      </div>

                      <div class="sm:col-span-7 space-y-2">
                        <div id="dropzone-stamp-uncompleted" class="border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-2.5 text-center cursor-pointer transition bg-zinc-800/30 hover:bg-zinc-800/60 group">
                          <p class="text-[11px] font-bold text-zinc-300 group-hover:text-white transition flex items-center justify-center gap-1">
                            <span>\u2912</span> Arrastra o sube PNG
                          </p>
                          <button type="button" id="btn-trigger-stamp-uncompleted-select" class="mt-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[10px] font-bold transition flex items-center justify-center gap-1 w-full cursor-pointer">
                            <span>\uD83D\uDCC1</span> Subir Sello Vac\u00EDo
                          </button>
                        </div>

                        <input type="url" id="input-stamp-uncompleted-url" value="${currentBranding.stamp_uncompleted_image && !currentBranding.stamp_uncompleted_image.startsWith('data:') ? currentBranding.stamp_uncompleted_image : ''}" placeholder="O pegar enlace URL..." class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono">
                      </div>
                    </div>
                  </div>

                  <!-- Red Error Alert Container for Stamp Uncompleted -->
                  <div id="alert-stamp_uncompleted-error" class="hidden mt-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-200 text-xs space-y-1 animate-fade-in">
                    <div class="flex items-start justify-between gap-1.5">
                      <div class="flex items-start gap-2">
                        <span class="text-rose-400 text-sm leading-none shrink-0 mt-0.5">\u26A0\uFE0F</span>
                        <div>
                          <strong class="font-bold text-rose-300 block text-[11px]">No se puede a\u00F1adir el archivo:</strong>
                          <p class="text-[10px] text-rose-200 mt-0.5 leading-relaxed" id="alert-stamp_uncompleted-error-msg"></p>
                        </div>
                      </div>
                      <button type="button" class="btn-dismiss-alert text-rose-400 hover:text-white text-xs font-bold px-1" data-target="alert-stamp_uncompleted-error">\u2715</button>
                    </div>
                  </div>

                  <!-- Quick Selection Library: Saved Uncompleted Stamps -->
                  <div class="pt-2 border-t border-zinc-800/80 space-y-1">
                    <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Sellos Vac\u00EDos Guardados:</span>
                    <div id="quick-saved-stamp_uncompleted-list" class="flex flex-wrap gap-1.5 items-center"></div>
                  </div>

                  <!-- Fast Sample Uncompleted Stamps -->
                  <div class="pt-2 border-t border-zinc-800/80">
                    <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Muestras Sello Vac\u00EDo:</span>
                    <div class="flex flex-wrap gap-1.5">
                      <button type="button" data-sample-uncompleted="https://cdn-icons-png.flaticon.com/512/481/481078.png" class="btn-sample-stamp-uncompleted px-2 py-0.5 rounded-md text-[10px] bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-zinc-300 transition flex items-center gap-1"><span>\u2B55</span> C\u00EDrculo</button>
                      <button type="button" data-sample-uncompleted="https://cdn-icons-png.flaticon.com/512/1047/1047293.png" class="btn-sample-stamp-uncompleted px-2 py-0.5 rounded-md text-[10px] bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-zinc-300 transition flex items-center gap-1"><span>\u2615</span> Taza Vac\u00EDa</button>
                      <button type="button" data-sample-uncompleted="https://cdn-icons-png.flaticon.com/512/3064/3064155.png" class="btn-sample-stamp-uncompleted px-2 py-0.5 rounded-md text-[10px] bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-zinc-300 transition flex items-center gap-1"><span>\uD83D\uDD12</span> Candado</button>
                      <button type="button" data-sample-uncompleted="https://cdn-icons-png.flaticon.com/512/1828/1828970.png" class="btn-sample-stamp-uncompleted px-2 py-0.5 rounded-md text-[10px] bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-zinc-300 transition flex items-center gap-1"><span>\u2B50</span> Silueta</button>
                      <button type="button" data-sample-uncompleted="https://cdn-icons-png.flaticon.com/512/850/850960.png" class="btn-sample-stamp-uncompleted px-2 py-0.5 rounded-md text-[10px] bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-zinc-300 transition flex items-center gap-1"><span>\uD83D\uDD52</span> Reloj</button>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Predefined Vector Icons Selector (Option C) -->
              <div class="space-y-2 pt-2 border-t border-zinc-800">
                <span class="block text-xs font-bold text-zinc-300">Opci\u00F3n C: O seleccionar Icono Vectorial por defecto (si no subes imagen):</span>
                <div class="grid grid-cols-5 sm:grid-cols-10 gap-2" id="icon-selector-grid">
                  ${[
                    { id: 'coffee', label: 'Caf\u00E9' },
                    { id: 'scissors', label: 'Tijeras' },
                    { id: 'flame', label: 'Fuego' },
                    { id: 'star', label: 'Estrella' },
                    { id: 'heart', label: 'Coraz\u00F3n' },
                    { id: 'shisha', label: 'Shisha' },
                    { id: 'burger', label: 'Burger' },
                    { id: 'drink', label: 'Bebida' },
                    { id: 'diamond', label: 'Diamante' },
                    { id: 'gift', label: 'Regalo' }
                  ].map(item => `
                    <button type="button" data-icon="${item.id}" class="btn-select-icon p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition ${
                      !currentBranding.stamp_completed_image && currentBranding.stamp_icon === item.id 
                        ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-md' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }">
                      <span class="text-[11px] font-bold">${item.label}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- 3. CONFIGURACION DE SELLOS & RECOMPENSA -->
            <div class="glass-panel p-5 rounded-3xl space-y-4 border border-white/5">
              <h2 class="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                <span>\u2606</span> 3. Recompensa y Sellos Requeridos (Textos Cortos)
              </h2>

              <!-- Short Text Guidelines Helper -->
              <div class="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1 text-xs text-amber-200">
                <div class="flex items-center gap-1.5 font-bold text-amber-300">
                  <span>\u270D\uFE0F</span> Restricciones de Texto para Wallet (Evita que se corte con "..."):
                </div>
                <ul class="list-disc list-inside text-[11px] space-y-0.5 text-zinc-300">
                  <li><strong>T\u00EDtulo del campo / Premio:</strong> M\u00E1ximo <strong>20 caracteres</strong> (Ej: <em>\u201C1 Shisha Gratis\u201D</em>, <em>\u201C1 Caf\u00E9 + Tarta\u201D</em>).</li>
                  <li><strong>Valor del campo:</strong> M\u00E1ximo <strong>15 caracteres</strong> (Ej: <em>\u201C5 de 10\u201D</em>, <em>\u201C100 PTS\u201D</em>).</li>
                </ul>
              </div>

              <div class="space-y-3">
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-xs font-bold text-zinc-300">Nombre del Premio / Recompensa *</label>
                    <span id="char-count-reward-name" class="text-[10px] font-mono text-zinc-400 font-bold">${rewardName.length} / 20 car.</span>
                  </div>
                  <input type="text" id="input-reward-name" maxlength="30" value="${rewardName}" placeholder="Ej: 1 Shisha Gratis, 1 Caf\u00E9" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500">
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-zinc-300 mb-1">Total Sellos por Tarjeta</label>
                    <select id="select-total-stamps" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer">
                      <option value="5" ${totalStamps === 5 ? 'selected' : ''}>5 Sellos (R\u00E1pido)</option>
                      <option value="6" ${totalStamps === 6 ? 'selected' : ''}>6 Sellos</option>
                      <option value="8" ${totalStamps === 8 ? 'selected' : ''}>8 Sellos</option>
                      <option value="10" ${totalStamps === 10 ? 'selected' : ''}>10 Sellos (Est\u00E1ndar)</option>
                      <option value="12" ${totalStamps === 12 ? 'selected' : ''}>12 Sellos</option>
                      <option value="15" ${totalStamps === 15 ? 'selected' : ''}>15 Sellos</option>
                      <option value="20" ${totalStamps === 20 ? 'selected' : ''}>20 Sellos</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-zinc-300 mb-1">Curvatura de Bordes</label>
                    <select id="select-border-radius" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer">
                      <option value="16px" ${currentBranding.border_radius === '16px' ? 'selected' : ''}>Suave (16px)</option>
                      <option value="24px" ${currentBranding.border_radius === '24px' ? 'selected' : ''}>Redondeado (24px)</option>
                      <option value="32px" ${currentBranding.border_radius === '32px' ? 'selected' : ''}>Ultra Redondo (32px)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ` : `
            <!-- SPECIFIC FOR TARJETA CLIENTE (PUNTOS) -->
            <div class="glass-panel p-5 rounded-3xl space-y-4 border border-sky-500/30 shadow-lg">
              <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <span>\uD83D\uDCB3</span> 2. Configuraci\u00F3n de Puntos & Recompensa (Textos Cortos)
                </h2>
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-sky-500/20 text-sky-300 border-sky-500/50">
                  Sistema de Puntos Activo
                </span>
              </div>

              <!-- Short Text Guidelines Helper -->
              <div class="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/30 space-y-1 text-xs text-sky-200">
                <div class="flex items-center gap-1.5 font-bold text-sky-300">
                  <span>\uD83C\uDFF7\uFE0F</span> Etiquetas Cortas para Apple & Google Wallet:
                </div>
                <p class="text-[11px] text-zinc-300">
                  El saldo de puntos se muestra con la etiqueta <strong>PUNTOS</strong> y el premio debe ser conciso (m\u00E1x. <strong>25-30 caracteres</strong>) como <em>\u201C10\u20AC de Descuento\u201D</em> o <em>\u201CMen\u00FA Gratis\u201D</em>.
                </p>
              </div>

              <div class="space-y-4">
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-xs font-bold text-zinc-300">Nombre del Premio / Recompensa al alcanzar la Meta *</label>
                    <span id="char-count-reward-name" class="text-[10px] font-mono text-zinc-400 font-bold">${rewardName.length} / 30 car.</span>
                  </div>
                  <input type="text" id="input-reward-name" maxlength="30" value="${rewardName}" placeholder="Ej: 10\u20AC de Descuento, Men\u00FA Especial Gratis" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500">
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-zinc-300 mb-1">Meta de Puntos para Recompensa</label>
                    <select id="select-points-required" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer">
                      <option value="50" ${pointsRequired === 50 ? 'selected' : ''}>50 Puntos</option>
                      <option value="100" ${pointsRequired === 100 ? 'selected' : ''}>100 Puntos (Est\u00E1ndar)</option>
                      <option value="200" ${pointsRequired === 200 ? 'selected' : ''}>200 Puntos</option>
                      <option value="500" ${pointsRequired === 500 ? 'selected' : ''}>500 Puntos (Recomendado)</option>
                      <option value="1000" ${pointsRequired === 1000 ? 'selected' : ''}>1.000 Puntos</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-zinc-300 mb-1">Equivalencia (Puntos por 1\u20AC)</label>
                    <select id="select-points-ratio" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer">
                      <option value="1" ${pointsRatio === 1 ? 'selected' : ''}>1\u20AC = 1 Punto</option>
                      <option value="5" ${pointsRatio === 5 ? 'selected' : ''}>1\u20AC = 5 Puntos</option>
                      <option value="10" ${pointsRatio === 10 ? 'selected' : ''}>1\u20AC = 10 Puntos</option>
                      <option value="20" ${pointsRatio === 20 ? 'selected' : ''}>1\u20AC = 20 Puntos</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-zinc-300 mb-1">Curvatura de Bordes</label>
                  <select id="select-border-radius" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer">
                    <option value="16px" ${currentBranding.border_radius === '16px' ? 'selected' : ''}>Suave (16px)</option>
                    <option value="24px" ${currentBranding.border_radius === '24px' ? 'selected' : ''}>Redondeado (24px)</option>
                    <option value="32px" ${currentBranding.border_radius === '32px' ? 'selected' : ''}>Ultra Redondo (32px)</option>
                  </select>
                </div>
              </div>
            </div>
          `}

          <!-- 3. IMAGEN DE FRANJA / BANNER CENTRAL (HERO IMAGE 16:9 & 3:1) -->
          <div class="glass-panel p-5 rounded-3xl space-y-4 border border-white/5">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <span>\uD83C\uDFDE\uFE0F</span> 3. Imagen de Fondo / Banner Central (Hero Image 16:9 & 3:1)
                </h2>
                <p class="text-[11px] text-zinc-400 mt-0.5">La identidad visual y franja que aparece en Apple Wallet y Google Wallet.</p>
              </div>              <span id="badge-banner-status" class="text-[10px] font-extrabold ${currentBranding.bg_image_url ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'} px-2.5 py-1 rounded-full border">
                ${currentBranding.bg_image_url ? 'Banner / Hero Activo' : 'Franja Autom\u00E1tica'}
              </span>
            </div>

            <!-- Hero Image Specs Helper Badge -->
            <div class="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
              <div class="flex items-center gap-2 font-bold text-sky-300">
                <span>\uD83D\uDCD0</span> Especificaciones oficiales de Banner & Hero Image para Wallet:
              </div>
              <ul class="list-disc list-inside text-[11px] space-y-1 text-zinc-300">
                <li><strong>Google Wallet:</strong> Utiliza el objeto <code>heroImage</code> en proporci\u00F3n <strong>16:9</strong> (<code>1032 x 580 px</code>) como dise\u00F1o principal integrado y <code>imageModulesData</code> para la cuadr\u00EDcula f\u00EDsica de sellos.</li>
                <li><strong>Apple Wallet:</strong> Utiliza la franja <strong>3:1</strong> horizontal (<code>1032 x 336 px</code>).</li>
                <li><strong>Modo Autom\u00E1tico (Recomendado):</strong> Nuestro backend genera autom\u00E1ticamente las im\u00E1genes exactas optimizadas para ambas plataformas con tu logo, colores oscuros (<code>hexBackgroundColor: #0D0D0D</code>) y sellos visuales.</li>
              </ul>
            </div>

            <!-- Banner Upload Controls -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <span>\uD83D\uDDBC\uFE0F</span> Banner Personalizado (Ratio 16:9 o 3:1)
                </span>
                <button type="button" id="btn-clear-bg-banner" class="${currentBranding.bg_image_url ? '' : 'hidden'} text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer">
                  <span>\u2715</span> Usar Franja Autom\u00E1tica
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div id="box-bg-banner-preview" class="sm:col-span-4 h-24 rounded-2xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center bg-black/60 shrink-0 overflow-hidden p-1.5 relative">
                  ${currentBranding.bg_image_url ? `
                    <img id="img-bg-banner-preview" src="${currentBranding.bg_image_url}" class="w-full h-full object-cover rounded-xl" alt="banner preview">
                    <span class="absolute bottom-1 bg-black/80 text-[8px] font-mono font-bold text-amber-300 px-1.5 py-0.5 rounded">Hero Activo</span>
                  ` : `
                    <span class="text-lg text-sky-400 font-bold">\u2728</span>
                    <span class="text-[9px] text-zinc-400 font-bold mt-1 text-center">Franja Autom\u00E1tica Servidor (16:9 / 3:1)</span>
                  `}
                </div>

                <div class="sm:col-span-8 space-y-3">
                  <div id="dropzone-bg-banner" class="border-2 border-dashed border-zinc-700 hover:border-sky-500 rounded-2xl p-3 text-center cursor-pointer transition bg-zinc-900/40 hover:bg-sky-500/5 group">
                    <p class="text-xs font-bold text-white group-hover:text-sky-400 transition flex items-center justify-center gap-1.5">
                      <span>\u2912</span> Arrastra tu banner (16:9 o 3:1) aqu\u00ED o pulsa para subir
                    </p>
                    <p class="text-[10px] text-zinc-500 mt-0.5">Tama\u00F1o recomendado: 1032 x 580 px (16:9) o 1032 x 336 px (3:1)</p>
                    <div class="mt-2 flex justify-center">
                      <button type="button" id="btn-trigger-bg-banner-select" class="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer">
                        <span>\uD83D\uDCC1</span> Seleccionar Imagen (16:9 o 3:1)
                      </button>
                    </div>
                  </div>

                  <input type="url" id="input-bg-banner-url" value="${currentBranding.bg_image_url && !currentBranding.bg_image_url.startsWith('data:') ? currentBranding.bg_image_url : ''}" placeholder="O pegar enlace directo URL del Banner / Hero (https://...)" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 font-mono">
                </div>
              </div>

              <!-- Red Error Alert Container for Banner -->
              <div id="alert-banner-error" class="hidden mt-3 p-3.5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-200 text-xs space-y-1.5 animate-fade-in shadow-lg">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-start gap-2.5">
                    <span class="text-rose-400 text-base leading-none shrink-0 mt-0.5">\u26A0\uFE0F</span>
                    <div>
                      <strong class="font-bold text-rose-300 block text-xs">No se puede a\u00F1adir el archivo porque no cumple con los requisitos:</strong>
                      <p class="text-[11px] text-rose-200 mt-1 leading-relaxed" id="alert-banner-error-msg"></p>
                    </div>
                  </div>
                  <button type="button" class="btn-dismiss-alert text-rose-400 hover:text-white text-sm font-bold cursor-pointer px-1.5 leading-none" data-target="alert-banner-error">\u2715</button>
                </div>
              </div>

              <!-- Quick Selection Library: Saved Banners -->
              <div class="mt-3 pt-3 border-t border-zinc-800/80 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>\uD83D\uDCBE</span> Banners Guardados (Selecci\u00F3n R\u00E1pida):
                  </span>
                  <span class="text-[9px] text-zinc-500 font-mono">Disponibles para futuras ediciones</span>
                </div>
                <div id="quick-saved-banner-list" class="flex flex-wrap gap-2 items-center"></div>
              </div>

              <!-- Fast Preset Sample Banners -->
              <div class="pt-2 border-t border-zinc-800/80">
                <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Banners de Muestra R\u00E1pida (16:9 & 3:1):</span>
                <div class="flex flex-wrap gap-2">
                  <button type="button" data-sample-banner="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1032&h=580&fit=crop&q=80" class="btn-sample-banner px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\uD83D\uDCA8</span> Shisha / Lounge (16:9)</button>
                  <button type="button" data-sample-banner="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1032&h=336&fit=crop&q=80" class="btn-sample-banner px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\u2615</span> Caf\u00E9 Gourmet (3:1)</button>
                  <button type="button" data-sample-banner="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1032&h=336&fit=crop&q=80" class="btn-sample-banner px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\u2702\uFE0F</span> Barber\u00EDa</button>
                  <button type="button" data-sample-banner="https://images.unsplash.com/photo-1550547660-d9450f859349?w=1032&h=336&fit=crop&q=80" class="btn-sample-banner px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\uD83C\uDF54</span> Burger House</button>
                  <button type="button" data-sample-banner="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1032&h=336&fit=crop&q=80" class="btn-sample-banner px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\uD83C\uDF78</span> Cocteler\u00EDa</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. COLORES DE LA TARJETA (FONDO SÓLIDO Y ACENTOS) -->
          <div class="glass-panel p-5 rounded-3xl space-y-5 border border-white/5">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <span>🎨</span> 4. Colores de la Tarjeta (Fondo Sólido & Acentos)
                </h2>
                <p class="text-[11px] text-zinc-400 mt-0.5">Apple Wallet y Google Wallet aplican un color sólido al cuerpo del pase.</p>
              </div>
              <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Alto Contraste
              </span>
            </div>

            <!-- Solid Colors Guidelines Helper -->
            <div class="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs">
              <div class="flex items-center gap-1.5 font-bold text-sky-300">
                <span>🎨</span> Reglas de Color para Google Wallet & Apple Wallet:
              </div>
              <ul class="list-disc list-inside text-[11px] space-y-0.5 text-zinc-300">
                <li><strong>Regla de oro:</strong> Google Wallet no permite imágenes completas de fondo ni degradados en el cuerpo de la tarjeta. Debe ser un <strong>color hexadecimal liso</strong> (ej: <code>#0D0D0D</code>, <code>#000000</code>).</li>
                <li><strong>Contraste inteligente:</strong> Google cambiará automáticamente el color del texto a blanco o negro para garantizar máxima legibilidad.</li>
                <li><strong>Color de Acento:</strong> Destacará sellos activos, progreso numérico e iconos.</li>
              </ul>
            </div>
            
            <!-- Dual Color Selectors (Free Spectrum Picker + Hex Text Input) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-zinc-200">Color de Fondo Sólido (Cuerpo)</label>
                  <span class="text-[10px] font-mono text-zinc-400 font-bold" id="badge-bg-hex">${currentBranding.bg_gradient_from || '#0F172A'}</span>
                </div>
                <div class="flex items-center gap-2.5">
                  <div class="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-white/20 shadow-md shrink-0 cursor-pointer">
                    <input type="color" id="input-bg-from" value="${currentBranding.bg_gradient_from || '#0F172A'}" class="absolute -top-3 -left-3 w-16 h-16 cursor-pointer bg-transparent border-0">
                  </div>
                  <input type="text" id="text-bg-from" maxlength="7" value="${currentBranding.bg_gradient_from || '#0F172A'}" class="w-full bg-zinc-950 border border-zinc-700 hover:border-zinc-500 rounded-xl px-3 py-2 text-xs font-mono text-white font-bold focus:outline-none focus:border-sky-500 uppercase">
                </div>
                <p class="text-[10px] text-zinc-400">Toca el recuadro para abrir el selector libre de tonalidades o escribe el código HEX.</p>
              </div>

              <div class="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-zinc-200">Color Principal / Acento (Sellos & Iconos)</label>
                  <span class="text-[10px] font-mono text-zinc-400 font-bold" id="badge-primary-hex">${currentBranding.primary_color || '#0EA5E9'}</span>
                </div>
                <div class="flex items-center gap-2.5">
                  <div class="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-white/20 shadow-md shrink-0 cursor-pointer">
                    <input type="color" id="input-primary-color" value="${currentBranding.primary_color || '#0EA5E9'}" class="absolute -top-3 -left-3 w-16 h-16 cursor-pointer bg-transparent border-0">
                  </div>
                  <input type="text" id="text-primary-color" maxlength="7" value="${currentBranding.primary_color || '#0EA5E9'}" class="w-full bg-zinc-950 border border-zinc-700 hover:border-zinc-500 rounded-xl px-3 py-2 text-xs font-mono text-white font-bold focus:outline-none focus:border-sky-500 uppercase">
                </div>
                <p class="text-[10px] text-zinc-400">Toca el recuadro para abrir el selector libre de tonalidades o escribe el código HEX.</p>
              </div>
            </div>

            <!-- CUADRICULA DE COLORES Y TONALIDADES (PALETTE MATRIX) -->
            <div class="space-y-3 pt-2 border-t border-zinc-800">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>▦</span> Cuadrícula de Colores y Tonalidades:
                </span>
                <span class="text-[10px] text-zinc-400">Haz clic en cualquier tonalidad para aplicarla</span>
              </div>

              <!-- Tabs to switch target (Fondo vs Acento) -->
              <div class="flex items-center gap-2 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800 w-fit">
                <button type="button" class="btn-color-target-tab px-3 py-1 rounded-lg text-xs font-bold transition bg-sky-500 text-black shadow-sm cursor-pointer" data-target-type="bg">
                  Aplicar a Fondo Tarjeta
                </button>
                <button type="button" class="btn-color-target-tab px-3 py-1 rounded-lg text-xs font-bold transition text-zinc-400 hover:text-white cursor-pointer" data-target-type="accent">
                  Aplicar a Acento / Sellos
                </button>
              </div>

              <!-- Color Palette Swatch Rows -->
              <div class="space-y-2.5 p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/90">
                ${[
                  {
                    category: '1. Neutros & Escala de Grises (De Negro Profundo a Blanco)',
                    colors: ['#000000', '#0A0A0A', '#0D0D0D', '#12141C', '#0F172A', '#18181B', '#27272A', '#3F3F46', '#52525B', '#71717A', '#A1A1AA', '#D4D4D8', '#E4E4E7', '#FFFFFF']
                  },
                  {
                    category: '2. Azules, Cian & \u00CDndigos (De Ultra Oscuro a Celeste)',
                    colors: ['#021B35', '#0A2540', '#1E1B4B', '#172554', '#1E3A8A', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#0284C7', '#0EA5E9', '#38BDF8', '#7DD3FC', '#BAE6FD']
                  },
                  {
                    category: '3. Esmeraldas & Verdes (De Verde Noche a Menta Claro)',
                    colors: ['#022016', '#06281E', '#064E3B', '#14532D', '#047857', '#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#16A34A', '#22C55E', '#4ADE80', '#84CC16', '#BEF264']
                  },
                  {
                    category: '4. Dorados, \u00C1mbar & Naranjas (De Obsidiana \u00C1mbar a Oro Claro)',
                    colors: ['#1C160C', '#451A03', '#78350F', '#92400E', '#B45309', '#D97706', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#CA8A04', '#EAB308', '#EA580C', '#F97316', '#FDBA74']
                  },
                  {
                    category: '5. Rojos, Rosas & Carmes\u00ED (De Rojo Noche a Rosa Pastel)',
                    colors: ['#2A0808', '#450A0A', '#7F1D1D', '#991B1B', '#B91C1C', '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#881337', '#BE123C', '#E11D48', '#F43F5E', '#FB7185', '#FDA4AF']
                  },
                  {
                    category: '6. P\u00FArpuras & Violetas (De P\u00FArpura Noche a Lavanda Claro)',
                    colors: ['#150926', '#1E1035', '#3B0764', '#581C87', '#6B21A8', '#7E22CE', '#9333EA', '#A855F7', '#C084FC', '#E9D5FF', '#4C1D95', '#6D28D9', '#8B5CF6', '#A78BFA', '#DDD6FE']
                  }
                ].map(group => `
                  <div>
                    <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">${group.category}</span>
                    <div class="flex flex-wrap gap-1.5">
                      ${group.colors.map(hex => `
                        <button type="button" data-color="${hex}" class="btn-color-swatch w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-white/15 hover:scale-110 hover:border-white hover:shadow-lg transition cursor-pointer relative group/swatch" style="background-color: ${hex};" title="${hex}">
                          <span class="sr-only">${hex}</span>
                        </button>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Predefined Full Theme Combinations -->
            <div class="pt-2 border-t border-zinc-800/80">
              <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Combinaciones Temáticas Listas para Wallet:</span>
              <div class="flex flex-wrap gap-2">
                <button type="button" data-theme="slate" class="btn-theme-preset px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-sky-500/40 text-sky-300 hover:bg-slate-800 font-bold transition flex items-center gap-1.5 cursor-pointer">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#0EA5E9]"></span> Negro Grafito (Slate)
                </button>
                <button type="button" data-theme="cafe" class="btn-theme-preset px-3 py-1.5 rounded-xl text-xs bg-stone-900 border border-amber-500/40 text-amber-300 hover:bg-stone-800 font-bold transition flex items-center gap-1.5 cursor-pointer">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span> Obsidiana Ámbar
                </button>
                <button type="button" data-theme="emerald" class="btn-theme-preset px-3 py-1.5 rounded-xl text-xs bg-emerald-950 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 font-bold transition flex items-center gap-1.5 cursor-pointer">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span> Esmeralda Profundo
                </button>
                <button type="button" data-theme="purple" class="btn-theme-preset px-3 py-1.5 rounded-xl text-xs bg-purple-950 border border-purple-500/40 text-purple-300 hover:bg-purple-900 font-bold transition flex items-center gap-1.5 cursor-pointer">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span> Púrpura Nocturno
                </button>
                <button type="button" data-theme="navy" class="btn-theme-preset px-3 py-1.5 rounded-xl text-xs bg-indigo-950 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900 font-bold transition flex items-center gap-1.5 cursor-pointer">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#6366F1]"></span> Azul Noche Indigo
                </button>
                <button type="button" data-theme="pureblack" class="btn-theme-preset px-3 py-1.5 rounded-xl text-xs bg-black border border-zinc-700 text-white hover:bg-zinc-900 font-bold transition flex items-center gap-1.5 cursor-pointer">
                  <span class="w-2.5 h-2.5 rounded-full bg-white"></span> Negro Azabache
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN: Responsive Sticky Live Preview Area -->
        <div class="lg:col-span-5 w-full flex flex-col justify-start lg:h-full lg:overflow-y-auto space-y-4 pr-1 shrink-0 pb-16">
          <div class="glass-panel p-4 sm:p-5 rounded-3xl space-y-3.5 border border-sky-500/20 shadow-2xl backdrop-blur-xl w-full">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <span class="text-xs font-bold text-white flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Vista Previa en Tiempo Real
              </span>
              <span id="preview-mode-tag" class="text-[10px] font-bold text-sky-400 font-mono">Apple Wallet (iOS)</span>
            </div>

            <!-- Wallet Selector (Apple Wallet vs Google Wallet) -->
            <div class="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-xs shrink-0">
              <button type="button" id="btn-preview-apple" class="py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-white text-black shadow-md cursor-pointer">
                <span>🍎</span> Apple Wallet
              </button>
              <button type="button" id="btn-preview-google" class="py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white cursor-pointer">
                <span>🤖</span> Google Wallet
              </button>
            </div>

            <div id="card-preview-container" class="card-preview-adaptive flex justify-center py-1 w-full max-w-full overflow-visible"></div>

            <p id="preview-footer-desc" class="text-[11px] text-zinc-400 text-center">
              Así se verá exactamente la tarjeta en la app Apple Wallet del móvil.
            </p>
          </div>
        </div>
      </div>

      <!-- STICKY BOTTOM ACTION BAR -->
      <div class="sticky bottom-0 z-30 -mx-2 sm:-mx-4 p-3 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 flex items-center justify-between gap-3 shadow-2xl rounded-b-3xl">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span class="text-xs font-bold text-white truncate">Tarjeta Activa: <strong class="text-sky-400">${cardName}</strong></span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" id="btn-save-branding-bottom" class="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs shadow-lg transition transform hover:scale-[1.02] flex items-center gap-2 cursor-pointer">
            <span>✔</span> Guardar Tarjeta
          </button>
        </div>
      </div>

      <!-- MODAL: CREAR NUEVA TARJETA -->
      <div id="modal-builder-create-card" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm hidden items-center justify-center p-4">
        <div class="bg-[#12141C] border border-zinc-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>\uD83D\uDCB3</span> Crear Nueva Tarjeta Digital
            </h3>
            <button id="btn-close-modal-builder-create" class="text-zinc-400 hover:text-white font-bold text-lg cursor-pointer">&times;</button>
          </div>

          <form id="form-builder-create-card" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-zinc-300 mb-1">Nombre de la Tarjeta *</label>
              <input type="text" name="new_card_name" required placeholder="Ej: Tarjeta Cliente Puntos, Tarjeta Loyalty Sellos, Promo 1 Uso" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>

            <div class="space-y-2">
              <label class="block text-xs font-bold text-zinc-300">Estilo / Tipo de Tarjeta *</label>
              
              <!-- Option 1: Tarjeta Cliente (Puntos) -->
              <label class="p-3.5 rounded-2xl border-2 border-sky-500/50 hover:border-sky-400 bg-sky-950/30 flex items-start gap-3 cursor-pointer transition group shadow-sm">
                <input type="radio" name="new_card_style" value="points" checked class="mt-1 text-sky-500 focus:ring-sky-500 bg-black border-sky-600">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-black text-sky-300 group-hover:text-sky-200 transition">\uD83D\uDCB3 Tarjeta Cliente (Puntos)</span>
                    <span class="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">Todos los Planes</span>
                  </div>
                  <p class="text-[11px] text-zinc-300 mt-0.5">Tarjeta de puntos. Cuando se escanea el QR en caja el negocio asigna puntos y el cliente puede consultar cu\u00E1ntos puntos tiene en la tarjeta.</p>
                </div>
              </label>

              <!-- Option 2: Tarjeta Loyalty (Sellos) -->
              <label class="p-3.5 rounded-2xl border-2 border-amber-500/50 hover:border-amber-400 bg-amber-950/30 flex items-start gap-3 cursor-pointer transition group shadow-sm">
                <input type="radio" name="new_card_style" value="stamps" class="mt-1 text-amber-500 focus:ring-amber-500 bg-black border-amber-600">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-black text-amber-300 group-hover:text-amber-200 transition">\u2B50 Tarjeta Loyalty (Sellos)</span>
                    <span class="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">Todos los Planes</span>
                  </div>
                  <p class="text-[11px] text-zinc-300 mt-0.5">Tarjeta de sellos. En cada visita o consumici\u00F3n el negocio estampa sellos en la tarjeta hasta completar la meta y desbloquear el premio.</p>
                </div>
              </label>

              <!-- Option 3: Tarjeta Promo (1 Solo Uso) -->
              <label class="p-3.5 rounded-2xl border-2 ${isBasic ? 'border-zinc-800/60 opacity-80 bg-zinc-900/60' : 'border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/30'} flex items-start gap-3 cursor-pointer transition group shadow-sm">
                <input type="radio" name="new_card_style" value="single_use_promo" class="mt-1 text-emerald-500 focus:ring-emerald-500 bg-black border-emerald-600">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-black text-emerald-300 group-hover:text-emerald-200 transition">\u2728 Tarjeta Promo (1 Solo Uso)</span>
                    <span class="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Plan PRO</span>
                  </div>
                  <p class="text-[11px] text-zinc-300 mt-0.5">Tarjeta de un solo uso. V\u00E1lida para canjear una sola vez en el local hasta la finalizaci\u00F3n de la promoci\u00F3n.</p>
                </div>
              </label>

              <!-- Option 4: Tarjeta Cupon (Descuentos) -->
              <label class="p-3.5 rounded-2xl border-2 ${isBasic ? 'border-zinc-800/60 opacity-80 bg-zinc-900/60' : 'border-purple-500/50 hover:border-purple-400 bg-purple-950/30'} flex items-start gap-3 cursor-pointer transition group shadow-sm">
                <input type="radio" name="new_card_style" value="coupon_discount" class="mt-1 text-purple-500 focus:ring-purple-500 bg-black border-purple-600">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-black text-purple-300 group-hover:text-purple-200 transition">\u22C4 Tarjeta Cup\u00F3n (Descuentos Directos)</span>
                    <span class="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">Plan PRO</span>
                  </div>
                  <p class="text-[11px] text-zinc-300 mt-0.5">Tarjeta de descuento directo (% o \u20AC) aplicable en caja en cada consumo hasta su fecha de expiraci\u00F3n.</p>
                </div>
              </label>
            </div>

            <!-- Basic Plan Alert Warning -->
            <div id="modal-plan-restriction-alert" class="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-200 hidden space-y-2">
              <div class="flex items-center gap-2 font-bold text-white">
                <span>\uD83D\uDD12</span> Funcionalidad del Plan PRO
              </div>
              <p class="text-[11px] text-zinc-300">
                El estilo seleccionado est\u00E1 disponible en el <strong>Plan PRO</strong>. En el Plan BASIC puedes crear y personalizar todas las <strong>Tarjetas Cliente (Puntos)</strong> que desees.
              </p>
              <a href="#/admin/plan" class="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold">
                <span>\u2B50</span> Mejorar a Plan PRO &rarr;
              </a>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button type="button" id="btn-cancel-modal-builder-create" class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 cursor-pointer">Cancelar</button>
              <button type="submit" id="btn-submit-modal-builder-create" class="px-5 py-2 rounded-xl text-xs font-bold text-black bg-sky-500 hover:bg-sky-400 shadow-lg cursor-pointer">Crear y Dise\u00F1ar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    bindEvents();
    updatePreview();
  }

  const UPLOAD_REQUIREMENTS = {
    banner: {
      label: 'Hero Image 16:9 / Banner 3:1',
      allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      maxSizeBytes: 5 * 1024 * 1024,
      minWidth: 400,
      minHeight: 100,
      minRatio: 1.5,
      maxRatio: 4.2,
      targetRatioText: 'horizontal panor\u00E1mica (16:9 para Google Wallet [1032 x 580 px] o 3:1 para Apple Wallet [1032 x 336 px])'
    },
    logo: {
      label: 'Logotipo del Comercio',
      allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'],
      maxSizeBytes: 4 * 1024 * 1024,
      minWidth: 48,
      minHeight: 48,
      minRatio: 0.35,
      maxRatio: 2.8,
      targetRatioText: 'cuadrada o est\u00E1ndar (aprox. 512 x 512 px)'
    },
    stamp_completed: {
      label: 'Sello Completado (Activo)',
      allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'],
      maxSizeBytes: 3 * 1024 * 1024,
      minWidth: 24,
      minHeight: 24,
      minRatio: 0.65,
      maxRatio: 1.55,
      targetRatioText: 'cuadrada 1:1 con fondo transparente (aprox. 256 x 256 px)'
    },
    stamp_uncompleted: {
      label: 'Sello Sin Completar (Vac\u00EDo)',
      allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'],
      maxSizeBytes: 3 * 1024 * 1024,
      minWidth: 24,
      minHeight: 24,
      minRatio: 0.65,
      maxRatio: 1.55,
      targetRatioText: 'cuadrada 1:1 con fondo transparente (aprox. 256 x 256 px)'
    }
  };

  function showErrorNotice(category, title, detail) {
    const alertEl = container.querySelector(`#alert-${category}-error`);
    const textEl = container.querySelector(`#alert-${category}-error-msg`);
    if (alertEl && textEl) {
      textEl.innerHTML = `<strong>${title}:</strong> ${detail}`;
      alertEl.classList.remove('hidden');
      alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    toast.error(`Error en ${category}: ${title}`);
  }

  function clearErrorNotice(category) {
    const alertEl = container.querySelector(`#alert-${category}-error`);
    if (alertEl) alertEl.classList.add('hidden');
  }

  function updateStampBadge() {
    const badge = container.querySelector('#badge-stamp-mode');
    if (!badge) return;
    if (currentBranding.stamp_completed_image && currentBranding.stamp_uncompleted_image) {
      badge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      badge.textContent = '\u2714 2 Sellos Personalizados Activos';
    } else if (currentBranding.stamp_completed_image) {
      badge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/50';
      badge.textContent = '\u2714 Sello Completado Personalizado';
    } else if (currentBranding.stamp_uncompleted_image) {
      badge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-zinc-700/60 text-zinc-300 border-zinc-600';
      badge.textContent = '\u2714 Sello Vac\u00EDo Personalizado';
    } else {
      badge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-sky-500/10 text-sky-400 border-sky-500/30';
      badge.textContent = `Icono Vectorial (${currentBranding.stamp_icon || 'Estrella'})`;
    }
  }

  function applyLogo(imageUrl, fileName = 'Logotipo') {
    if (!imageUrl) return;
    currentLogoUrl = imageUrl;
    currentBranding.logo_url = imageUrl;

    // Save strictly to active card / program (independent from other cards)
    if (activeProgram?.id) {
      activeProgram.branding = {
        ...activeProgram.branding,
        ...currentBranding,
        logo_url: imageUrl
      };
      loyaltyService.updateProgram(business.id, activeProgram.id, { branding: activeProgram.branding }, session);
      allPrograms = loyaltyService.getAllPrograms(business.id) || [];
      const updated = allPrograms.find(p => p.id === activeProgram.id);
      if (updated) activeProgram = updated;
    }

    const imgLogoPreview = container.querySelector('#img-logo-preview');
    if (imgLogoPreview) imgLogoPreview.src = imageUrl;

    const inputLogoUrl = container.querySelector('#input-logo-url');
    if (inputLogoUrl) inputLogoUrl.value = imageUrl.startsWith('data:') ? '' : imageUrl;

    saveQuickFile('logo', imageUrl, fileName);
    clearErrorNotice('logo');
    updatePreview();
    renderQuickFiles('logo');
    toast.success('\u00A1Logotipo guardado y aplicado a esta tarjeta!');
  }

  function applyCompletedStamp(imageUrl, fileName = 'Sello Activo') {
    if (!imageUrl) return;
    currentBranding.stamp_completed_image = imageUrl;
    currentBranding.stamp_custom_image = imageUrl;
    currentBranding.stamp_icon = 'custom_image';

    // Auto-save to activeProgram in storage
    if (activeProgram?.id) {
      activeProgram.branding = {
        ...activeProgram.branding,
        ...currentBranding
      };
      loyaltyService.updateProgram(business.id, activeProgram.id, { branding: activeProgram.branding }, session);
      allPrograms = loyaltyService.getAllPrograms(business.id) || [];
      const updated = allPrograms.find(p => p.id === activeProgram.id);
      if (updated) activeProgram = updated;
    }

    const boxStampCompletedPreview = container.querySelector('#box-stamp-completed-preview');
    if (boxStampCompletedPreview) {
      boxStampCompletedPreview.innerHTML = `
        <img src="${imageUrl}" class="w-12 h-12 object-contain filter drop-shadow" alt="sello completado preview">
        <span class="text-[9px] text-amber-300 mt-1 font-bold">.PNG Activo</span>
      `;
    }

    const inputStampCompletedUrl = container.querySelector('#input-stamp-completed-url');
    if (inputStampCompletedUrl) inputStampCompletedUrl.value = imageUrl.startsWith('data:') ? '' : imageUrl;

    const btnClear = container.querySelector('#btn-clear-stamp-completed-img');
    if (btnClear) btnClear.classList.remove('hidden');

    container.querySelectorAll('.btn-select-icon').forEach(b => {
      b.className = 'btn-select-icon p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white';
    });

    saveQuickFile('stamp_completed', imageUrl, fileName);
    clearErrorNotice('stamp_completed');
    updateStampBadge();
    updatePreview();
    renderQuickFiles('stamp_completed');
    toast.success('\u00A1Foto de sello completado guardada y aplicada!');
  }

  function applyUncompletedStamp(imageUrl, fileName = 'Sello Vac\u00EDo') {
    if (!imageUrl) return;
    currentBranding.stamp_uncompleted_image = imageUrl;

    // Auto-save to activeProgram in storage
    if (activeProgram?.id) {
      activeProgram.branding = {
        ...activeProgram.branding,
        ...currentBranding
      };
      loyaltyService.updateProgram(business.id, activeProgram.id, { branding: activeProgram.branding }, session);
      allPrograms = loyaltyService.getAllPrograms(business.id) || [];
      const updated = allPrograms.find(p => p.id === activeProgram.id);
      if (updated) activeProgram = updated;
    }

    const boxStampUncompletedPreview = container.querySelector('#box-stamp-uncompleted-preview');
    if (boxStampUncompletedPreview) {
      boxStampUncompletedPreview.innerHTML = `
        <img src="${imageUrl}" class="w-12 h-12 object-contain opacity-75 filter drop-shadow" alt="sello sin completar preview">
        <span class="text-[9px] text-zinc-300 mt-1 font-bold">.PNG Vac\u00EDo</span>
      `;
    }

    const inputStampUncompletedUrl = container.querySelector('#input-stamp-uncompleted-url');
    if (inputStampUncompletedUrl) inputStampUncompletedUrl.value = imageUrl.startsWith('data:') ? '' : imageUrl;

    const btnClear = container.querySelector('#btn-clear-stamp-uncompleted-img');
    if (btnClear) btnClear.classList.remove('hidden');

    saveQuickFile('stamp_uncompleted', imageUrl, fileName);
    clearErrorNotice('stamp_uncompleted');
    updateStampBadge();
    updatePreview();
    renderQuickFiles('stamp_uncompleted');
    toast.success('\u00A1Foto de sello sin completar guardada y aplicada!');
  }

  function applyBgBanner(imageUrl, fileName = 'Banner') {
    currentBranding.bg_image_url = imageUrl || null;

    // Auto-save to activeProgram in storage
    if (activeProgram?.id) {
      activeProgram.branding = {
        ...activeProgram.branding,
        ...currentBranding
      };
      loyaltyService.updateProgram(business.id, activeProgram.id, { branding: activeProgram.branding }, session);
      allPrograms = loyaltyService.getAllPrograms(business.id) || [];
      const updated = allPrograms.find(p => p.id === activeProgram.id);
      if (updated) activeProgram = updated;
    }

    const boxPreview = container.querySelector('#box-bg-banner-preview') || container.querySelector('#box-banner-preview');
    const badgeStatus = container.querySelector('#badge-banner-status');
    const btnClear = container.querySelector('#btn-clear-bg-banner');
    const inputUrl = container.querySelector('#input-bg-banner-url');

    if (boxPreview) {
      if (imageUrl) {
        boxPreview.innerHTML = `
          <img id="img-bg-banner-preview" src="${imageUrl}" class="w-full h-full object-cover rounded-xl" alt="banner preview">
          <span class="absolute bottom-1 bg-black/80 text-[8px] font-mono font-bold text-amber-300 px-1.5 py-0.5 rounded">Hero Activo</span>
        `;
      } else {
        boxPreview.innerHTML = `
          <span class="text-lg text-sky-400 font-bold">\u2728</span>
          <span class="text-[9px] text-zinc-400 font-bold mt-1 text-center">Franja Autom\u00E1tica Servidor (16:9 / 3:1)</span>
        `;
      }
    }

    if (badgeStatus) {
      badgeStatus.className = `text-[10px] font-extrabold ${imageUrl ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'} px-2.5 py-1 rounded-full border`;
      badgeStatus.textContent = imageUrl ? 'Banner / Hero Activo' : 'Franja Autom\u00E1tica';
    }

    if (btnClear) {
      btnClear.classList.toggle('hidden', !imageUrl);
    }

    if (inputUrl && !imageUrl) {
      inputUrl.value = '';
    } else if (inputUrl && imageUrl) {
      inputUrl.value = imageUrl.startsWith('data:') ? '' : imageUrl;
    }

    if (imageUrl) {
      saveQuickFile('banner', imageUrl, fileName);
      toast.success('\u00A1Banner / Hero Image guardado y aplicado!');
    } else {
      toast.success('Franja autom\u00E1tica del servidor restaurada.');
    }

    clearErrorNotice('banner');
    updatePreview();
    renderQuickFiles('banner');
  }

  function getQuickFiles(category) {
    try {
      const key = `vynta_quick_${category}_${business?.id || 'default'}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveQuickFile(category, url, name) {
    if (!url) return;
    try {
      const key = `vynta_quick_${category}_${business?.id || 'default'}`;
      let list = getQuickFiles(category);
      list = list.filter(item => item.url !== url);
      list.unshift({
        id: 'qf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        url,
        name: name || (category === 'banner' ? 'Banner' : category === 'logo' ? 'Logo' : 'Sello'),
        timestamp: Date.now()
      });
      list = list.slice(0, 8);
      localStorage.setItem(key, JSON.stringify(list));
      renderQuickFiles(category);
    } catch (e) {
      console.warn('Could not save quick file:', e);
    }
  }

  function removeQuickFile(category, fileId) {
    try {
      const key = `vynta_quick_${category}_${business?.id || 'default'}`;
      let list = getQuickFiles(category).filter(item => item.id !== fileId);
      localStorage.setItem(key, JSON.stringify(list));
      renderQuickFiles(category);
    } catch (e) {
      console.warn('Could not remove quick file:', e);
    }
  }

  function renderQuickFiles(category) {
    const containerEl = container.querySelector(`#quick-saved-${category}-list`);
    if (!containerEl) return;
    const files = getQuickFiles(category);

    if (files.length === 0) {
      containerEl.innerHTML = `
        <span class="text-[10px] text-zinc-500 italic">No hay archivos guardados a\u00FAn. Al subir uno v\u00E1lido se guardar\u00E1 aqu\u00ED autom\u00E1ticamente.</span>
      `;
      return;
    }

    const currentUrl = category === 'logo'
      ? currentLogoUrl
      : category === 'stamp_completed'
      ? currentBranding.stamp_completed_image
      : category === 'stamp_uncompleted'
      ? currentBranding.stamp_uncompleted_image
      : currentBranding.bg_image_url;

    containerEl.innerHTML = files.map(f => {
      const isSelected = currentUrl === f.url;
      return `
        <div class="group relative flex items-center gap-1.5 px-2 py-1 rounded-xl transition shadow-sm ${
          isSelected
            ? 'bg-sky-950/70 border-2 border-sky-400 text-sky-200 ring-2 ring-sky-500/40 shadow-sky-500/10'
            : 'bg-zinc-900 border border-zinc-700 hover:border-sky-500'
        }">
          <button type="button" class="btn-apply-quick-file flex items-center gap-1.5 text-left cursor-pointer" data-category="${category}" data-url="${f.url}" title="Hacer clic para aplicar a esta tarjeta">
            <img src="${f.url}" class="${category === 'banner' ? 'w-10 h-3.5 object-cover' : 'w-5 h-5 object-contain'} rounded shrink-0 bg-black/40 border border-white/10" alt="thumb">
            <span class="text-[10px] ${isSelected ? 'text-sky-200 font-bold' : 'text-zinc-300 group-hover:text-white font-medium'} max-w-[85px] truncate">${f.name || 'Guardado'}</span>
            ${isSelected ? '<span class="text-[9px] text-sky-400 font-bold">\u2714</span>' : ''}
          </button>
          <button type="button" class="btn-remove-quick-file text-zinc-500 hover:text-rose-400 text-xs font-bold px-1 transition cursor-pointer" data-category="${category}" data-id="${f.id}" title="Eliminar de guardados">\u2715</button>
        </div>
      `;
    }).join('');

    containerEl.querySelectorAll('.btn-apply-quick-file').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cat = btn.dataset.category;
        const url = btn.dataset.url;
        clearErrorNotice(cat);
        if (cat === 'banner') {
          applyBgBanner(url, btn.querySelector('span')?.textContent || 'Banner');
        } else if (cat === 'logo') {
          applyLogo(url, btn.querySelector('span')?.textContent || 'Logo');
        } else if (cat === 'stamp_completed') {
          applyCompletedStamp(url, btn.querySelector('span')?.textContent || 'Sello Activo');
        } else if (cat === 'stamp_uncompleted') {
          applyUncompletedStamp(url, btn.querySelector('span')?.textContent || 'Sello Vac\u00EDo');
        }
      });
    });

    containerEl.querySelectorAll('.btn-remove-quick-file').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cat = btn.dataset.category;
        const id = btn.dataset.id;
        removeQuickFile(cat, id);
        toast.info('Archivo eliminado de la lista r\u00E1pida');
      });
    });
  }

  function validateAndProcessImage(file, category, onValid) {
    if (!file) return;
    const reqs = UPLOAD_REQUIREMENTS[category];
    if (!reqs) return onValid(file);

    clearErrorNotice(category);

    const fileType = (file.type || '').toLowerCase();
    const fileName = (file.name || '').toLowerCase();
    const isAllowedType = reqs.allowedTypes.some(t => fileType.includes(t) || fileName.endsWith(t.replace('image/', '.')));

    if (!isAllowedType && !fileType.startsWith('image/')) {
      showErrorNotice(
        category,
        'Formato no compatible',
        `Has seleccionado "${file.name || 'archivo'}" (${fileType || 'desconocido'}). Solo se admiten formatos de imagen: PNG, JPG, JPEG, WebP${category === 'logo' || category.startsWith('stamp') ? ' o SVG' : ''}.`
      );
      return;
    }

    if (file.size > reqs.maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const maxMb = (reqs.maxSizeBytes / (1024 * 1024)).toFixed(0);
      showErrorNotice(
        category,
        'Tama\u00F1o de archivo excedido',
        `El archivo pesa ${sizeMb} MB y el l\u00EDmite permitido es de ${maxMb} MB. Por favor optimiza o reduce el peso de la imagen antes de subirla.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      showErrorNotice(category, 'Error de lectura', 'El navegador no pudo procesar este archivo.');
    };
    reader.onload = (e) => {
      const rawDataUrl = e.target.result;

      if (fileType.includes('svg') || fileName.endsWith('.svg')) {
        clearErrorNotice(category);
        onValid(rawDataUrl, file.name);
        return;
      }

      const img = new Image();
      img.onerror = () => {
        showErrorNotice(category, 'Imagen inv\u00E1lida o corrupta', 'No se ha podido interpretar el archivo de imagen.');
      };
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const ratio = width / Math.max(1, height);

        if (reqs.minRatio && (ratio < reqs.minRatio || ratio > reqs.maxRatio)) {
          showErrorNotice(
            category,
            'Proporci\u00F3n de imagen no v\u00E1lida',
            `La imagen subida mide ${width} x ${height} px (proporci\u00F3n ${ratio.toFixed(2)}:1). Para este apartado se requiere una proporci\u00F3n ${reqs.targetRatioText}.`
          );
          return;
        }

        if (width < reqs.minWidth || height < reqs.minHeight) {
          showErrorNotice(
            category,
            'Resoluci\u00F3n insuficiente',
            `La imagen mide ${width} x ${height} px. La resoluci\u00F3n m\u00EDnima requerida es de ${reqs.minWidth} x ${reqs.minHeight} px para garantizar nitidez.`
          );
          return;
        }

        try {
          const canvas = document.createElement('canvas');
          const maxW = category === 'banner' ? 1200 : 512;
          let targetW = width;
          let targetH = height;
          if (targetW > maxW) {
            targetH = Math.round((targetH * maxW) / targetW);
            targetW = maxW;
          }
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.clearRect(0, 0, targetW, targetH);
          ctx.drawImage(img, 0, 0, targetW, targetH);

          const isJpeg = fileType.includes('jpeg') || fileType.includes('jpg');
          const outputFormat = isJpeg ? 'image/jpeg' : 'image/png';
          const optimizedDataUrl = canvas.toDataURL(outputFormat, 0.92);

          clearErrorNotice(category);
          onValid(optimizedDataUrl, file.name);
        } catch (err) {
          clearErrorNotice(category);
          onValid(rawDataUrl, file.name);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  }

  function handleImageFile(file, callback) {
    validateAndProcessImage(file, 'banner', callback);
  }

  function bindEvents() {
    // --- TOP CARD SWITCHER ---
    const selectCardToEdit = container.querySelector('#select-card-to-edit');
    if (selectCardToEdit) {
      selectCardToEdit.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        const found = allPrograms.find(p => p.id === selectedId);
        if (found) {
          localStorage.setItem(`vynta_last_active_program_${business?.id}`, selectedId);
          activeProgram = found;
          cardName = found.name || 'Tarjeta Digital';
          totalStamps = Number(found.stamps_required) || 10;
          pointsRequired = Number(found.points_required) || (totalStamps * 10 || 100);
          pointsRatio = Number(found.points_ratio) || 10;
          rewardName = found.reward_name || 'Premio de Fidelidad';
          promoBenefit = found.promo_benefit || 'Consumici\u00F3n de Bienvenida Gratis';
          validUntil = found.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          terms = found.terms || 'V\u00E1lido 1 canje por cliente.';
          discountType = found.discount_type || 'percentage';
          discountValue = found.discount_value !== undefined ? found.discount_value : 20;
          couponCode = found.coupon_code || 'VYNTA-PROMO';
          minSpend = found.min_spend || 'Sin consumo m\u00EDnimo';

          currentLogoUrl = found.branding?.logo_url || business?.logo_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=128&auto=format&fit=crop&q=80';

          currentBranding = {
            logo_url: found.branding?.logo_url || null,
            primary_color: found.branding?.primary_color || business?.branding?.primary_color || '#0EA5E9',
            secondary_color: found.branding?.secondary_color || business?.branding?.secondary_color || '#0369A1',
            bg_gradient_from: found.branding?.bg_gradient_from || business?.branding?.bg_gradient_from || '#0F172A',
            bg_gradient_to: found.branding?.bg_gradient_to || business?.branding?.bg_gradient_to || '#020617',
            bg_image_url: found.branding?.bg_image_url || null,
            overlay_opacity: (found.branding?.overlay_opacity !== undefined) ? found.branding.overlay_opacity : 0.70,
            stamp_icon: found.branding?.stamp_icon || 'star',
            stamp_completed_image: found.branding?.stamp_completed_image || found.branding?.stamp_custom_image || null,
            stamp_uncompleted_image: found.branding?.stamp_uncompleted_image || null,
            stamp_custom_image: found.branding?.stamp_completed_image || found.branding?.stamp_custom_image || null,
            border_radius: found.branding?.border_radius || business?.branding?.border_radius || '24px',
            text_color: found.branding?.text_color || business?.branding?.text_color || '#FFFFFF'
          };

          const leftCol = container.querySelector('.lg\\:col-span-7');
          const leftScroll = leftCol ? leftCol.scrollTop : 0;
          const pageScroll = window.scrollY || document.documentElement.scrollTop || 0;

          renderForm();

          requestAnimationFrame(() => {
            const newLeftCol = container.querySelector('.lg\\:col-span-7');
            if (newLeftCol) newLeftCol.scrollTop = leftScroll;
            window.scrollTo({ top: pageScroll, behavior: 'instant' });
          });

          toast.success(`Editando tarjeta: ${found.name}`);
        }
      });
    }

    // --- CARD TITLE INPUT ---
    const inputCardTitleName = container.querySelector('#input-card-title-name');
    const charCountCardName = container.querySelector('#char-count-card-name');
    if (inputCardTitleName) {
      inputCardTitleName.addEventListener('input', (e) => {
        cardName = e.target.value.trim() || 'Tarjeta Digital';
        activeProgram.name = cardName;
        if (charCountCardName) {
          const len = e.target.value.length;
          charCountCardName.textContent = `${len} / 45 car.`;
          charCountCardName.className = len > 45 ? 'text-[10px] font-mono text-amber-400 font-bold' : 'text-[10px] font-mono text-zinc-400 font-bold';
        }
        updatePreview();
      });
    }

    // --- DELETE ACTIVE CARD BUTTON ---
    const btnDeleteCurrentCard = container.querySelector('#btn-delete-current-builder-card');
    if (btnDeleteCurrentCard) {
      btnDeleteCurrentCard.addEventListener('click', () => {
        if (confirm(`\u00BFEst\u00E1s seguro de que deseas eliminar la tarjeta "${activeProgram.name}"?\nEsta acci\u00F3n no se puede deshacer.`)) {
          loyaltyService.deleteProgram(business.id, activeProgram.id, session);
          allPrograms = loyaltyService.getAllPrograms(business.id) || [];
          activeProgram = allPrograms[0];
          cardName = activeProgram?.name || 'Tarjeta Digital';
          totalStamps = Number(activeProgram?.stamps_required) || 10;
          pointsRequired = Number(activeProgram?.points_required) || 100;
          rewardName = activeProgram?.reward_name || 'Premio';
          promoBenefit = activeProgram?.promo_benefit || 'Consumici\u00F3n de Bienvenida';
          validUntil = activeProgram?.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          discountType = activeProgram?.discount_type || 'percentage';
          discountValue = activeProgram?.discount_value !== undefined ? activeProgram.discount_value : 20;
          couponCode = activeProgram?.coupon_code || 'VYNTA-PROMO';
          renderForm();
          toast.success('Tarjeta eliminada.');
        }
      });
    }

    // --- MODAL CREATE CARD LOGIC ---
    const modalCreate = container.querySelector('#modal-builder-create-card');
    const btnOpenCreate = container.querySelector('#btn-open-create-card-modal');
    const btnCloseCreate = container.querySelector('#btn-close-modal-builder-create');
    const btnCancelCreate = container.querySelector('#btn-cancel-modal-builder-create');
    const formCreate = container.querySelector('#form-builder-create-card');
    const alertPlanRestriction = container.querySelector('#modal-plan-restriction-alert');
    const btnSubmitCreate = container.querySelector('#btn-submit-modal-builder-create');

    const openModal = () => {
      if (modalCreate) {
        modalCreate.classList.remove('hidden');
        modalCreate.classList.add('flex');
      }
    };

    const closeModal = () => {
      if (modalCreate) {
        modalCreate.classList.add('hidden');
        modalCreate.classList.remove('flex');
        if (formCreate) formCreate.reset();
        if (alertPlanRestriction) alertPlanRestriction.classList.add('hidden');
        if (btnSubmitCreate) btnSubmitCreate.disabled = false;
      }
    };

    if (btnOpenCreate) btnOpenCreate.addEventListener('click', openModal);
    if (btnCloseCreate) btnCloseCreate.addEventListener('click', closeModal);
    if (btnCancelCreate) btnCancelCreate.addEventListener('click', closeModal);

    if (formCreate) {
      formCreate.querySelectorAll('input[name="new_card_style"]').forEach(radio => {
        radio.addEventListener('change', () => {
          const val = radio.value;
          const isProStyle = val !== 'points' && val !== 'stamps';
          if (isBasic && isProStyle) {
            if (alertPlanRestriction) alertPlanRestriction.classList.remove('hidden');
            if (btnSubmitCreate) btnSubmitCreate.disabled = true;
          } else {
            if (alertPlanRestriction) alertPlanRestriction.classList.add('hidden');
            if (btnSubmitCreate) btnSubmitCreate.disabled = false;
          }
        });
      });

      formCreate.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(formCreate);
        const name = formData.get('new_card_name')?.trim();
        const style = formData.get('new_card_style') || 'points';

        if (!name) {
          toast.error('Por favor escribe un nombre para la tarjeta.');
          return;
        }

        if (isBasic && style !== 'points' && style !== 'stamps') {
          toast.error('En el Plan BASIC solo puedes crear Tarjetas de Puntos y Sellos. Actualiza al Plan PRO para crear promociones y cupones.');
          return;
        }

        try {
          const typeColors = getCardTypeDefaultColors(style);
          const newProgram = loyaltyService.createProgram(business.id, {
            name,
            card_type: style,
            stamps_required: 10,
            points_required: 100,
            points_ratio: 10,
            reward_name: style === 'coupon_discount' ? '20% Descuento' : (style === 'single_use_promo' ? '1 Consumici\u00F3n de Bienvenida' : (style === 'stamps' ? '1 Caf\u00E9 Gratis' : '10\u20AC de Descuento')),
            promo_benefit: '1 Consumici\u00F3n de Bienvenida Gratis',
            discount_type: 'percentage',
            discount_value: 20,
            coupon_code: 'VYNTA-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            branding: {
              ...currentBranding,
              primary_color: typeColors.primary_color,
              secondary_color: typeColors.secondary_color,
              bg_gradient_from: typeColors.bg_gradient_from,
              bg_gradient_to: typeColors.bg_gradient_to,
              stamp_icon: typeColors.stamp_icon
            }
          }, session);

          allPrograms = loyaltyService.getAllPrograms(business.id) || [];
          activeProgram = newProgram;
          currentBranding = { ...newProgram.branding };
          cardName = newProgram.name;
          totalStamps = Number(newProgram.stamps_required) || 10;
          pointsRequired = Number(newProgram.points_required) || 100;
          pointsRatio = Number(newProgram.points_ratio) || 10;
          rewardName = newProgram.reward_name;
          promoBenefit = newProgram.promo_benefit || 'Consumici\u00F3n de Bienvenida Gratis';
          validUntil = newProgram.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          discountType = newProgram.discount_type || 'percentage';
          discountValue = newProgram.discount_value !== undefined ? newProgram.discount_value : 20;
          couponCode = newProgram.coupon_code || 'VYNTA-PROMO';

          closeModal();
          renderForm();
          toast.fireConfetti();
          toast.success(`\u00A1Tarjeta "${name}" creada y lista para personalizar!`);
        } catch (err) {
          toast.error(err.message);
        }
      });
    }

    // --- WALLET PREVIEW SWITCHER (Apple vs Google) ---
    const btnPreviewApple = container.querySelector('#btn-preview-apple');
    const btnPreviewGoogle = container.querySelector('#btn-preview-google');
    const previewModeTag = container.querySelector('#preview-mode-tag');
    const previewFooterDesc = container.querySelector('#preview-footer-desc');

    if (btnPreviewApple && btnPreviewGoogle) {
      btnPreviewApple.addEventListener('click', () => {
        activeWalletMode = 'apple';
        btnPreviewApple.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-white text-black shadow-md cursor-pointer';
        btnPreviewGoogle.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white cursor-pointer';
        if (previewModeTag) previewModeTag.textContent = 'Apple Wallet (iOS)';
        if (previewFooterDesc) previewFooterDesc.textContent = 'As\u00ED se ver\u00E1 exactamente la tarjeta en la app Apple Wallet del m\u00F3vil.';
        updatePreview();
      });

      btnPreviewGoogle.addEventListener('click', () => {
        activeWalletMode = 'google';
        btnPreviewGoogle.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-white text-black shadow-md cursor-pointer';
        btnPreviewApple.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white cursor-pointer';
        if (previewModeTag) previewModeTag.textContent = 'Google Wallet (Android)';
        if (previewFooterDesc) previewFooterDesc.textContent = 'As\u00ED se ver\u00E1 exactamente la tarjeta en la app Google Wallet de Android / Google Pay.';
        updatePreview();
      });
    }

    // --- LOGO UPLOAD & DRAG/DROP ---
    const fileLogoUpload = container.querySelector('#file-logo-upload');
    const btnTriggerLogo = container.querySelector('#btn-trigger-logo-select');
    const dropzoneLogo = container.querySelector('#dropzone-logo');
    const inputLogoUrl = container.querySelector('#input-logo-url');
    const imgLogoPreview = container.querySelector('#img-logo-preview');

    if (btnTriggerLogo && fileLogoUpload) {
      btnTriggerLogo.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileLogoUpload.value = '';
        fileLogoUpload.click();
      };
    }

    if (dropzoneLogo && fileLogoUpload) {
      dropzoneLogo.onclick = (e) => {
        if (e.target !== btnTriggerLogo && !btnTriggerLogo?.contains(e.target)) {
          fileLogoUpload.value = '';
          fileLogoUpload.click();
        }
      };

      dropzoneLogo.ondragover = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneLogo.classList.add('border-sky-500', 'bg-sky-500/10');
      };

      dropzoneLogo.ondragleave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneLogo.classList.remove('border-sky-500', 'bg-sky-500/10');
      };

      dropzoneLogo.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneLogo.classList.remove('border-sky-500', 'bg-sky-500/10');
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length > 0) {
          validateAndProcessImage(files[0], 'logo', (dataUrl, fileName) => {
            applyLogo(dataUrl, fileName);
          });
        }
      };

      fileLogoUpload.onchange = (e) => {
        const files = e.target.files || fileLogoUpload.files;
        if (files && files.length > 0) {
          validateAndProcessImage(files[0], 'logo', (dataUrl, fileName) => {
            applyLogo(dataUrl, fileName);
          });
        }
      };
    }

    if (inputLogoUrl) {
      inputLogoUrl.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          clearErrorNotice('logo');
          applyLogo(val, 'Logo URL');
        }
      });
    }

    container.querySelectorAll('.btn-sample-logo').forEach(btn => {
      btn.addEventListener('click', () => {
        const logoUrl = btn.dataset.sampleLogo;
        const name = btn.textContent.trim();
        clearErrorNotice('logo');
        applyLogo(logoUrl, name);
      });
    });

    // --- DUAL STAMP IMAGE UPLOADS & HANDLERS (COMPLETED & UNCOMPLETED) ---
    const fileStampCompletedUpload = container.querySelector('#file-stamp-completed-upload');
    const fileStampUncompletedUpload = container.querySelector('#file-stamp-uncompleted-upload');
    const btnTriggerStampCompleted = container.querySelector('#btn-trigger-stamp-completed-select');
    const btnTriggerStampUncompleted = container.querySelector('#btn-trigger-stamp-uncompleted-select');
    const dropzoneStampCompleted = container.querySelector('#dropzone-stamp-completed');
    const dropzoneStampUncompleted = container.querySelector('#dropzone-stamp-uncompleted');
    const inputStampCompletedUrl = container.querySelector('#input-stamp-completed-url');
    const inputStampUncompletedUrl = container.querySelector('#input-stamp-uncompleted-url');
    const boxStampCompletedPreview = container.querySelector('#box-stamp-completed-preview');
    const boxStampUncompletedPreview = container.querySelector('#box-stamp-uncompleted-preview');
    const btnClearStampCompletedImg = container.querySelector('#btn-clear-stamp-completed-img');
    const btnClearStampUncompletedImg = container.querySelector('#btn-clear-stamp-uncompleted-img');

    // --- COMPLETED STAMP LISTENERS ---
    if (btnTriggerStampCompleted && fileStampCompletedUpload) {
      btnTriggerStampCompleted.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileStampCompletedUpload.value = '';
        fileStampCompletedUpload.click();
      };
    }

    if (dropzoneStampCompleted && fileStampCompletedUpload) {
      dropzoneStampCompleted.onclick = (e) => {
        if (e.target !== btnTriggerStampCompleted && !btnTriggerStampCompleted?.contains(e.target)) {
          fileStampCompletedUpload.value = '';
          fileStampCompletedUpload.click();
        }
      };

      dropzoneStampCompleted.ondragover = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneStampCompleted.classList.add('border-amber-400', 'bg-amber-500/20');
      };

      dropzoneStampCompleted.ondragleave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneStampCompleted.classList.remove('border-amber-400', 'bg-amber-500/20');
      };

      dropzoneStampCompleted.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneStampCompleted.classList.remove('border-amber-400', 'bg-amber-500/20');
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length > 0) {
          validateAndProcessImage(files[0], 'stamp_completed', (dataUrl, fileName) => {
            if (inputStampCompletedUrl) inputStampCompletedUrl.value = '';
            applyCompletedStamp(dataUrl, fileName);
          });
        }
      };

      fileStampCompletedUpload.onchange = (e) => {
        const files = e.target.files || fileStampCompletedUpload.files;
        if (files && files.length > 0) {
          validateAndProcessImage(files[0], 'stamp_completed', (dataUrl, fileName) => {
            if (inputStampCompletedUrl) inputStampCompletedUrl.value = '';
            applyCompletedStamp(dataUrl, fileName);
          });
        }
      };
    }

    if (inputStampCompletedUrl) {
      inputStampCompletedUrl.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          clearErrorNotice('stamp_completed');
          applyCompletedStamp(val, 'Sello URL');
        }
      });
    }

    container.querySelectorAll('.btn-sample-stamp-completed').forEach(btn => {
      btn.addEventListener('click', () => {
        const stampUrl = btn.dataset.sampleCompleted;
        const name = btn.textContent.trim();
        clearErrorNotice('stamp_completed');
        if (inputStampCompletedUrl) inputStampCompletedUrl.value = stampUrl;
        applyCompletedStamp(stampUrl, name);
      });
    });

    if (btnClearStampCompletedImg) {
      btnClearStampCompletedImg.addEventListener('click', () => {
        currentBranding.stamp_completed_image = null;
        currentBranding.stamp_custom_image = null;
        if (!currentBranding.stamp_uncompleted_image) {
          currentBranding.stamp_icon = 'star';
        }
        if (inputStampCompletedUrl) inputStampCompletedUrl.value = '';
        if (boxStampCompletedPreview) {
          boxStampCompletedPreview.innerHTML = `
            <span class="text-2xl text-amber-400 font-bold">\u2605</span>
            <span class="text-[9px] text-zinc-500 font-bold mt-1">Sin Imagen</span>
          `;
        }
        btnClearStampCompletedImg.classList.add('hidden');
        if (activeProgram?.id) {
          activeProgram.branding = { ...currentBranding };
          loyaltyService.updateProgram(business.id, activeProgram.id, { branding: currentBranding }, session);
        }
        clearErrorNotice('stamp_completed');
        updateStampBadge();
        updatePreview();
        renderQuickFiles('stamp_completed');
        toast.success('Foto de sello completado eliminada');
      });
    }

    // --- UNCOMPLETED STAMP LISTENERS ---
    if (btnTriggerStampUncompleted && fileStampUncompletedUpload) {
      btnTriggerStampUncompleted.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileStampUncompletedUpload.value = '';
        fileStampUncompletedUpload.click();
      };
    }

    if (dropzoneStampUncompleted && fileStampUncompletedUpload) {
      dropzoneStampUncompleted.onclick = (e) => {
        if (e.target !== btnTriggerStampUncompleted && !btnTriggerStampUncompleted?.contains(e.target)) {
          fileStampUncompletedUpload.value = '';
          fileStampUncompletedUpload.click();
        }
      };

      dropzoneStampUncompleted.ondragover = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneStampUncompleted.classList.add('border-zinc-500', 'bg-zinc-800/80');
      };

      dropzoneStampUncompleted.ondragleave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneStampUncompleted.classList.remove('border-zinc-500', 'bg-zinc-800/80');
      };

      dropzoneStampUncompleted.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneStampUncompleted.classList.remove('border-zinc-500', 'bg-zinc-800/80');
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length > 0) {
          validateAndProcessImage(files[0], 'stamp_uncompleted', (dataUrl, fileName) => {
            if (inputStampUncompletedUrl) inputStampUncompletedUrl.value = '';
            applyUncompletedStamp(dataUrl, fileName);
          });
        }
      };

      fileStampUncompletedUpload.onchange = (e) => {
        const files = e.target.files || fileStampUncompletedUpload.files;
        if (files && files.length > 0) {
          validateAndProcessImage(files[0], 'stamp_uncompleted', (dataUrl, fileName) => {
            if (inputStampUncompletedUrl) inputStampUncompletedUrl.value = '';
            applyUncompletedStamp(dataUrl, fileName);
          });
        }
      };
    }

    if (inputStampUncompletedUrl) {
      inputStampUncompletedUrl.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          clearErrorNotice('stamp_uncompleted');
          applyUncompletedStamp(val, 'Sello URL');
        }
      });
    }

    container.querySelectorAll('.btn-sample-stamp-uncompleted, .btn-sample-uncompleted').forEach(btn => {
      btn.addEventListener('click', () => {
        const stampUrl = btn.dataset.sampleUncompleted;
        const name = btn.textContent.trim();
        clearErrorNotice('stamp_uncompleted');
        if (inputStampUncompletedUrl) inputStampUncompletedUrl.value = stampUrl;
        applyUncompletedStamp(stampUrl, name);
      });
    });

    if (btnClearStampUncompletedImg) {
      btnClearStampUncompletedImg.addEventListener('click', () => {
        currentBranding.stamp_uncompleted_image = null;
        if (inputStampUncompletedUrl) inputStampUncompletedUrl.value = '';
        if (boxStampUncompletedPreview) {
          boxStampUncompletedPreview.innerHTML = `
            <span class="text-2xl text-zinc-500 font-bold">\u2606</span>
            <span class="text-[9px] text-zinc-400 font-bold mt-1">Sin Imagen (Silueta)</span>
          `;
        }
        btnClearStampUncompletedImg.classList.add('hidden');
        if (activeProgram?.id) {
          activeProgram.branding = { ...currentBranding };
          loyaltyService.updateProgram(business.id, activeProgram.id, { branding: currentBranding }, session);
        }
        clearErrorNotice('stamp_uncompleted');
        updateStampBadge();
        updatePreview();
        renderQuickFiles('stamp_uncompleted');
        toast.success('Foto de sello sin completar eliminada');
      });
    }

    // --- VECTOR ICON PRESETS (OPTION C) ---
    container.querySelectorAll('.btn-select-icon').forEach(btn => {
      btn.addEventListener('click', () => {
        currentBranding.stamp_completed_image = null;
        currentBranding.stamp_uncompleted_image = null;
        currentBranding.stamp_custom_image = null;
        currentBranding.stamp_icon = btn.dataset.icon;
        if (inputStampCompletedUrl) inputStampCompletedUrl.value = '';
        if (inputStampUncompletedUrl) inputStampUncompletedUrl.value = '';
        if (boxStampCompletedPreview) {
          boxStampCompletedPreview.innerHTML = `
            <span class="text-2xl text-amber-400 font-bold">\u2605</span>
            <span class="text-[9px] text-zinc-500 font-bold mt-1">Icono: ${btn.textContent.trim()}</span>
          `;
        }
        if (boxStampUncompletedPreview) {
          boxStampUncompletedPreview.innerHTML = `
            <span class="text-2xl text-zinc-600 font-bold">\u2606</span>
            <span class="text-[9px] text-zinc-500 font-bold mt-1">Silueta: ${btn.textContent.trim()}</span>
          `;
        }
        container.querySelectorAll('.btn-select-icon').forEach(b => {
          b.className = 'btn-select-icon p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white';
        });
        btn.className = 'btn-select-icon p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition bg-sky-500/20 border-sky-500 text-sky-400 shadow-md';
        updateStampBadge();
        updatePreview();
      });
    });

    // --- POINTS SPECIFIC INPUTS ---
    const selectPointsReq = container.querySelector('#select-points-required');
    if (selectPointsReq) {
      selectPointsReq.addEventListener('change', (e) => {
        pointsRequired = Number(e.target.value) || 100;
        updatePreview();
      });
    }

    const selectPointsRatio = container.querySelector('#select-points-ratio');
    if (selectPointsRatio) {
      selectPointsRatio.addEventListener('change', (e) => {
        pointsRatio = Number(e.target.value) || 10;
        updatePreview();
      });
    }

    // --- PROMO & COUPON SPECIFIC INPUTS ---
    const inputPromoBenefit = container.querySelector('#input-promo-benefit');
    if (inputPromoBenefit) {
      inputPromoBenefit.addEventListener('input', (e) => {
        promoBenefit = e.target.value || 'Beneficio de Bienvenida';
        updatePreview();
      });
    }

    const inputValidUntil = container.querySelector('#input-valid-until');
    if (inputValidUntil) {
      inputValidUntil.addEventListener('change', (e) => {
        validUntil = e.target.value;
        updatePreview();
      });
    }

    const inputPromoTerms = container.querySelector('#input-promo-terms');
    if (inputPromoTerms) {
      inputPromoTerms.addEventListener('input', (e) => {
        terms = e.target.value;
        updatePreview();
      });
    }

    const selectDiscountType = container.querySelector('#select-discount-type');
    if (selectDiscountType) {
      selectDiscountType.addEventListener('change', (e) => {
        discountType = e.target.value;
        updatePreview();
      });
    }

    const inputDiscountVal = container.querySelector('#input-discount-val');
    if (inputDiscountVal) {
      inputDiscountVal.addEventListener('input', (e) => {
        discountValue = Number(e.target.value) || 20;
        updatePreview();
      });
    }

    const inputCouponCode = container.querySelector('#input-coupon-code');
    if (inputCouponCode) {
      inputCouponCode.addEventListener('input', (e) => {
        couponCode = e.target.value.toUpperCase();
        updatePreview();
      });
    }

    const inputMinSpend = container.querySelector('#input-min-spend');
    if (inputMinSpend) {
      inputMinSpend.addEventListener('input', (e) => {
        minSpend = e.target.value;
        updatePreview();
      });
    }

    // --- CHARACTER COUNTERS & SHORT TEXT VALIDATION ---

    const charCountRewardName = container.querySelector('#char-count-reward-name');
    const rewardInput = container.querySelector('#input-reward-name');
    if (rewardInput) {
      rewardInput.addEventListener('input', (e) => {
        rewardName = e.target.value || 'Recompensa';
        if (charCountRewardName) {
          const len = rewardName.length;
          charCountRewardName.textContent = `${len} / 20 car.`;
          if (len > 20) {
            charCountRewardName.className = 'text-[10px] font-mono text-amber-400 font-bold';
          } else {
            charCountRewardName.className = 'text-[10px] font-mono text-zinc-400 font-bold';
          }
        }
        updatePreview();
      });
    }

    const charCountPromoBenefit = container.querySelector('#char-count-promo-benefit');
    if (inputPromoBenefit && charCountPromoBenefit) {
      inputPromoBenefit.addEventListener('input', () => {
        const len = inputPromoBenefit.value.length;
        charCountPromoBenefit.textContent = `${len} / 30 car.`;
        if (len > 30) {
          charCountPromoBenefit.className = 'text-[10px] font-mono text-amber-400 font-bold';
        } else {
          charCountPromoBenefit.className = 'text-[10px] font-mono text-zinc-400 font-bold';
        }
      });
    }

    // --- HERO IMAGE / BANNER 3:1 UPLOAD & CONTROLS ---
    const fileCardBgUpload = container.querySelector('#file-card-bg-upload');
    const btnTriggerBgBanner = container.querySelector('#btn-trigger-bg-banner-select');
    const dropzoneBgBanner = container.querySelector('#dropzone-bg-banner');
    const inputBgBannerUrl = container.querySelector('#input-bg-banner-url');
    const btnClearBgBanner = container.querySelector('#btn-clear-bg-banner');

    if (btnTriggerBgBanner && fileCardBgUpload) {
      btnTriggerBgBanner.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileCardBgUpload.value = '';
        fileCardBgUpload.click();
      };
    }

    if (dropzoneBgBanner && fileCardBgUpload) {
      dropzoneBgBanner.onclick = (e) => {
        if (e.target !== btnTriggerBgBanner && !btnTriggerBgBanner?.contains(e.target)) {
          fileCardBgUpload.value = '';
          fileCardBgUpload.click();
        }
      };

      dropzoneBgBanner.ondragover = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneBgBanner.classList.add('border-sky-500', 'bg-sky-500/10');
      };

      dropzoneBgBanner.ondragleave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneBgBanner.classList.remove('border-sky-500', 'bg-sky-500/10');
      };

      dropzoneBgBanner.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneBgBanner.classList.remove('border-sky-500', 'bg-sky-500/10');
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length > 0) {
          validateAndProcessImage(files[0], 'banner', (dataUrl, fileName) => {
            if (inputBgBannerUrl) inputBgBannerUrl.value = '';
            applyBgBanner(dataUrl, fileName);
          });
        }
      };

      fileCardBgUpload.onchange = (e) => {
        const files = e.target.files || fileCardBgUpload.files;
        if (files && files.length > 0) {
          validateAndProcessImage(files[0], 'banner', (dataUrl, fileName) => {
            if (inputBgBannerUrl) inputBgBannerUrl.value = '';
            applyBgBanner(dataUrl, fileName);
          });
        }
      };
    }

    if (inputBgBannerUrl) {
      inputBgBannerUrl.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          clearErrorNotice('banner');
          applyBgBanner(val, 'Banner URL');
        }
      });
    }

    container.querySelectorAll('.btn-sample-banner').forEach(btn => {
      btn.addEventListener('click', () => {
        const sampleUrl = btn.dataset.sampleBanner;
        const name = btn.textContent.trim();
        clearErrorNotice('banner');
        if (inputBgBannerUrl) inputBgBannerUrl.value = sampleUrl;
        applyBgBanner(sampleUrl, name);
      });
    });

    if (btnClearBgBanner) {
      btnClearBgBanner.addEventListener('click', () => {
        clearErrorNotice('banner');
        applyBgBanner(null);
      });
    }

    // --- REWARD & STAMPS INPUTS ---
    const stampsSelect = container.querySelector('#select-total-stamps');
    if (stampsSelect) {
      stampsSelect.addEventListener('change', (e) => {
        totalStamps = parseInt(e.target.value);
        updatePreview();
      });
    }

    const radiusSelect = container.querySelector('#select-border-radius');
    if (radiusSelect) {
      radiusSelect.addEventListener('change', (e) => {
        currentBranding.border_radius = e.target.value;
        updatePreview();
      });
    }

    // --- COLOR INPUTS & PALETTE GRID LISTENERS ---
    const primaryInput = container.querySelector('#input-primary-color');
    const primaryText = container.querySelector('#text-primary-color');
    const bgFromInput = container.querySelector('#input-bg-from');
    const bgFromText = container.querySelector('#text-bg-from');
    const badgeBgHex = container.querySelector('#badge-bg-hex');
    const badgePrimaryHex = container.querySelector('#badge-primary-hex');

    let activeColorTarget = 'bg'; // 'bg' or 'accent'

    function syncColorState() {
      currentBranding.primary_color = normalizeHex(currentBranding.primary_color, '#0EA5E9');
      currentBranding.bg_gradient_from = normalizeHex(currentBranding.bg_gradient_from, '#0F172A');
      currentBranding.bg_gradient_to = currentBranding.bg_gradient_from;

      if (activeProgram?.id) {
        activeProgram.branding = {
          ...activeProgram.branding,
          ...currentBranding,
          primary_color: currentBranding.primary_color,
          bg_gradient_from: currentBranding.bg_gradient_from,
          bg_gradient_to: currentBranding.bg_gradient_from
        };
        loyaltyService.updateProgram(business.id, activeProgram.id, { branding: activeProgram.branding }, session);
      }

      // Highlight active swatch in palette grid
      const targetColor = activeColorTarget === 'bg' ? currentBranding.bg_gradient_from : currentBranding.primary_color;
      container.querySelectorAll('.btn-color-swatch').forEach(sw => {
        const isSelected = (sw.dataset.color || '').toUpperCase() === targetColor.toUpperCase();
        if (isSelected) {
          sw.className = 'btn-color-swatch w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 border-white ring-2 ring-sky-400 scale-110 shadow-xl transition cursor-pointer relative group/swatch z-10';
        } else {
          sw.className = 'btn-color-swatch w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-white/15 hover:scale-110 hover:border-white hover:shadow-lg transition cursor-pointer relative group/swatch';
        }
      });

      updatePreview();
    }

    if (primaryInput && primaryText) {
      primaryInput.addEventListener('input', (e) => {
        const val = normalizeHex(e.target.value, '#0EA5E9');
        currentBranding.primary_color = val;
        primaryText.value = val;
        if (badgePrimaryHex) badgePrimaryHex.textContent = val;
        syncColorState();
      });
      primaryText.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#') && val.length > 0) val = '#' + val;
        if (/^#[0-9A-F]{6}$/i.test(val)) {
          const normalized = normalizeHex(val, '#0EA5E9');
          currentBranding.primary_color = normalized;
          primaryInput.value = normalized;
          if (badgePrimaryHex) badgePrimaryHex.textContent = normalized;
          syncColorState();
        } else {
          currentBranding.primary_color = val;
          if (badgePrimaryHex) badgePrimaryHex.textContent = val.toUpperCase();
        }
      });
    }

    if (bgFromInput && bgFromText) {
      bgFromInput.addEventListener('input', (e) => {
        const val = normalizeHex(e.target.value, '#0F172A');
        currentBranding.bg_gradient_from = val;
        currentBranding.bg_gradient_to = val;
        bgFromText.value = val;
        if (badgeBgHex) badgeBgHex.textContent = val;
        syncColorState();
      });
      bgFromText.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#') && val.length > 0) val = '#' + val;
        if (/^#[0-9A-F]{6}$/i.test(val)) {
          const normalized = normalizeHex(val, '#0F172A');
          currentBranding.bg_gradient_from = normalized;
          currentBranding.bg_gradient_to = normalized;
          bgFromInput.value = normalized;
          if (badgeBgHex) badgeBgHex.textContent = normalized;
          syncColorState();
        } else {
          currentBranding.bg_gradient_from = val;
          currentBranding.bg_gradient_to = val;
          if (badgeBgHex) badgeBgHex.textContent = val.toUpperCase();
        }
      });
    }

    // Color target tabs (Fondo vs Acento)
    container.querySelectorAll('.btn-color-target-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        activeColorTarget = tab.dataset.targetType;
        container.querySelectorAll('.btn-color-target-tab').forEach(t => {
          if (t.dataset.targetType === activeColorTarget) {
            t.className = 'btn-color-target-tab px-3 py-1 rounded-lg text-xs font-bold transition bg-sky-500 text-black shadow-sm cursor-pointer';
          } else {
            t.className = 'btn-color-target-tab px-3 py-1 rounded-lg text-xs font-bold transition text-zinc-400 hover:text-white cursor-pointer';
          }
        });
        syncColorState();
      });
    });

    // Swatch clicks from the Cuadrícula
    container.querySelectorAll('.btn-color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        e.preventDefault();
        const hex = normalizeHex(swatch.dataset.color, '#0F172A');
        if (activeColorTarget === 'bg') {
          currentBranding.bg_gradient_from = hex;
          currentBranding.bg_gradient_to = hex;
          if (bgFromInput) bgFromInput.value = hex;
          if (bgFromText) bgFromText.value = hex;
          if (badgeBgHex) badgeBgHex.textContent = hex;
          toast.success(`Color de fondo aplicado: ${hex}`);
        } else {
          currentBranding.primary_color = hex;
          if (primaryInput) primaryInput.value = hex;
          if (primaryText) primaryText.value = hex;
          if (badgePrimaryHex) badgePrimaryHex.textContent = hex;
          toast.success(`Color de acento aplicado: ${hex}`);
        }
        syncColorState();
      });
    });

    // Preset solid themes tailored for Apple & Google Wallet
    container.querySelectorAll('.btn-theme-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const theme = btn.dataset.theme;
        if (theme === 'slate') {
          currentBranding.primary_color = '#0EA5E9';
          currentBranding.secondary_color = '#0369A1';
          currentBranding.bg_gradient_from = '#0F172A';
          currentBranding.bg_gradient_to = '#0F172A';
        } else if (theme === 'cafe') {
          currentBranding.primary_color = '#F59E0B';
          currentBranding.secondary_color = '#B45309';
          currentBranding.bg_gradient_from = '#1C160C';
          currentBranding.bg_gradient_to = '#1C160C';
        } else if (theme === 'emerald') {
          currentBranding.primary_color = '#10B981';
          currentBranding.secondary_color = '#047857';
          currentBranding.bg_gradient_from = '#06281E';
          currentBranding.bg_gradient_to = '#06281E';
        } else if (theme === 'purple') {
          currentBranding.primary_color = '#8B5CF6';
          currentBranding.secondary_color = '#6D28D9';
          currentBranding.bg_gradient_from = '#1E1035';
          currentBranding.bg_gradient_to = '#1E1035';
        } else if (theme === 'navy') {
          currentBranding.primary_color = '#6366F1';
          currentBranding.secondary_color = '#4338CA';
          currentBranding.bg_gradient_from = '#1E1B4B';
          currentBranding.bg_gradient_to = '#1E1B4B';
        } else if (theme === 'pureblack') {
          currentBranding.primary_color = '#FFFFFF';
          currentBranding.secondary_color = '#A1A1AA';
          currentBranding.bg_gradient_from = '#000000';
          currentBranding.bg_gradient_to = '#000000';
        }

        if (primaryInput) primaryInput.value = currentBranding.primary_color;
        if (primaryText) primaryText.value = currentBranding.primary_color;
        if (badgePrimaryHex) badgePrimaryHex.textContent = currentBranding.primary_color;
        if (bgFromInput) bgFromInput.value = currentBranding.bg_gradient_from;
        if (bgFromText) bgFromText.value = currentBranding.bg_gradient_from;
        if (badgeBgHex) badgeBgHex.textContent = currentBranding.bg_gradient_from;
        syncColorState();
      });
    });

    // --- SAVE BUTTON LOGIC (TOP & BOTTOM) ---
    function handleSaveProgram(e) {
      if (e) e.preventDefault();

      const normalizedBg = normalizeHex(currentBranding.bg_gradient_from, '#0F172A');
      const normalizedPrimary = normalizeHex(currentBranding.primary_color, '#0EA5E9');

      currentBranding.bg_gradient_from = normalizedBg;
      currentBranding.bg_gradient_to = normalizedBg;
      currentBranding.primary_color = normalizedPrimary;

      const updates = {
        name: cardName,
        stamps_required: totalStamps,
        points_required: pointsRequired,
        points_ratio: pointsRatio,
        reward_name: rewardName,
        promo_benefit: promoBenefit,
        valid_until: validUntil,
        terms: terms,
        discount_type: discountType,
        discount_value: discountValue,
        coupon_code: couponCode,
        min_spend: minSpend,
        branding: {
          ...activeProgram.branding,
          ...currentBranding,
          primary_color: normalizedPrimary,
          bg_gradient_from: normalizedBg,
          bg_gradient_to: normalizedBg,
          stamp_completed_image: currentBranding.stamp_completed_image || null,
          stamp_uncompleted_image: currentBranding.stamp_uncompleted_image || null,
          stamp_custom_image: currentBranding.stamp_completed_image || null,
          bg_image_url: currentBranding.bg_image_url || null,
          logo_url: currentLogoUrl
        }
      };

      if (activeProgram?.id) {
        loyaltyService.updateProgram(business.id, activeProgram.id, updates, session);
        localStorage.setItem(`vynta_last_active_program_${business?.id}`, activeProgram.id);
      }

      allPrograms = loyaltyService.getAllPrograms(business.id) || [];
      activeProgram = allPrograms.find(p => p.id === activeProgram.id) || activeProgram;

      toast.fireConfetti();
      toast.success(`\u00A1Tarjeta "${cardName}" guardada correctamente!`);
    }

    const btnSave = container.querySelector('#btn-save-branding');
    if (btnSave) btnSave.addEventListener('click', handleSaveProgram);

    const btnSaveBottom = container.querySelector('#btn-save-branding-bottom');
    if (btnSaveBottom) btnSaveBottom.addEventListener('click', handleSaveProgram);

    // Render Quick Selection libraries for all categories
    ['logo', 'stamp_completed', 'stamp_uncompleted', 'banner'].forEach(cat => renderQuickFiles(cat));

    // Highlight initial active swatch in color grid
    syncColorState();

    // Wire error alert dismiss buttons
    container.querySelectorAll('.btn-dismiss-alert').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const el = container.querySelector('#' + target);
        if (el) el.classList.add('hidden');
      });
    });
  }

  renderForm();
  return container;
}

