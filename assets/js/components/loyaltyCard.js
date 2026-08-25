/**
 * VYNTA LOYALTY - Digital Loyalty Card Component & Pass Renderers
 */

export function getStampIconSVG(iconName, isActive, primaryColor = '#0EA5E9', customImageUrl = null) {
  const activeColor = primaryColor;
  const inactiveColor = '#3F3F46';
  const color = isActive ? activeColor : inactiveColor;

  if (customImageUrl || iconName === 'custom_image') {
    const imgSrc = customImageUrl || '';
    if (imgSrc) {
      return `
        <div class="w-8 h-8 flex items-center justify-center relative">
          <img src="${imgSrc}" alt="sello" class="max-w-full max-h-full object-contain rounded transition-all duration-300 ${
            isActive ? 'stamp-active-anim filter drop-shadow scale-110' : 'opacity-25 grayscale'
          }" style="${isActive ? `filter: drop-shadow(0 0 8px ${primaryColor});` : ''}" />
        </div>
      `;
    }
  }

  switch (iconName) {
    case 'coffee':
      return `
        <svg class="w-6 h-6 transition-all duration-300 ${isActive ? 'stamp-active-anim' : 'opacity-40'}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
          <line x1="6" y1="2" x2="6" y2="4"></line>
          <line x1="10" y1="2" x2="10" y2="4"></line>
          <line x1="14" y1="2" x2="14" y2="4"></line>
        </svg>`;
    case 'scissors':
      return `
        <svg class="w-6 h-6 transition-all duration-300 ${isActive ? 'stamp-active-anim' : 'opacity-40'}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="6" r="3"></circle>
          <circle cx="6" cy="18" r="3"></circle>
          <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
          <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
          <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
        </svg>`;
    case 'flame':
      return `
        <svg class="w-6 h-6 transition-all duration-300 ${isActive ? 'stamp-active-anim' : 'opacity-40'}" viewBox="0 0 24 24" fill="${isActive ? color : 'none'}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
        </svg>`;
    case 'shisha':
      return `
        <svg class="w-6 h-6 transition-all duration-300 ${isActive ? 'stamp-active-anim' : 'opacity-40'}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v4m-3 0h6m-3 0v4m-4 5a4 4 0 0 0 8 0V10H9v5zm3 5v2m-5 0h10"/>
          <circle cx="12" cy="15" r="1.5" fill="${color}"/>
        </svg>`;
    case 'heart':
      return `
        <svg class="w-6 h-6 transition-all duration-300 ${isActive ? 'stamp-active-anim' : 'opacity-40'}" viewBox="0 0 24 24" fill="${isActive ? color : 'none'}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
        </svg>`;
    case 'burger':
      return `
        <svg class="w-6 h-6 transition-all duration-300 ${isActive ? 'stamp-active-anim' : 'opacity-40'}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 11a8 8 0 0 1 16 0H4Z"></path>
          <path d="M4 18h16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path>
          <line x1="3" y1="14" x2="21" y2="14"></line>
        </svg>`;
    case 'drink':
      return `
        <svg class="w-6 h-6 transition-all duration-300 ${isActive ? 'stamp-active-anim' : 'opacity-40'}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 11h1a3 3 0 0 1 0 6h-1"></path>
          <path d="M9 12v6"></path>
          <path d="M13 12v6"></path>
          <path d="M5 8h12v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z"></path>
          <path d="M5 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2"></path>
        </svg>`;
    case 'diamond':
      return `
        <svg class="w-6 h-6 transition-all duration-300 ${isActive ? 'stamp-active-anim' : 'opacity-40'}" viewBox="0 0 24 24" fill="${isActive ? color : 'none'}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 3h12l4 6-10 12L2 9z"></path>
          <path d="M11 3 8 9l4 12 4-12-3-6"></path>
          <path d="M2 9h20"></path>
        </svg>`;
    case 'gift':
      return `
        <svg class="w-6 h-6 transition-all duration-300 ${isActive ? 'stamp-active-anim' : 'opacity-40'}" viewBox="0 0 24 24" fill="${isActive ? color : 'none'}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 12 20 22 4 22 4 12"></polyline>
          <rect x="2" y="7" width="20" height="5"></rect>
          <line x1="12" y1="22" x2="12" y2="7"></line>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
        </svg>`;
    case 'star':
    default:
      return `
        <svg class="w-6 h-6 transition-all duration-300 ${isActive ? 'stamp-active-anim' : 'opacity-40'}" viewBox="0 0 24 24" fill="${isActive ? color : 'none'}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>`;
  }
}

