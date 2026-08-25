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

  let activeProgram = allPrograms.find(p => p.active) || allPrograms[0] || {
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
  let currentLogoUrl = business?.logo_url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=128&auto=format&fit=crop&q=80';

  let currentBranding = {
    primary_color: activeProgram.branding?.primary_color || business?.branding?.primary_color || '#0EA5E9',
    secondary_color: activeProgram.branding?.secondary_color || business?.branding?.secondary_color || '#0369A1',
    bg_gradient_from: activeProgram.branding?.bg_gradient_from || business?.branding?.bg_gradient_from || '#0F172A',
    bg_gradient_to: activeProgram.branding?.bg_gradient_to || business?.branding?.bg_gradient_to || '#020617',
    bg_image_url: activeProgram.branding?.bg_image_url || business?.branding?.bg_image_url || null,
    overlay_opacity: (activeProgram.branding?.overlay_opacity !== undefined) ? activeProgram.branding.overlay_opacity : (business?.branding?.overlay_opacity !== undefined ? business.branding.overlay_opacity : 0.70),
    stamp_icon: activeProgram.branding?.stamp_icon || business?.branding?.stamp_icon || 'star',
    stamp_custom_image: activeProgram.branding?.stamp_custom_image || business?.branding?.stamp_custom_image || null,
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
                      <label for="input-card-title-name" class="block text-[11px] font-bold text-zinc-300">Nombre de la Tarjeta:</label>
                      <span id="char-count-card-name" class="text-[10px] font-mono text-zinc-400 font-bold">${cardName.length} / 25 car.</span>
                    </div>
                    <input type="text" id="input-card-title-name" maxlength="35" value="${cardName}" placeholder="Nombre de esta tarjeta..." class="w-full bg-zinc-900/90 border border-zinc-700 hover:border-zinc-600 ${barTheme.focusBorder} rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition">
                    <p class="text-[10px] text-zinc-400">Recomendado máx. 25 caracteres para evitar cortes en la pantalla del móvil.</p>
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
                <span>\u2139\uFE0F</span> Requisitos recomendados para Wallet:
              </div>
              <ul class="list-disc list-inside text-[11px] space-y-0.5 text-zinc-300">
                <li><strong>Formato:</strong> PNG con <strong>fondo transparente</strong> (o blanco limpio).</li>
                <li><strong>Tama\u00F1o ideal:</strong> Cuadrado de <code>300 x 300 px</code> o rectangular de <code>480 x 150 px</code>.</li>
                <li><strong>Consejo de dise\u00F1o:</strong> Evita textos diminutos que no se distingan en la miniatura del m\u00F3vil.</li>
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
                  <input type="text" id="input-promo-benefit" maxlength="40" value="${promoBenefit}" placeholder="Ej: 1 Bebida Gratis, 15\u20AC DTO Bienvenida" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500">
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
            <div class="glass-panel p-5 rounded-3xl space-y-4 border border-amber-500/20 shadow-lg">
              <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <span>\u2605</span> 2. Dise\u00F1o e Imagen de los Sellos (.PNG / Iconos)
                </h2>
                <span id="badge-stamp-mode" class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  currentBranding.stamp_custom_image ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                }">
                  ${currentBranding.stamp_custom_image ? '\u2714 Sello .PNG Virtualizado y Activo' : 'Icono Vectorial'}
                </span>
              </div>

              <!-- Custom Stamp Image Import Area -->
              <div class="p-4 rounded-2xl bg-zinc-900/80 border border-amber-500/30 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>\uD83D\uDDBC\uFE0F</span> Opci\u00F3n A: Virtualizar tu propio archivo .PNG (con fondo transparente)
                  </span>
                  ${currentBranding.stamp_custom_image ? `
                    <button type="button" id="btn-clear-stamp-img" class="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer">
                      <span>\u2715</span> Quitar imagen
                    </button>
                  ` : ''}
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div id="box-stamp-custom-preview" class="sm:col-span-4 h-24 rounded-2xl border-2 border-dashed border-amber-500/40 flex flex-col items-center justify-center bg-black/60 shrink-0 overflow-hidden p-2">
                    ${currentBranding.stamp_custom_image ? `
                      <img src="${currentBranding.stamp_custom_image}" class="w-14 h-14 object-contain filter drop-shadow" alt="sello preview">
                      <span class="text-[9px] text-amber-300 mt-1 font-bold">.PNG Aplicado</span>
                    ` : `
                      <span class="text-2xl text-zinc-600 font-bold">\u2605</span>
                      <span class="text-[9px] text-zinc-500 font-bold mt-1">Sin .PNG</span>
                    `}
                  </div>

                  <div class="sm:col-span-8 space-y-3">
                    <div id="dropzone-stamp" class="border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl p-3 text-center cursor-pointer transition bg-amber-500/5 hover:bg-amber-500/15 group">
                      <p class="text-xs font-bold text-amber-300 group-hover:text-amber-200 transition flex items-center justify-center gap-1.5">
                        <span>\u2912</span> Arrastra tu archivo .PNG aqu\u00ED
                      </p>
                      <p class="text-[10px] text-zinc-400 mt-0.5">Compatible con cualquier imagen PNG transparente</p>
                      <div class="mt-2 flex justify-center">
                        <button type="button" id="btn-trigger-stamp-select" class="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer">
                          <span>\uD83D\uDCC1</span> Escanear / Subir Archivo .PNG
                        </button>
                      </div>
                    </div>

                    <input type="url" id="input-stamp-custom-url" value="${currentBranding.stamp_custom_image && !currentBranding.stamp_custom_image.startsWith('data:') ? currentBranding.stamp_custom_image : ''}" placeholder="O pegar URL directa de .PNG (https://...)" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono">
                  </div>
                </div>

                <!-- Fast Sample .PNG Stamps -->
                <div class="pt-2 border-t border-zinc-800/80">
                  <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Sellos .PNG de Muestra R\u00E1pidos:</span>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" data-sample-stamp="https://cdn-icons-png.flaticon.com/512/924/924514.png" class="btn-sample-stamp px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\u2615</span> Caf\u00E9</button>
                    <button type="button" data-sample-stamp="https://cdn-icons-png.flaticon.com/512/1000/1000966.png" class="btn-sample-stamp px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\u2702\uFE0F</span> Barber\u00EDa</button>
                    <button type="button" data-sample-stamp="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" class="btn-sample-stamp px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\u2B50</span> Estrella</button>
                    <button type="button" data-sample-stamp="https://cdn-icons-png.flaticon.com/512/785/785116.png" class="btn-sample-stamp px-2.5 py-1 rounded-lg text-xs bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-zinc-300 transition flex items-center gap-1"><span>\u2764\uFE0F</span> Coraz\u00F3n</button>
                  </div>
                </div>
              </div>

              <!-- Predefined Vector Icons Selector -->
              <div class="space-y-2 pt-2">
                <span class="block text-xs font-bold text-zinc-300">Opci\u00F3n B: O elegir uno de nuestros Iconos Vectoriales:</span>
                <div class="grid grid-cols-5 gap-2" id="icon-selector-grid">
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
                    <button type="button" data-icon="${item.id}" class="btn-select-icon p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition ${
                      !currentBranding.stamp_custom_image && currentBranding.stamp_icon === item.id 
                        ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-md' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }">
                      <span class="text-xs font-bold">${item.label}</span>
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
                  <span>\uD83C\uDFF7\uFE0F</span> Regla de Recompensa para Apple & Google Wallet:
                </div>
                <p class="text-[11px] text-zinc-300">
                  Usa t\u00EDtulos de premio cortos de m\u00E1ximo <strong>25-30 caracteres</strong> (ej: <em>\u201C1 Caf\u00E9 Gratis\u201D</em>, <em>\u201C10\u20AC de Descuento\u201D</em>) para evitar que Apple o Android corten el texto con puntos suspensivos.
                </p>
              </div>

              <div class="space-y-3">
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-xs font-bold text-zinc-300">Nombre del Premio / Recompensa *</label>
                    <span id="char-count-reward-name" class="text-[10px] font-mono text-zinc-400 font-bold">${rewardName.length} / 30 car.</span>
                  </div>
                  <input type="text" id="input-reward-name" maxlength="35" value="${rewardName}" placeholder="Ej: 1 Caf\u00E9 Gratis + Tarta" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500">
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
                  <input type="text" id="input-reward-name" maxlength="35" value="${rewardName}" placeholder="Ej: 10\u20AC de Descuento, Men\u00FA Especial Gratis" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500">
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

          <!-- 3. IMAGEN DE FRANJA / BANNER CENTRAL (HERO IMAGE - RATIO 3:1) -->
          <div class="glass-panel p-5 rounded-3xl space-y-4 border border-white/5">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <span>\uD83C\uDFDE\uFE0F</span> 3. Imagen de Fondo / Banner Central (Hero Image)
                </h2>
                <p class="text-[11px] text-zinc-400 mt-0.5">La franja visual que aparece en el centro de Apple y Google Wallet.</p>
              </div>
              <span class="text-[10px] font-extrabold ${currentBranding.bg_image_url ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'} px-2.5 py-1 rounded-full border">
                ${currentBranding.bg_image_url ? 'Banner Personalizado' : 'Franja Automática'}
              </span>
            </div>

            <!-- Hero Image 3:1 Specs Helper Badge -->
            <div class="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
              <div class="flex items-center gap-2 font-bold text-sky-300">
                <span>\uD83D\uDCD0</span> Especificaciones oficiales de Banner para Wallet:
              </div>
              <ul class="list-disc list-inside text-[11px] space-y-1 text-zinc-300">
                <li><strong>Modo Automático (Recomendado):</strong> Nuestro servidor genera la franja exacta en ratio 3:1 con las cajas de sellos o saldo de puntos y el icono de premio.</li>
                <li><strong>Banner Personalizado:</strong> Si subes tu propia imagen, debe tener una <strong>proporción 3:1 horizontal</strong> (tamaño exacto: <code>1032 x 336 px</code> o <code>1125 x 432 px</code>). <em>(Si subes una foto vertical o cuadrada, el móvil la recortará por el centro).</em></li>
              </ul>
            </div>

            <!-- Banner Upload Controls -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <span>\uD83D\uDDBC\uFE0F</span> Banner Personalizado (Opcional - Ratio 3:1)
                </span>
                ${currentBranding.bg_image_url ? `
                  <button type="button" id="btn-clear-bg-banner" class="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer">
                    <span>\u2715</span> Usar Franja Automática
                  </button>
                ` : ''}
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div class="sm:col-span-4 h-24 rounded-2xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center bg-black/60 shrink-0 overflow-hidden p-1.5 relative">
                  ${currentBranding.bg_image_url ? `
                    <img id="img-bg-banner-preview" src="${currentBranding.bg_image_url}" class="w-full h-full object-cover rounded-xl" alt="banner preview">
                    <span class="absolute bottom-1 bg-black/80 text-[8px] font-mono font-bold text-amber-300 px-1.5 py-0.5 rounded">3:1 Activo</span>
                  ` : `
                    <span class="text-lg text-sky-400 font-bold">\u2728</span>
                    <span class="text-[9px] text-zinc-400 font-bold mt-1 text-center">Franja Autom\u00E1tica Servidor (3:1)</span>
                  `}
                </div>

                <div class="sm:col-span-8 space-y-3">
                  <div id="dropzone-bg-banner" class="border-2 border-dashed border-zinc-700 hover:border-sky-500 rounded-2xl p-3 text-center cursor-pointer transition bg-zinc-900/40 hover:bg-sky-500/5 group">
                    <p class="text-xs font-bold text-white group-hover:text-sky-400 transition flex items-center justify-center gap-1.5">
                      <span>\u2912</span> Arrastra tu banner 3:1 aqu\u00ED o pulsa para subir
                    </p>
                    <p class="text-[10px] text-zinc-500 mt-0.5">Tama\u00F1o exacto: 1032 x 336 px (PNG o JPG)</p>
                    <div class="mt-2 flex justify-center">
                      <button type="button" id="btn-trigger-bg-banner-select" class="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer">
                        <span>\uD83D\uDCC1</span> Seleccionar Banner (1032 x 336 px)
                      </button>
                    </div>
                  </div>

                  <input type="url" id="input-bg-banner-url" value="${currentBranding.bg_image_url && !currentBranding.bg_image_url.startsWith('data:') ? currentBranding.bg_image_url : ''}" placeholder="O pegar enlace directo URL del Banner (https://...)" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 font-mono">
                </div>
              </div>
            </div>
          </div>

          <!-- 4. COLORES DE LA TARJETA (FONDO SÓLIDO Y ACENTOS) -->
          <div class="glass-panel p-5 rounded-3xl space-y-4 border border-white/5">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                  <span>\uD83C\uDFA8</span> 4. Colores de la Tarjeta (Fondo S\u00F3lido & Acentos)
                </h2>
                <p class="text-[11px] text-zinc-400 mt-0.5">Apple Wallet y Google Wallet aplican un color s\u00F3lido al cuerpo del pase.</p>
              </div>
              <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Alto Contraste
              </span>
            </div>

            <!-- Solid Colors Guidelines Helper -->
            <div class="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs">
              <div class="flex items-center gap-1.5 font-bold text-sky-300">
                <span>\uD83D\uDD0E</span> C\u00F3mo funcionan los colores en Wallet:
              </div>
              <ul class="list-disc list-inside text-[11px] space-y-0.5 text-zinc-300">
                <li><strong>Color de Fondo S\u00F3lido:</strong> Elige tonos oscuros y elegantes (ej: <code>#0F172A</code> negro/grafito, <code>#1E1B4B</code> azul marino, o <code>#064E3B</code> verde oscuro).</li>
                <li><strong>Color de Acento:</strong> Destacar\u00E1 los sellos, puntos, n\u00FAmeros y etiquetas clave con m\u00E1xima legibilidad en la pantalla.</li>
              </ul>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[11px] font-bold text-zinc-300 mb-1">Color de Fondo S\u00F3lido (Cuerpo de la Tarjeta)</label>
                <div class="flex items-center gap-2">
                  <input type="color" id="input-bg-from" value="${currentBranding.bg_gradient_from || '#0F172A'}" class="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0">
                  <input type="text" id="text-bg-from" value="${currentBranding.bg_gradient_from || '#0F172A'}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white font-bold">
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-zinc-300 mb-1">Color Principal / Acento (Sellos, Puntos, Etiquetas)</label>
                <div class="flex items-center gap-2">
                  <input type="color" id="input-primary-color" value="${currentBranding.primary_color}" class="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0">
                  <input type="text" id="text-primary-color" value="${currentBranding.primary_color}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white font-bold">
                </div>
              </div>
            </div>

            <!-- Predefined Solid Theme Presets -->
            <div class="pt-2 border-t border-zinc-800/80">
              <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">Colores S\u00F3lidos Recomendados para Wallet:</span>
              <div class="flex flex-wrap gap-2">
                <button type="button" data-theme="slate" class="btn-theme-preset px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-sky-500/40 text-sky-300 hover:bg-slate-800 font-bold transition flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#0EA5E9]"></span> Negro Grafito (Slate)
                </button>
                <button type="button" data-theme="cafe" class="btn-theme-preset px-3 py-1.5 rounded-xl text-xs bg-stone-900 border border-amber-500/40 text-amber-300 hover:bg-stone-800 font-bold transition flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span> Obsidiana \u00C1mbar
                </button>
                <button type="button" data-theme="emerald" class="btn-theme-preset px-3 py-1.5 rounded-xl text-xs bg-emerald-950 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 font-bold transition flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span> Esmeralda Profundo
                </button>
                <button type="button" data-theme="purple" class="btn-theme-preset px-3 py-1.5 rounded-xl text-xs bg-purple-950 border border-purple-500/40 text-purple-300 hover:bg-purple-900 font-bold transition flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span> P\u00FArpura Nocturno
                </button>
                <button type="button" data-theme="navy" class="btn-theme-preset px-3 py-1.5 rounded-xl text-xs bg-indigo-950 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900 font-bold transition flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#6366F1]"></span> Azul Noche Indigo
                </button>
                <button type="button" data-theme="pureblack" class="btn-theme-preset px-3 py-1.5 rounded-xl text-xs bg-black border border-zinc-700 text-white hover:bg-zinc-900 font-bold transition flex items-center gap-1.5">
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
              <label class="p-3.5 rounded-2xl border-2 ${isBasic ? 'border-zinc-800/60 opacity-80 bg-zinc-900/60' : 'border-amber-500/50 hover:border-amber-400 bg-amber-950/30'} flex items-start gap-3 cursor-pointer transition group shadow-sm">
                <input type="radio" name="new_card_style" value="stamps" class="mt-1 text-amber-500 focus:ring-amber-500 bg-black border-amber-600">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-black text-amber-300 group-hover:text-amber-200 transition">\u2B50 Tarjeta Loyalty (Sellos)</span>
                    <span class="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">Plan PRO</span>
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

  function handleImageFile(file, callback) {
    if (!file) return;
    if (!file.type.match(/image.*/)) {
      toast.error('Solo se permiten archivos de imagen (PNG, JPG, SVG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const isJpeg = file.type && (file.type.includes('jpeg') || file.type.includes('jpg'));
          const outputType = isJpeg ? 'image/jpeg' : 'image/png';
          callback(canvas.toDataURL(outputType, 0.95));
        } catch (err) {
          callback(rawDataUrl);
        }
      };
      img.onerror = () => callback(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = () => toast.error('Error al leer el archivo de imagen.');
    reader.readAsDataURL(file);
  }

  function bindEvents() {
    // --- TOP CARD SWITCHER ---
    const selectCardToEdit = container.querySelector('#select-card-to-edit');
    if (selectCardToEdit) {
      selectCardToEdit.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        const found = allPrograms.find(p => p.id === selectedId);
        if (found) {
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

          if (found.branding) {
            currentBranding = { ...currentBranding, ...found.branding };
          }
          renderForm();
          toast.success(`Editando tarjeta: ${found.name}`);
        }
      });
    }

    // --- CARD TITLE INPUT ---
    const inputCardTitleName = container.querySelector('#input-card-title-name');
    if (inputCardTitleName) {
      inputCardTitleName.addEventListener('input', (e) => {
        cardName = e.target.value.trim() || 'Tarjeta Digital';
        activeProgram.name = cardName;
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
          const isProStyle = val !== 'points';
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

        if (isBasic && style !== 'points') {
          toast.error('En el Plan BASIC solo puedes crear Tarjetas Cliente (Puntos). Actualiza al Plan PRO para crear todos los estilos.');
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

    function applyLogo(imageUrl) {
      if (!imageUrl) return;
      currentLogoUrl = imageUrl;
      if (imgLogoPreview) imgLogoPreview.src = imageUrl;
      if (inputLogoUrl) inputLogoUrl.value = imageUrl.startsWith('data:') ? '' : imageUrl;
      updatePreview();
    }

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
          handleImageFile(files[0], (dataUrl) => {
            applyLogo(dataUrl);
            toast.success('\u00A1Logotipo subido y aplicado!');
          });
        }
      };

      fileLogoUpload.onchange = (e) => {
        const files = e.target.files || fileLogoUpload.files;
        if (files && files.length > 0) {
          handleImageFile(files[0], (dataUrl) => {
            applyLogo(dataUrl);
            toast.success('\u00A1Logotipo subido y aplicado!');
          });
        }
      };
    }

    if (inputLogoUrl) {
      inputLogoUrl.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) applyLogo(val);
      });
    }

    container.querySelectorAll('.btn-sample-logo').forEach(btn => {
      btn.addEventListener('click', () => {
        const logoUrl = btn.dataset.sampleLogo;
        applyLogo(logoUrl);
        toast.success('Logotipo de muestra seleccionado');
      });
    });

    // --- STAMP IMAGE UPLOAD & DRAG/DROP ---
    const fileStampUpload = container.querySelector('#file-stamp-upload');
    const btnTriggerStamp = container.querySelector('#btn-trigger-stamp-select');
    const dropzoneStamp = container.querySelector('#dropzone-stamp');
    const inputStampCustomUrl = container.querySelector('#input-stamp-custom-url');
    const boxStampPreview = container.querySelector('#box-stamp-custom-preview');
    const badgeStampMode = container.querySelector('#badge-stamp-mode');

    function applyCustomStamp(imageUrl) {
      if (!imageUrl) return;
      currentBranding.stamp_custom_image = imageUrl;
      currentBranding.stamp_icon = 'custom_image';
      
      if (boxStampPreview) {
        boxStampPreview.innerHTML = `
          <img src="${imageUrl}" class="w-14 h-14 object-contain filter drop-shadow" alt="sello preview">
          <span class="text-[9px] text-amber-300 mt-1 font-bold">.PNG Virtualizado</span>
        `;
      }
      
      if (badgeStampMode) {
        badgeStampMode.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/50';
        badgeStampMode.textContent = '\u2714 Sello .PNG Virtualizado y Activo';
      }

      container.querySelectorAll('.btn-select-icon').forEach(b => {
        b.className = 'btn-select-icon p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white';
      });

      updatePreview();
      toast.success('\u00A1Imagen .PNG virtualizada y aplicada a los sellos!');
    }

    if (btnTriggerStamp && fileStampUpload) {
      btnTriggerStamp.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileStampUpload.value = '';
        fileStampUpload.click();
      };
    }

    if (dropzoneStamp && fileStampUpload) {
      dropzoneStamp.onclick = (e) => {
        if (e.target !== btnTriggerStamp && !btnTriggerStamp?.contains(e.target)) {
          fileStampUpload.value = '';
          fileStampUpload.click();
        }
      };

      dropzoneStamp.ondragover = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneStamp.classList.add('border-amber-400', 'bg-amber-500/20');
      };

      dropzoneStamp.ondragleave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneStamp.classList.remove('border-amber-400', 'bg-amber-500/20');
      };

      dropzoneStamp.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzoneStamp.classList.remove('border-amber-400', 'bg-amber-500/20');
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length > 0) {
          handleImageFile(files[0], (dataUrl) => {
            if (inputStampCustomUrl) inputStampCustomUrl.value = '';
            applyCustomStamp(dataUrl);
          });
        }
      };

      fileStampUpload.onchange = (e) => {
        const files = e.target.files || fileStampUpload.files;
        if (files && files.length > 0) {
          handleImageFile(files[0], (dataUrl) => {
            if (inputStampCustomUrl) inputStampCustomUrl.value = '';
            applyCustomStamp(dataUrl);
          });
        }
      };
    }

    if (inputStampCustomUrl) {
      inputStampCustomUrl.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) applyCustomStamp(val);
      });
    }

    container.querySelectorAll('.btn-sample-stamp').forEach(btn => {
      btn.addEventListener('click', () => {
        const stampUrl = btn.dataset.sampleStamp;
        if (inputStampCustomUrl) inputStampCustomUrl.value = stampUrl;
        applyCustomStamp(stampUrl);
      });
    });

    const btnClearStampImg = container.querySelector('#btn-clear-stamp-img');
    if (btnClearStampImg) {
      btnClearStampImg.addEventListener('click', () => {
        currentBranding.stamp_custom_image = null;
        currentBranding.stamp_icon = 'star';
        if (inputStampCustomUrl) inputStampCustomUrl.value = '';
        if (boxStampPreview) {
          boxStampPreview.innerHTML = `
            <span class="text-2xl text-zinc-600 font-bold">\u2605</span>
            <span class="text-[9px] text-zinc-500 font-bold mt-1">Sin .PNG</span>
          `;
        }
        if (badgeStampMode) {
          badgeStampMode.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-sky-500/10 text-sky-400 border-sky-500/30';
          badgeStampMode.textContent = 'Icono Vectorial';
        }
        updatePreview();
        toast.success('Vuelto a icono vectorial');
      });
    }

    container.querySelectorAll('.btn-select-icon').forEach(btn => {
      btn.addEventListener('click', () => {
        currentBranding.stamp_custom_image = null;
        currentBranding.stamp_icon = btn.dataset.icon;
        if (inputStampCustomUrl) inputStampCustomUrl.value = '';
        if (boxStampPreview) {
          boxStampPreview.innerHTML = `
            <span class="text-2xl text-zinc-600 font-bold">\u2605</span>
            <span class="text-[9px] text-zinc-500 font-bold mt-1">Icono: ${btn.textContent.trim()}</span>
          `;
        }
        if (badgeStampMode) {
          badgeStampMode.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-sky-500/10 text-sky-400 border-sky-500/30';
          badgeStampMode.textContent = `Icono: ${btn.textContent.trim()}`;
        }
        container.querySelectorAll('.btn-select-icon').forEach(b => {
          b.className = 'btn-select-icon p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white';
        });
        btn.className = 'btn-select-icon p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition bg-sky-500/20 border-sky-500 text-sky-400 shadow-md';
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
    const charCountCardName = container.querySelector('#char-count-card-name');
    if (inputCardTitleName && charCountCardName) {
      inputCardTitleName.addEventListener('input', () => {
        const len = inputCardTitleName.value.length;
        charCountCardName.textContent = `${len} / 25 car.`;
        if (len > 25) {
          charCountCardName.className = 'text-[10px] font-mono text-amber-400 font-bold';
        } else {
          charCountCardName.className = 'text-[10px] font-mono text-zinc-400 font-bold';
        }
      });
    }

    const charCountRewardName = container.querySelector('#char-count-reward-name');
    const rewardInput = container.querySelector('#input-reward-name');
    if (rewardInput) {
      rewardInput.addEventListener('input', (e) => {
        rewardName = e.target.value || 'Recompensa';
        if (charCountRewardName) {
          const len = rewardName.length;
          charCountRewardName.textContent = `${len} / 30 car.`;
          if (len > 30) {
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

    function applyBgBanner(imageUrl) {
      currentBranding.bg_image_url = imageUrl || null;
      renderForm();
      updatePreview();
      if (imageUrl) {
        toast.success('\u00A1Banner horizontal 3:1 aplicado a la tarjeta!');
      } else {
        toast.success('Franja autom\u00E1tica del servidor restaurada.');
      }
    }

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
          handleImageFile(files[0], (dataUrl) => {
            applyBgBanner(dataUrl);
          });
        }
      };

      fileCardBgUpload.onchange = (e) => {
        const files = e.target.files || fileCardBgUpload.files;
        if (files && files.length > 0) {
          handleImageFile(files[0], (dataUrl) => {
            applyBgBanner(dataUrl);
          });
        }
      };
    }

    if (inputBgBannerUrl) {
      inputBgBannerUrl.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          currentBranding.bg_image_url = val;
          updatePreview();
        }
      });
    }

    if (btnClearBgBanner) {
      btnClearBgBanner.addEventListener('click', () => {
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

    // --- COLOR INPUTS (SOLID BACKGROUND & ACCENTS) ---
    const primaryInput = container.querySelector('#input-primary-color');
    const primaryText = container.querySelector('#text-primary-color');
    const bgFromInput = container.querySelector('#input-bg-from');
    const bgFromText = container.querySelector('#text-bg-from');

    if (primaryInput && primaryText) {
      primaryInput.addEventListener('input', (e) => {
        currentBranding.primary_color = e.target.value;
        primaryText.value = e.target.value;
        updatePreview();
      });
      primaryText.addEventListener('input', (e) => {
        currentBranding.primary_color = e.target.value;
        primaryInput.value = e.target.value;
        updatePreview();
      });
    }

    if (bgFromInput && bgFromText) {
      bgFromInput.addEventListener('input', (e) => {
        currentBranding.bg_gradient_from = e.target.value;
        currentBranding.bg_gradient_to = e.target.value;
        bgFromText.value = e.target.value;
        updatePreview();
      });
      bgFromText.addEventListener('input', (e) => {
        currentBranding.bg_gradient_from = e.target.value;
        currentBranding.bg_gradient_to = e.target.value;
        bgFromInput.value = e.target.value;
        updatePreview();
      });
    }

    // Preset solid themes tailored for Apple & Google Wallet
    container.querySelectorAll('.btn-theme-preset').forEach(btn => {
      btn.addEventListener('click', () => {
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
        if (bgFromInput) bgFromInput.value = currentBranding.bg_gradient_from;
        if (bgFromText) bgFromText.value = currentBranding.bg_gradient_from;
        updatePreview();
      });
    });

    // --- SAVE BUTTON ---
    const btnSave = container.querySelector('#btn-save-branding');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        businessService.update(business.id, { logo_url: currentLogoUrl }, session);
        
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
          branding: currentBranding
        };

        if (activeProgram?.id) {
          loyaltyService.updateProgram(business.id, activeProgram.id, updates, session);
        }

        if (activeProgram.active) {
          businessService.updateBranding(business.id, currentBranding, session);
        }

        allPrograms = loyaltyService.getAllPrograms(business.id) || [];
        activeProgram = allPrograms.find(p => p.id === activeProgram.id) || activeProgram;

        toast.fireConfetti();
        toast.success(`\u00A1Tarjeta "${cardName}" guardada correctamente!`);
      });
    }
  }

  renderForm();
  return container;
}

