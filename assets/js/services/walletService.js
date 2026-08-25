/**
 * VYNTA LOYALTY ? WalletWallet API Integration for Apple & Google Wallet
 */
import { db } from '../db/storage.js';

const WALLET_API_BASE = 'https://api.walletwallet.dev';
const WALLET_API_KEY = 'ww_live_cf11b9479aea5ae65e4eefe7a0e90e42';

export const walletService = {
  getApiKey() {
    return WALLET_API_KEY;
  },

  async generatePass({ business, customer, card, program }) {
    const branding = (program?.branding || business?.branding) || {};
    const cardType = program?.card_type || 'points';
    const rewardName = program?.reward_name || 'Recompensa Exclusiva';
    const custName = customer ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Cliente VIP';
    const cardNumber = card?.card_number || 'VN-00001';
    const qrUrl = `${window.location.origin}${window.location.pathname}#/c/${card?.secure_token}`;

    const primaryColor = branding.primary_color || '#0EA5E9';
    const bgColor = branding.bg_gradient_from || '#0F172A';
    const fgColor = branding.text_color || '#FFFFFF';

    const hexToRgb = (hex) => {
      if (!hex || typeof hex !== 'string') return 'rgb(14, 165, 233)';
      const clean = hex.replace('#', '');
      if (clean.length === 3) {
        const r = parseInt(clean[0] + clean[0], 16);
        const g = parseInt(clean[1] + clean[1], 16);
        const b = parseInt(clean[2] + clean[2], 16);
        return `rgb(${r}, ${g}, ${b})`;
      }
      if (clean.length === 6) {
        const r = parseInt(clean.substring(0, 2), 16);
        const g = parseInt(clean.substring(2, 4), 16);
        const b = parseInt(clean.substring(4, 6), 16);
        return `rgb(${r}, ${g}, ${b})`;
      }
      return 'rgb(14, 165, 233)';
    };

    let primaryFields = [];
    let secondaryFields = [];
    let headerFields = [{ label: 'TARJETA', value: cardNumber }];
    let auxiliaryFields = [];
    let textModulesData = [];
    let backFields = [];

    const termsText = program?.terms || 'Válido presentando este pase o código QR en el establecimiento al momento del pago.';
    const contactInfo = [business?.phone, business?.email, business?.address].filter(Boolean).join(' • ') || business?.name || 'VYNTA Loyalty';

    if (cardType === 'points') {
      const maxPoints = Number(program?.points_required || (program?.stamps_required ? program.stamps_required * 10 : 100));
      const currentPoints = Number(card?.points_count !== undefined ? card.points_count : (card?.stamps_count || 4) * 10);
      const isReady = currentPoints >= maxPoints;

      const pct = Math.min(100, Math.round((currentPoints / maxPoints) * 100));
      const filledBlocks = Math.round(pct / 10);
      const emptyBlocks = Math.max(0, 10 - filledBlocks);
      const barVisual = '■'.repeat(filledBlocks) + '□'.repeat(emptyBlocks);

      primaryFields = [
        {
          label: 'PUNTOS ACUMULADOS',
          value: `${currentPoints} PTS  [${barVisual}] ${pct}%`,
          changeMessage: `¡Puntos actualizados! Tienes ${currentPoints} PTS`
        }
      ];
      secondaryFields = [
        { label: '🎁 RECOMPENSA', value: rewardName },
        { label: '👤 TITULAR', value: custName }
      ];
      auxiliaryFields = [
        { label: 'OBJETIVO', value: `${maxPoints} PTS` },
        { label: 'ESTADO', value: isReady ? '¡Premio Disponible!' : 'En progreso' }
      ];

      textModulesData = [
        { id: 'puntos', header: 'PUNTOS ACUMULADOS', body: `${currentPoints} de ${maxPoints} PTS (${pct}%)` },
        { id: 'premio', header: 'RECOMPENSA EXCLUSIVA', body: rewardName },
        { id: 'titular', header: 'TITULAR DEL PASE', body: custName },
        { id: 'condiciones', header: 'CONDICIONES DEL PROGRAMA', body: termsText }
      ];

      backFields = [
        { label: 'RECOMPENSA', value: rewardName },
        { label: 'PUNTOS PARA CANJEAR', value: `${maxPoints} PTS` },
        { label: 'CONDICIONES', value: termsText },
        { label: 'CONTACTO', value: contactInfo },
        { label: 'Nº DE TARJETA', value: cardNumber }
      ];
    } else if (cardType === 'stamps') {
      const totalStamps = Number(program?.stamps_required) || 10;
      const currentStamps = Number(card?.stamps_count) || 0;
      const remainingStamps = Math.max(0, totalStamps - currentStamps);
      const isCompleted = currentStamps >= totalStamps;

      primaryFields = [
        {
          label: 'SELLOS ACUMULADOS',
          value: `${currentStamps} / ${totalStamps}`,
          changeMessage: `¡Nuevo sello añadido! Llevas ${currentStamps} de ${totalStamps}`
        }
      ];
      secondaryFields = [
        { label: 'RECOMPENSA', value: rewardName },
        { label: 'TITULAR', value: custName }
      ];
      auxiliaryFields = [
        { label: 'PROGRESO', value: `${currentStamps} / ${totalStamps}` },
        { label: 'ESTADO', value: isCompleted ? '¡Completada!' : 'En curso' }
      ];

      textModulesData = [
        { id: 'sellos', header: 'SELLOS ACUMULADOS', body: `${currentStamps} de ${totalStamps} sellos completados` },
        { id: 'recompensa', header: 'TU RECOMPENSA', body: rewardName },
        { id: 'titular', header: 'TITULAR DEL PASE', body: custName },
        { id: 'condiciones', header: 'CONDICIONES', body: termsText }
      ];

      backFields = [
        { label: 'RECOMPENSA AL COMPLETAR', value: rewardName },
        { label: 'TOTAL SELLOS NECESARIOS', value: `${totalStamps} sellos` },
        { label: 'CONDICIONES', value: termsText },
        { label: 'LOCAL / COMERCIO', value: contactInfo },
        { label: 'Nº DE TARJETA', value: cardNumber }
      ];
    } else if (cardType === 'single_use_promo') {
      const promoBenefit = program?.promo_benefit || 'Consumición de Bienvenida Gratis';
      const validUntil = program?.valid_until || 'Próximos 30 días';

      primaryFields = [
        { label: 'PASE PROMOCIONAL', value: promoBenefit }
      ];
      secondaryFields = [
        { label: 'VÁLIDO HASTA', value: validUntil },
        { label: 'TITULAR', value: custName }
      ];
      auxiliaryFields = [
        { label: 'CONDICIÓN', value: '1 Solo Uso' }
      ];

      textModulesData = [
        { id: 'promo', header: 'BENEFICIO INCLUIDO', body: promoBenefit },
        { id: 'validez', header: 'FECHA LÍMITE', body: validUntil },
        { id: 'titular', header: 'TITULAR', body: custName },
        { id: 'condiciones', header: 'CONDICIONES', body: termsText }
      ];

      backFields = [
        { label: 'BENEFICIO', value: promoBenefit },
        { label: 'VIGENCIA', value: `Válido hasta ${validUntil}` },
        { label: 'CONDICIÓN', value: 'Válido para un único uso por cliente' },
        { label: 'COMERCIO', value: contactInfo }
      ];
    } else if (cardType === 'coupon_discount') {
      const discType = program?.discount_type || 'percentage';
      const discVal = program?.discount_value !== undefined ? program.discount_value : 20;
      const displayDiscount = discType === 'percentage' ? `${discVal}% DTO` : `${discVal}€ OFF`;
      const couponCode = program?.coupon_code || 'VYNTA-PROMO';
      const minSpend = program?.min_spend || 'Sin consumo mínimo';

      primaryFields = [
        { label: 'DESCUENTO', value: displayDiscount }
      ];
      secondaryFields = [
        { label: 'CÓDIGO CUPÓN', value: couponCode },
        { label: 'CONSUMO', value: minSpend }
      ];

      textModulesData = [
        { id: 'descuento', header: 'DESCUENTO APLICABLE', body: displayDiscount },
        { id: 'codigo', header: 'CÓDIGO DE CUPÓN', body: couponCode },
        { id: 'consumo', header: 'REQUISITO DE CONSUMO', body: minSpend },
        { id: 'condiciones', header: 'CONDICIONES', body: termsText }
      ];

      backFields = [
        { label: 'DESCUENTO', value: displayDiscount },
        { label: 'CÓDIGO', value: couponCode },
        { label: 'CONDICIONES', value: termsText },
        { label: 'ESTABLECIMIENTO', value: contactInfo }
      ];
    }

    // Correctly determine colorPreset based on card background
    const isDarkBg = !bgColor || bgColor.startsWith('#0') || bgColor.startsWith('#1') || bgColor.startsWith('#2') || bgColor === '#000000';
    let colorPreset = 'dark';
    if (!isDarkBg) {
      if (primaryColor.includes('F59E0B') || primaryColor.includes('D97706') || primaryColor.includes('B45309')) colorPreset = 'orange';
      else if (primaryColor.includes('10B981') || primaryColor.includes('059669') || primaryColor.includes('047857')) colorPreset = 'green';
      else if (primaryColor.includes('8B5CF6') || primaryColor.includes('7C3AED') || primaryColor.includes('6D28D9')) colorPreset = 'purple';
      else if (primaryColor.includes('EF4444') || primaryColor.includes('F43F5E') || primaryColor.includes('E11D48')) colorPreset = 'red';
      else if (primaryColor.includes('0EA5E9') || primaryColor.includes('0284C7')) colorPreset = 'blue';
      else colorPreset = 'dark';
    } else {
      colorPreset = 'dark'; // Always keep dark background if the user selected a dark card theme!
    }

    const defaultLogo = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=256&auto=format&fit=crop&q=80';
    const logoUrl = (business?.logo_url && business.logo_url.startsWith('http')) ? business.logo_url : defaultLogo;

    // Generate public HTTPS URL pointing to our dynamic Vercel pass-banner endpoint
    const origin = (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost'))
      ? window.location.origin
      : 'https://tarjetasmultifuncionales-1.vercel.app';

    const totalStampsVal = Number(program?.stamps_required) || 10;
    const currentStampsVal = Number(card?.stamps_count) || 0;
    const currentPointsVal = Number(card?.points_count !== undefined ? card.points_count : (card?.stamps_count || 0) * 10);
    const maxPointsVal = Number(program?.points_required) || 100;

    const bannerQuery = [
      `type=${encodeURIComponent(cardType)}`,
      `stamps=${currentStampsVal}`,
      `total=${totalStampsVal}`,
      `points=${currentPointsVal}`,
      `maxPoints=${maxPointsVal}`,
      `color=${encodeURIComponent(primaryColor.replace('#', ''))}`,
      `bg=${encodeURIComponent(bgColor.replace('#', ''))}`,
      `text=${encodeURIComponent(fgColor.replace('#', ''))}`,
      `reward=${encodeURIComponent(rewardName)}`,
      `name=${encodeURIComponent(business?.name || 'VYNTA')}`
    ].join('&');

    const dynamicBannerUrl = `${origin}/api/pass-banner?${bannerQuery}&v=${Date.now()}`;
    const cardBgImage = branding.bg_image_url || branding.card_bg_image || dynamicBannerUrl;

    const payload = {
      barcodeValue: qrUrl,
      barcodeFormat: 'QR',
      logoText: business?.name || 'VYNTA Loyalty',
      organizationName: business?.name || 'VYNTA Loyalty',
      cardTitle: `${business?.name || 'Comercio'} • ${program?.name || 'Tarjeta Digital'}`,
      description: `${program?.name || 'Tarjeta de Fidelización'} • ${business?.name || ''}`,
      passType: 'storeCard',
      backgroundColor: hexToRgb(bgColor),
      foregroundColor: hexToRgb(fgColor),
      labelColor: hexToRgb(primaryColor),
      hexBackgroundColor: bgColor,
      hexForegroundColor: fgColor,
      hexLabelColor: primaryColor,
      primaryFields,
      secondaryFields,
      headerFields,
      auxiliaryFields,
      backFields,
      textModulesData,
      logoImage: logoUrl,
      iconImage: branding.stamp_custom_image || logoUrl,
      backgroundImage: cardBgImage,
      stripImage: cardBgImage,
      heroImage: cardBgImage,
      programLogo: logoUrl,
      colorPreset: colorPreset,
      sharingProhibited: false
    };

    // Always create a fresh pass on WalletWallet (POST) so Google Wallet generates a new JWT with updated heroImage & colors
    const response = await fetch(`${WALLET_API_BASE}/api/passes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WALLET_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error al conectar con WalletWallet API' }));
      throw new Error(err.error || 'Error al generar el pase de Wallet');
    }

    const data = await response.json();

    // Cache serial and links on card in local storage if exists in db
    if (card?.id) {
      try {
        db.update('loyalty_cards', card.id, {
          wallet_serial: data.serialNumber,
          wallet_google_url: data.googleSaveUrl,
          wallet_share_url: data.shareUrl,
          wallet_apple_pass: data.applePass
        }, business?.id);
      } catch (e) {
        // Silently skip if card is a memory mock or single-use promo
      }
    }

    return data;
  },

  openApplePass(passData, filename = 'tarjeta-fidelizacion.pkpass') {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // On iPhone / iOS Safari: Navigate directly to the pass URL so iOS natively prompts "Añadir a Apple Wallet"
    if (isIOS) {
      if (passData.shareUrl) {
        window.location.href = passData.shareUrl;
        return;
      }
      if (passData.applePass) {
        window.location.href = `data:application/vnd.apple.pkpass;base64,${passData.applePass}`;
        return;
      }
    }

    // On Desktop or other browsers: Trigger download and open link
    if (passData.applePass) {
      this.downloadApplePkpass(passData.applePass, filename);
    }
    if (passData.shareUrl) {
      setTimeout(() => {
        window.open(passData.shareUrl, '_blank');
      }, 300);
    }
  },

  openGooglePass(passData) {
    if (passData.googleSaveUrl) {
      window.location.href = passData.googleSaveUrl;
    } else if (passData.shareUrl) {
      window.location.href = passData.shareUrl;
    }
  },

  downloadApplePkpass(base64Pass, filename = 'tarjeta-fidelizacion.pkpass') {
    try {
      const byteCharacters = atob(base64Pass);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.apple.pkpass' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
    } catch (e) {
      console.error('Error downloading .pkpass binary:', e);
    }
  },

  async syncLivePass(cardId, businessId) {
    try {
      const card = db.getById('loyalty_cards', cardId, businessId);
      if (!card || !card.wallet_serial) return;

      const business = db.getById('businesses', businessId);
      const customer = db.getById('customers', card.customer_id, businessId);
      const program = db.getById('loyalty_programs', card.loyalty_program_id, businessId);

      await this.generatePass({ business, customer, card, program });
    } catch (e) {
      console.warn('Background wallet live update skipped:', e);
    }
  }
};