export function renderLoyaltyCardHTML({
  business,
  customer,
  card,
  program,
  showQr = true,
  interactive = false,
  containerId = 'qr-container'
}) {
  const branding = (program?.branding || business?.branding) || {
    primary_color: '#0EA5E9',
    secondary_color: '#0369A1',
    bg_gradient_from: '#0F172A',
    bg_gradient_to: '#020617',
    bg_image_url: null,
    overlay_opacity: 0.75,
    stamp_icon: 'star',
    stamp_custom_image: null,
    border_radius: '24px',
    card_style: 'glass'
  };

  const cardType = program?.card_type || 'points';
  const rewardName = program?.reward_name || 'Recompensa Exclusiva';
  const custName = customer ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Cliente VIP';
  const cardNumber = card?.card_number || 'VN-00001';

  const overlayAlpha = branding.overlay_opacity !== undefined ? branding.overlay_opacity : 0.75;
  const bgStyle = branding.bg_image_url 
    ? `background: linear-gradient(rgba(0,0,0,${overlayAlpha}), rgba(0,0,0,${Math.min(0.95, overlayAlpha + 0.15)})), url('${branding.bg_image_url}') center/cover no-repeat; backdrop-filter: blur(8px);`
    : `background: linear-gradient(145deg, ${branding.bg_gradient_from || '#0F172A'} 0%, ${branding.bg_gradient_to || '#020617'} 100%);`;

  let typeSubtitle = 'Tarjeta Cliente \u2022 Puntos';
  let bodyContentHtml = '';

  if (cardType === 'points') {
    typeSubtitle = 'Tarjeta Cliente \u2022 Puntos';
    const maxPoints = Number(program?.points_required || (program?.stamps_required ? program.stamps_required * 10 : 100));
    const currentPoints = Number(card?.points_count !== undefined ? card.points_count : (card?.stamps_count || 0) * 10);
    const isCompleted = currentPoints >= maxPoints;
    const progressPct = Math.min(100, Math.round((currentPoints / maxPoints) * 100));

    bodyContentHtml = `
      <!-- Points Display Header -->
      <div class="mb-5 p-4 rounded-3xl bg-white/10 border border-white/20 text-center space-y-1.5 backdrop-blur-md shadow-xl">
        <span class="text-[10px] font-extrabold uppercase tracking-widest text-sky-300 block">Tus Puntos Acumulados</span>
        <div class="text-4xl font-black tracking-tight text-white font-mono" style="color: ${branding.primary_color}">
          ${currentPoints} <span class="text-base font-bold text-sky-200">PTS</span>
        </div>
        <p class="text-xs font-bold text-white flex items-center justify-center gap-1.5">
          <span>\uD83C\uDF81</span> Meta: <strong class="text-amber-300">${maxPoints} pts</strong> &rarr; ${rewardName}
        </p>
      </div>

      <!-- Progress Bar -->
      <div class="space-y-1.5 mb-4">
        <div class="flex justify-between items-center text-[10px] font-bold text-zinc-300">
          <span>Progreso de Puntos</span>
          <span class="font-mono text-sky-400">${currentPoints} / ${maxPoints} pts (${progressPct}%)</span>
        </div>
        <div class="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500" style="
            width: ${progressPct}%;
            background: linear-gradient(90deg, ${branding.primary_color}, ${branding.secondary_color || branding.primary_color});
            box-shadow: 0 0 10px ${branding.primary_color};
          "></div>
        </div>
      </div>
    `;
  } else if (cardType === 'stamps') {
    typeSubtitle = 'Tarjeta Loyalty \u2022 Sellos';
    const totalStamps = Number(program?.stamps_required) || 10;
    const currentStamps = Number(card?.stamps_count) || 0;
    const remainingStamps = Math.max(0, totalStamps - currentStamps);
    const isCompleted = currentStamps >= totalStamps;

    let stampsGridHtml = '';
    for (let i = 1; i <= totalStamps; i++) {
      const isActive = i <= currentStamps;
      stampsGridHtml += `
        <div class="aspect-square rounded-2xl flex flex-col items-center justify-between p-2 transition-all duration-300 relative ${
          isActive 
            ? 'bg-white/10 border border-white/25 shadow-lg backdrop-blur-sm' 
            : 'bg-black/30 border border-white/5 opacity-50 backdrop-blur-sm'
        }" style="${isActive ? `box-shadow: 0 0 15px ${branding.primary_color}44; border-color: ${branding.primary_color}99;` : ''}">
          <span class="text-[10px] font-bold self-start leading-none" style="color: ${isActive ? branding.primary_color : '#71717A'}">${i}</span>
          <div class="my-auto flex items-center justify-center">
            ${getStampIconSVG(branding.stamp_icon, isActive, branding.primary_color, branding.stamp_custom_image)}
          </div>
          ${isActive ? `
            <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${branding.primary_color}"></span>
          ` : `<div class="h-1.5"></div>`}
        </div>
      `;
    }

    bodyContentHtml = `
      <div class="mb-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 relative z-10 backdrop-blur-md">
        <span class="text-xl">\u2605</span>
        <div class="flex-1 min-w-0">
          <p class="text-[10px] uppercase font-bold text-zinc-400 leading-none mb-1">Recompensa al completar:</p>
          <p class="text-xs font-extrabold text-white truncate" style="color: ${branding.primary_color}">${rewardName}</p>
        </div>
        ${isCompleted ? `
          <span class="px-2 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500 text-black animate-pulse shadow-md">\u00A1LISTA!</span>
        ` : `
          <span class="text-[11px] font-bold text-zinc-300">${remainingStamps} restantes</span>
        `}
      </div>

      <div class="grid grid-cols-5 gap-2.5 w-full mb-4 relative z-10">
        ${stampsGridHtml}
      </div>
    `;
  } else if (cardType === 'single_use_promo') {
    typeSubtitle = 'Tarjeta Promo \u2022 1 Solo Uso';
    bodyContentHtml = `
      <div class="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
        <span class="text-[9px] font-black uppercase tracking-widest text-amber-400 block">\u2728 PASE PROMOCIONAL DE 1 SOLO USO</span>
        <h3 class="text-base font-black text-white">${program?.promo_benefit || 'Consumici\u00F3n de Bienvenida'}</h3>
        <p class="text-[10px] text-zinc-400">V\u00E1lido hasta: <strong class="text-white">${program?.valid_until || '30 d\u00EDas'}</strong></p>
      </div>
    `;
  } else if (cardType === 'coupon_discount') {
    typeSubtitle = 'Tarjeta Cup\u00F3n \u2022 Descuento';
    const discType = program?.discount_type || 'percentage';
    const discVal = program?.discount_value !== undefined ? program.discount_value : 20;
    const displayDiscount = discType === 'percentage' ? `${discVal}% DTO` : `${discVal}\u20AC OFF`;

    bodyContentHtml = `
      <div class="mb-4 p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-center space-y-1">
        <span class="text-3xl font-black text-white" style="color: ${branding.primary_color}">${displayDiscount}</span>
        <p class="text-xs font-bold text-white">${program?.name || 'Cup\u00F3n de Descuento'}</p>
        <div class="inline-block px-3 py-1 rounded-xl bg-black/60 border border-white/20 font-mono text-xs font-bold text-amber-300 mt-1">
          ${program?.coupon_code || 'VYNTA-PROMO'}
        </div>
      </div>
    `;
  }

  return `
    <div class="loyalty-card-wrapper w-full max-w-sm mx-auto select-none transition-all duration-300">
      <div class="loyalty-card-body w-full shadow-2xl p-6 border flex flex-col relative overflow-hidden" style="
        ${bgStyle}
        border-radius: ${branding.border_radius || '24px'};
        border-color: ${branding.primary_color ? `${branding.primary_color}33` : 'rgba(255, 255, 255, 0.1)'};
        box-shadow: 0 20px 45px -10px rgba(0,0,0,0.8), 0 0 25px -5px ${branding.primary_color}22;
        color: ${branding.text_color || '#FFFFFF'};
      ">
        <div class="flex items-center justify-between mb-5 relative z-10">
          <div class="flex items-center gap-3">
            <img src="${business?.logo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=128&auto=format&fit=crop&q=80'}" alt="${business?.name}" class="w-11 h-11 rounded-2xl object-cover border border-white/20 shadow-md bg-zinc-900 shrink-0">
            <div class="min-w-0">
              <h3 class="text-lg font-bold tracking-wide leading-tight truncate text-white">${business?.name || 'VYNTA Business'}</h3>
              <p class="text-[10px] font-bold uppercase tracking-widest" style="color: ${branding.primary_color}">
                ${typeSubtitle}
              </p>
            </div>
          </div>
          <span class="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-white/10 text-white/90 border border-white/10 shrink-0">
            ${cardNumber}
          </span>
        </div>

        ${bodyContentHtml}

        <div class="w-full flex justify-between items-end border-t border-white/10 pt-3 mb-4 relative z-10">
          <div>
            <span class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Titular del Pase</span>
            <span class="text-base font-bold text-white tracking-wide">${custName}</span>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Estado</span>
            <span class="text-xs font-bold text-emerald-400">\u2714 Pase Activo</span>
          </div>
        </div>

        ${showQr ? `
          <div class="flex flex-col items-center justify-center mb-3 relative z-10">
            <div class="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center justify-center">
              <div id="${containerId}" class="flex items-center justify-center min-w-[130px] min-h-[130px]"></div>
              <p class="text-[9px] font-mono text-zinc-800 font-bold tracking-wider mt-1.5 uppercase">${card?.secure_token || 'TOKEN-VYNTA'}</p>
            </div>
            <p class="text-[10px] text-zinc-400 mt-2 font-medium">Muestra este c\u00F3digo al pagar para acumular</p>
          </div>
        ` : ''}

        <div class="flex items-center justify-between text-[10px] text-zinc-500 tracking-wider uppercase font-medium relative z-10">
          <span>${business?.name}</span>
          <span class="flex items-center gap-1">Powered by <strong class="text-zinc-300">VYNTA</strong></span>
        </div>
      </div>
    </div>
  `;
}

export function renderAppleWalletPassHTML({
  business,
  customer,
  card,
  program,
  containerId = 'apple-qr-preview'
}) {
  const branding = (program?.branding || business?.branding) || {};
  const primaryColor = branding.primary_color || '#0EA5E9';
  const cardType = program?.card_type || 'points';
  const rewardName = program?.reward_name || 'Regalo Exclusivo';
  const custName = customer ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Mar\u00EDa Garc\u00EDa';
  const cardNumber = card?.card_number || 'DEMO-0001';

  const solidBg = branding.bg_gradient_from || '#0F172A';
  const bgStyle = `background: ${solidBg};`;

  let typeSubtitle = 'Tarjeta Cliente \u2022 Puntos';
  let heroContentHtml = '';

  if (cardType === 'points') {
    typeSubtitle = 'Tarjeta Cliente \u2022 Puntos';
    const maxPoints = Number(program?.points_required || (program?.stamps_required ? program.stamps_required * 10 : 100));
    const currentPoints = Number(card?.points_count !== undefined ? card.points_count : (card?.stamps_count || 4) * 10);
    const progressPct = Math.min(100, Math.round((currentPoints / maxPoints) * 100));

    heroContentHtml = `
      <div class="space-y-3">
        <div class="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-center space-y-1 backdrop-blur-sm">
          <span class="text-[9px] font-black uppercase tracking-widest text-sky-300 block">PUNTOS ACUMULADOS</span>
          <div class="text-3xl font-black text-white font-mono" style="color: ${primaryColor}">
            ${currentPoints} <span class="text-sm font-bold text-sky-200">PTS</span>
          </div>
          <p class="text-[11px] font-bold text-zinc-300">
            Meta: <strong class="text-amber-300">${maxPoints} pts</strong> &rarr; ${rewardName}
          </p>
        </div>

        <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div class="h-full rounded-full transition-all" style="width: ${progressPct}%; background: ${primaryColor};"></div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[10px] bg-black/20 p-2.5 rounded-xl border border-white/10">
          <div>
            <span class="text-[8px] uppercase tracking-widest text-zinc-400 block font-bold">TITULAR</span>
            <span class="font-bold text-white truncate block">${custName}</span>
          </div>
          <div class="text-right">
            <span class="text-[8px] uppercase tracking-widest text-zinc-400 block font-bold">PROGRESO</span>
            <span class="font-bold" style="color: ${primaryColor}">${currentPoints} / ${maxPoints} pts</span>
          </div>
        </div>
      </div>
    `;
  } else if (cardType === 'stamps') {
    typeSubtitle = 'Tarjeta Loyalty \u2022 Sellos';
    const totalStamps = Number(program?.stamps_required) || 10;
    const currentStamps = Number(card?.stamps_count) || 4;

    let stampsDots = '';
    for (let i = 1; i <= totalStamps; i++) {
      const isActive = i <= currentStamps;
      stampsDots += `
        <div class="flex flex-col items-center justify-between p-2 rounded-xl transition-all ${
          isActive ? 'bg-white/15 border border-white/30 shadow-lg' : 'bg-black/30 border border-white/5 opacity-40'
        }" style="${isActive ? `box-shadow: 0 0 12px ${primaryColor}55; border-color: ${primaryColor}99;` : ''}">
          <span class="text-[9px] font-bold self-start leading-none" style="color: ${isActive ? primaryColor : '#9CA3AF'}">${i}</span>
          <div class="my-auto flex items-center justify-center">
            ${getStampIconSVG(branding.stamp_icon, isActive, primaryColor, branding.stamp_custom_image)}
          </div>
          ${isActive ? `
            <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${primaryColor}"></span>
          ` : `<div class="h-1.5"></div>`}
        </div>
      `;
    }

    heroContentHtml = `
      <div class="space-y-3">
        <div class="grid grid-cols-5 gap-1.5">
          ${stampsDots}
        </div>
        <div class="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/10 text-left bg-black/20 p-2.5 rounded-xl">
          <div>
            <span class="text-[8px] uppercase tracking-widest text-zinc-400 block font-bold">TITULAR</span>
            <span class="text-xs font-bold text-white truncate block">${custName}</span>
          </div>
          <div>
            <span class="text-[8px] uppercase tracking-widest text-zinc-400 block font-bold">PROGRESO</span>
            <span class="text-xs font-extrabold" style="color: ${primaryColor}">${currentStamps} / ${totalStamps}</span>
          </div>
          <div class="text-right">
            <span class="text-[8px] uppercase tracking-widest text-zinc-400 block font-bold">ESTADO</span>
            <span class="text-xs font-bold ${currentStamps >= totalStamps ? 'text-emerald-400' : 'text-zinc-300'}">
              ${currentStamps >= totalStamps ? '\u00A1Completada!' : 'En curso'}
            </span>
          </div>
        </div>
      </div>
    `;
  } else if (cardType === 'single_use_promo') {
    typeSubtitle = 'Tarjeta Promo \u2022 1 Solo Uso';
    const promoBenefit = program?.promo_benefit || 'Consumici\u00F3n de Bienvenida Gratis';
    const validUntil = program?.valid_until || 'Pr\u00F3ximos 30 d\u00EDas';
    heroContentHtml = `
      <div class="space-y-3">
        <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
          <span class="text-[9px] font-black uppercase tracking-widest text-amber-400 block">\u2728 PASE PROMOCIONAL EXCLUSIVO</span>
          <h3 class="text-sm font-black text-white">${promoBenefit}</h3>
          <p class="text-[10px] text-zinc-400 font-medium">V\u00E1lido hasta: <strong class="text-white">${validUntil}</strong></p>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[10px] bg-black/20 p-2.5 rounded-xl border border-white/10">
          <div>
            <span class="text-[8px] uppercase tracking-widest text-zinc-400 block font-bold">CONDICI\u00D3N</span>
            <span class="font-bold text-amber-300">1 Solo Canje</span>
          </div>
          <div class="text-right">
            <span class="text-[8px] uppercase tracking-widest text-zinc-400 block font-bold">ESTADO</span>
            <span class="font-bold text-emerald-400">\u2714 Listo para canjear</span>
          </div>
        </div>
      </div>
    `;
  } else if (cardType === 'coupon_discount') {
    typeSubtitle = 'Tarjeta Cup\u00F3n \u2022 Descuento';
    const discType = program?.discount_type || 'percentage';
    const discVal = program?.discount_value !== undefined ? program.discount_value : 20;
    const cpnCode = program?.coupon_code || 'VYNTA-PROMO';
    const minSpend = program?.min_spend || 'Sin consumo m\u00EDnimo';
    const displayDiscount = discType === 'percentage' ? `${discVal}% DTO` : `${discVal}\u20AC OFF`;

    heroContentHtml = `
      <div class="space-y-3">
        <div class="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 text-center space-y-1.5 shadow-lg">
          <span class="text-2xl font-black text-white tracking-tight" style="color: ${primaryColor}">${displayDiscount}</span>
          <p class="text-xs font-bold text-white">${program?.name || 'Cup\u00F3n de Descuento'}</p>
          <div class="inline-block px-3 py-1 rounded-xl bg-black/60 border border-white/20 font-mono text-xs font-bold text-amber-300 tracking-wider">
            ${cpnCode}
          </div>
        </div>
        <div class="flex justify-between items-center text-[10px] bg-black/20 p-2.5 rounded-xl border border-white/10">
          <span class="text-zinc-400 font-medium">${minSpend}</span>
          <span class="text-emerald-400 font-bold">\u2714 Escanear en caja</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="apple-wallet-pass-wrapper w-full max-w-[340px] mx-auto select-none font-sans text-white">
      <div class="shadow-2xl overflow-hidden border relative" style="
        ${bgStyle}
        border-radius: ${branding.border_radius || '26px'};
        border-color: ${primaryColor ? `${primaryColor}44` : 'rgba(255, 255, 255, 0.15)'};
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.9), 0 0 25px -5px ${primaryColor}22;
      ">
        <!-- Pass Header -->
        <div class="p-4 pb-2.5 flex items-center justify-between border-b border-white/10" style="background: rgba(0,0,0,0.3);">
          <div class="flex items-center gap-2.5 min-w-0">
            <img src="${business?.logo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=128&auto=format&fit=crop&q=80'}" alt="logo" class="w-9 h-9 rounded-xl object-cover border border-white/20 bg-zinc-900 shrink-0">
            <div class="min-w-0">
              <span class="text-xs font-bold uppercase tracking-wider block text-white leading-tight truncate">${business?.name || 'Local 1'}</span>
              <span class="text-[9px] font-bold uppercase block truncate" style="color: ${primaryColor}">${typeSubtitle}</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="text-[8px] uppercase tracking-widest text-zinc-400 block font-bold">RECOMPENSA</span>
            <span class="text-xs font-black text-white" style="color: ${primaryColor}">${rewardName}</span>
          </div>
        </div>

        <!-- Pass Strip / Visual Hero -->
        <div class="p-4 space-y-3 relative">
          ${heroContentHtml}
        </div>

        <!-- Apple Wallet Barcode Section -->
        <div class="p-4 pt-2 text-center flex flex-col items-center justify-center relative">
          <div class="bg-white p-3 rounded-2xl shadow-2xl flex flex-col items-center justify-center">
            <div id="${containerId}" class="flex items-center justify-center min-w-[130px] min-h-[130px]"></div>
            <span class="font-mono text-[10px] font-bold text-zinc-800 tracking-wider mt-1.5 block">${card?.secure_token || cardNumber}</span>
          </div>
        </div>

        <!-- Apple Wallet Footer Banner -->
        <div class="bg-black/80 p-2.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-zinc-400 border-t border-white/10">
          <svg class="w-4 h-4 fill-white" viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12.01-14.42-6.53-9.99-11.66-21.75-15.4-35.29-3.74-13.54-5.61-26.11-5.61-37.71 0-14.89 3.84-26.69 11.53-35.39 7.69-8.71 17.15-13.18 28.38-13.41 4.79 0 10.36 1.34 16.71 4.01 6.35 2.68 10.15 4.07 11.4 4.17 1.48-.22 5.56-1.68 12.24-4.38 6.68-2.7 12.07-3.9 16.17-3.6 12.01.67 21.6 5.08 28.76 13.23-10.49 6.35-15.63 15.11-15.4 26.27.22 8.71 3.51 16.03 9.87 21.96 6.36 5.93 13.97 9.27 22.84 10.02-2.23 6.98-4.91 14.15-8.04 21.52zM119.22 31.84c0-7.36 2.68-14.31 8.04-20.85 5.36-6.54 11.83-10.53 19.41-11.99.22 1.34.33 2.57.33 3.69 0 7.36-2.8 14.47-8.41 21.32-5.61 6.85-12.28 10.82-20.02 11.9-.22-1.34-.35-2.7-.35-4.07z"/>
          </svg>
          <span>Visualizaci\u00F3n en <strong>Apple Wallet (iOS)</strong></span>
        </div>
      </div>
    </div>
  `;
}

export function renderGoogleWalletPassHTML({
  business,
  customer,
  card,
  program,
  containerId = 'google-qr-preview'
}) {
  const branding = (program?.branding || business?.branding) || {};
  const primaryColor = branding.primary_color || '#0EA5E9';
  const cardType = program?.card_type || 'points';
  const rewardName = program?.reward_name || 'Regalo Exclusivo';
  const custName = customer ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Mar\u00EDa Garc\u00EDa';
  const cardNumber = card?.card_number || 'DEMO-0001';

  const solidBg = branding.bg_gradient_from || '#0F172A';
  const bgStyle = `background: ${solidBg};`;

  let typeSubtitle = 'Tarjeta Cliente \u2022 Puntos';
  let googleHeroHtml = '';

  if (cardType === 'points') {
    typeSubtitle = 'Tarjeta Cliente \u2022 Puntos';
    const maxPoints = Number(program?.points_required || (program?.stamps_required ? program.stamps_required * 10 : 100));
    const currentPoints = Number(card?.points_count !== undefined ? card.points_count : (card?.stamps_count || 4) * 10);
    const progressPct = Math.min(100, Math.round((currentPoints / maxPoints) * 100));

    googleHeroHtml = `
      <div class="space-y-3 bg-black/30 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
        <div class="flex justify-between items-center text-xs">
          <span class="font-bold text-zinc-300">Puntos Acumulados</span>
          <span class="font-mono font-extrabold text-lg" style="color: ${primaryColor}">${currentPoints} <span class="text-xs">PTS</span></span>
        </div>

        <div class="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500" style="
            width: ${progressPct}%;
            background: linear-gradient(90deg, ${primaryColor}, ${branding.secondary_color || primaryColor});
            box-shadow: 0 0 10px ${primaryColor};
          "></div>
        </div>

        <div class="flex justify-between items-center text-[10px] text-zinc-400">
          <span>Meta: <strong class="text-amber-300">${maxPoints} pts</strong></span>
          <span class="text-emerald-400 font-bold">\u2714 ${progressPct}% Completado</span>
        </div>
      </div>
    `;
  } else if (cardType === 'stamps') {
    typeSubtitle = 'Tarjeta Loyalty • Sellos';
    const totalStamps = Number(program?.stamps_required) || 10;
    const currentStamps = Number(card?.stamps_count) || 4;

    let googleStamps = '';
    for (let i = 1; i <= totalStamps; i++) {
      const isActive = i <= currentStamps;
      googleStamps += `
        <div class="flex flex-col items-center justify-between p-2 rounded-xl transition-all ${
          isActive ? 'bg-white/15 border border-white/30 shadow-lg' : 'bg-black/30 border border-white/5 opacity-40'
        }" style="${isActive ? `box-shadow: 0 0 12px ${primaryColor}55; border-color: ${primaryColor}99;` : ''}">
          <span class="text-[9px] font-bold self-start leading-none" style="color: ${isActive ? primaryColor : '#9CA3AF'}">${i}</span>
          <div class="my-auto flex items-center justify-center">
            ${getStampIconSVG(branding.stamp_icon, isActive, primaryColor, branding.stamp_custom_image)}
          </div>
          ${isActive ? `
            <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${primaryColor}"></span>
          ` : `<div class="h-1.5"></div>`}
        </div>
      `;
    }

    googleHeroHtml = `
      <div class="space-y-3">
        <div class="grid grid-cols-5 gap-1.5">
          ${googleStamps}
        </div>
        <div class="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/10 text-left bg-black/20 p-2.5 rounded-xl">
          <div>
            <span class="text-[8px] uppercase tracking-widest text-zinc-400 block font-bold">TITULAR</span>
            <span class="text-xs font-bold text-white truncate block">${custName}</span>
          </div>
          <div>
            <span class="text-[8px] uppercase tracking-widest text-zinc-400 block font-bold">PROGRESO</span>
            <span class="text-xs font-extrabold" style="color: ${primaryColor}">${currentStamps} / ${totalStamps}</span>
          </div>
          <div class="text-right">
            <span class="text-[8px] uppercase tracking-widest text-zinc-400 block font-bold">ESTADO</span>
            <span class="text-xs font-bold ${currentStamps >= totalStamps ? 'text-emerald-400' : 'text-zinc-300'}">
              ${currentStamps >= totalStamps ? '¡Completada!' : 'En curso'}
            </span>
          </div>
        </div>
      </div>
    `;
  } else if (cardType === 'single_use_promo') {
    typeSubtitle = 'Tarjeta Promo \u2022 1 Solo Uso';
    const promoBenefit = program?.promo_benefit || 'Consumici\u00F3n de Bienvenida Gratis';
    const validUntil = program?.valid_until || 'Pr\u00F3ximos 30 d\u00EDas';
    googleHeroHtml = `
      <div class="space-y-3">
        <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
          <span class="text-[9px] font-black uppercase tracking-widest text-amber-400 block">\u2728 PASE PROMOCIONAL EXCLUSIVO</span>
          <h3 class="text-base font-black text-white">${promoBenefit}</h3>
          <p class="text-xs text-zinc-400 font-medium">V\u00E1lido hasta: <strong class="text-white">${validUntil}</strong></p>
        </div>
      </div>
    `;
  } else if (cardType === 'coupon_discount') {
    typeSubtitle = 'Tarjeta Cup\u00F3n \u2022 Descuento';
    const discType = program?.discount_type || 'percentage';
    const discVal = program?.discount_value !== undefined ? program.discount_value : 20;
    const cpnCode = program?.coupon_code || 'VYNTA-PROMO';
    const minSpend = program?.min_spend || 'Sin consumo m\u00EDnimo';
    const displayDiscount = discType === 'percentage' ? `${discVal}% DTO` : `${discVal}\u20AC OFF`;

    googleHeroHtml = `
      <div class="space-y-3">
        <div class="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 text-center space-y-1.5 shadow-lg">
          <span class="text-2xl font-black text-white tracking-tight" style="color: ${primaryColor}">${displayDiscount}</span>
          <p class="text-xs font-bold text-white">${program?.name || 'Cup\u00F3n de Descuento'}</p>
          <div class="inline-block px-3 py-1 rounded-xl bg-black/60 border border-white/20 font-mono text-xs font-bold text-amber-300 tracking-wider">
            ${cpnCode}
          </div>
        </div>
        <p class="text-[10px] text-zinc-400 text-center">${minSpend}</p>
      </div>
    `;
  }

  return `
    <div class="google-wallet-pass-wrapper w-full max-w-[340px] mx-auto select-none font-sans text-white">
      <div class="shadow-2xl overflow-hidden border relative" style="
        ${bgStyle}
        border-radius: ${branding.border_radius || '26px'};
        border-color: ${primaryColor ? `${primaryColor}44` : 'rgba(255, 255, 255, 0.15)'};
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.9), 0 0 25px -5px ${primaryColor}22;
      ">
        <!-- Google Header -->
        <div class="p-4 border-b border-white/10 flex items-center justify-between" style="background: rgba(0,0,0,0.3);">
          <div class="flex items-center gap-3 min-w-0">
            <img src="${business?.logo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=128&auto=format&fit=crop&q=80'}" alt="logo" class="w-9 h-9 rounded-xl object-cover border border-white/20 bg-zinc-900 shrink-0">
            <div class="min-w-0">
              <h4 class="text-sm font-bold text-white leading-tight truncate">${business?.name || 'Local 1'}</h4>
              <p class="text-[10px] font-bold uppercase truncate" style="color: ${primaryColor}">${typeSubtitle}</p>
            </div>
          </div>
          <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/10 shrink-0">
            ${cardNumber}
          </span>
        </div>

        <!-- Google Loyalty Hero Section -->
        <div class="p-5 space-y-4">
          <div class="space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-wider" style="color: ${primaryColor}">
              Recompensa
            </span>
            <h3 class="text-base font-extrabold text-white">${rewardName}</h3>
          </div>

          ${googleHeroHtml}

          <!-- Customer Info Fields -->
          <div class="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div class="bg-black/30 p-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <span class="text-[9px] uppercase font-bold text-zinc-400 block">Titular</span>
              <span class="font-bold text-white truncate block">${custName}</span>
            </div>
            <div class="bg-black/30 p-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <span class="text-[9px] uppercase font-bold text-zinc-400 block">Estado</span>
              <span class="font-bold text-emerald-400">\u2714 Activo</span>
            </div>
          </div>

          <!-- Barcode Section in Google Wallet -->
          <div class="p-3.5 flex flex-col items-center justify-center">
            <div class="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center justify-center">
              <div id="${containerId}" class="flex items-center justify-center min-w-[130px] min-h-[130px]"></div>
              <p class="text-[10px] font-mono font-bold text-zinc-800 mt-1.5">Escanear para acumular</p>
            </div>
          </div>
        </div>

        <!-- Google Wallet Footer -->
        <div class="bg-black/80 p-3 flex items-center justify-center gap-2 border-t border-white/10 text-[11px] font-medium text-zinc-400">
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Visualizaci\u00F3n en <strong>Google Wallet (Android)</strong></span>
        </div>
      </div>
    </div>
  `;
}

export function initQRCode(containerId, text, width = 140, height = 140) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return;
  container.innerHTML = '';
  
  try {
    if (typeof QRCode !== 'undefined') {
      new QRCode(container, {
        text: text,
        width: width,
        height: height,
        colorDark: "#000000",
        colorLight: "#FFFFFF",
        correctLevel: QRCode.CorrectLevel.M
      });
      return;
    }
  } catch (e) {
    console.warn('QRCode library issue, using image QR fallback:', e);
  }

  const encoded = encodeURIComponent(text);
  container.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${width}x${height}&data=${encoded}&color=000000&bgcolor=ffffff" class="w-full h-full object-contain rounded-lg" alt="QR Code" />`;
}
