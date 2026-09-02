/**
 * VYNTA LOYALTY ? Customer Digital Card Portal (with Apple & Google Wallet)
 */
import { customerService } from '../services/customerService.js';
import { businessService } from '../services/businessService.js';
import { loyaltyService } from '../services/loyaltyService.js';
import { singleUseService } from '../services/singleUseService.js';
import { walletService } from '../services/walletService.js';
import { renderAppleWalletPassHTML, renderGoogleWalletPassHTML, initQRCode } from '../components/loyaltyCard.js';
import { SingleUseStatus } from '../db/schema.js';
import { toast } from '../components/toast.js';

export function renderCustomerPortalView(token) {
  const container = document.createElement('div');
  container.className = 'min-h-screen bg-[#08090D] text-white p-4 flex flex-col items-center justify-start max-w-md mx-auto space-y-4';

  const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  let activeWalletTab = isAndroid ? 'google' : 'apple';

  const singleUseCard = singleUseService.getCardByTokenOrNumber(token);
  if (singleUseCard) {
    const business = businessService.getById(singleUseCard.business_id) || businessService.getAll()[0];
    const campaign = singleUseCard.campaign_id ? singleUseService.getCampaignById(singleUseCard.business_id, singleUseCard.campaign_id) : null;
    const isUsed = singleUseCard.status === SingleUseStatus.USED;
    const isExpired = singleUseCard.expires_at && new Date(singleUseCard.expires_at) < new Date();
    const isAvailable = singleUseCard.status === SingleUseStatus.ACTIVE && !isExpired;

    const mockProgram = {
      name: campaign?.name || 'Tarjeta Promocional',
      card_type: 'single_use_promo',
      promo_benefit: singleUseCard.reward_name,
      valid_until: singleUseCard.expires_at ? new Date(singleUseCard.expires_at).toLocaleDateString('es-ES') : 'Sin caducidad',
      branding: business?.branding || {}
    };

    const mockCard = {
      card_number: singleUseCard.card_number,
      secure_token: singleUseCard.secure_token
    };

    const mockCustomer = {
      first_name: 'Cliente VIP',
      last_name: ''
    };

    container.innerHTML = `
      <div class="w-full flex items-center justify-between px-2 pt-1 text-xs text-zinc-400">
        <span class="flex items-center gap-1.5 font-bold">
          <span class="w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : isUsed ? 'bg-rose-500' : 'bg-amber-400'}"></span>
          ${isAvailable ? 'Pase de Promoción Activo' : isUsed ? 'Pase Ya Canjeado' : 'Pase Caducado'}
        </span>
        <span class="font-mono text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-bold">${singleUseCard.card_number}</span>
      </div>

      <!-- Wallet Format Selector -->
      <div class="w-full grid grid-cols-2 gap-1 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-xs">
        <button type="button" id="btn-tab-apple" class="py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-white text-black shadow-md">
          <span>🍎</span> Apple Wallet
        </button>
        <button type="button" id="btn-tab-google" class="py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white">
          <span>🤖</span> Google Wallet
        </button>
      </div>

      <!-- Card Display Box -->
      <div id="customer-card-box" class="w-full flex justify-center py-1">
        ${renderAppleWalletPassHTML({
          business,
          customer: mockCustomer,
          card: mockCard,
          program: mockProgram,
          containerId: 'customer-portal-qr'
        })}
      </div>

      <!-- Real Apple Wallet & Google Wallet Integration Buttons -->
      <div class="w-full space-y-2.5 pt-1">
        <button id="btn-apple-wallet" class="w-full py-3.5 rounded-2xl bg-black border border-zinc-700 hover:border-zinc-500 text-white font-extrabold text-xs flex items-center justify-center gap-2.5 shadow-xl transition transform hover:scale-[1.01] cursor-pointer">
          <svg class="w-5 h-5 fill-current" viewBox="0 0 170 170"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.85-12.01-14.42-6.53-9.87-11.66-21.2-15.38-33.99-3.72-12.79-5.58-24.63-5.58-35.53 0-14.11 3.51-25.56 10.53-34.34 7.02-8.78 15.71-13.28 26.07-13.5 4.69 0 10.03 1.25 16.03 3.75 6 2.5 10.08 3.81 12.24 3.94 1.77-.13 5.92-1.44 12.45-3.94 6.53-2.5 11.75-3.69 15.66-3.56 11.52.48 20.73 4.61 27.63 12.39-9.88 5.98-14.73 14.28-14.56 24.89.17 8.35 3.32 15.31 9.44 20.89 6.12 5.57 13.5 8.94 22.14 10.1-2.02 5.86-4.43 11.75-7.23 17.68zM119.22 33.15c0-6.19 2.21-12.07 6.63-17.65 4.42-5.58 9.94-9.36 16.56-11.35.21 1.28.32 2.45.32 3.51 0 6.09-2.31 12.1-6.93 18.04-4.62 5.94-10.42 9.77-17.41 11.5-.22-1.39-.33-2.61-.33-3.66l1.16-.39z"/></svg>
          <span>Añadir a Apple Wallet</span>
        </button>

        <button id="btn-google-wallet" class="w-full py-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white font-extrabold text-xs flex items-center justify-center gap-2.5 shadow-xl transition transform hover:scale-[1.01] cursor-pointer">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
          <span>Guardar en Google Wallet</span>
        </button>
      </div>
    `;

    function updateSingleUseTab(tab) {
      activeWalletTab = tab;
      const cardBox = container.querySelector('#customer-card-box');
      const btnApp = container.querySelector('#btn-tab-apple');
      const btnGoo = container.querySelector('#btn-tab-google');

      if (tab === 'apple') {
        btnApp.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-white text-black shadow-md';
        btnGoo.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white';
        cardBox.innerHTML = renderAppleWalletPassHTML({
          business,
          customer: mockCustomer,
          card: mockCard,
          program: mockProgram,
          containerId: 'customer-portal-qr'
        });
      } else {
        btnGoo.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-white text-black shadow-md';
        btnApp.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white';
        cardBox.innerHTML = renderGoogleWalletPassHTML({
          business,
          customer: mockCustomer,
          card: mockCard,
          program: mockProgram,
          containerId: 'customer-portal-qr'
        });
      }
      setTimeout(() => {
        initQRCode('customer-portal-qr', `${window.location.origin}${window.location.pathname}#/c/${singleUseCard.secure_token}`);
      }, 40);
    }

    container.querySelector('#btn-tab-apple').addEventListener('click', () => updateSingleUseTab('apple'));
    container.querySelector('#btn-tab-google').addEventListener('click', () => updateSingleUseTab('google'));

    setTimeout(() => {
      initQRCode('customer-portal-qr', `${window.location.origin}${window.location.pathname}#/c/${singleUseCard.secure_token}`);
    }, 40);

    // Apple Wallet button
    const btnApple = container.querySelector('#btn-apple-wallet');
    btnApple.addEventListener('click', async () => {
      const originalText = btnApple.innerHTML;
      btnApple.disabled = true;
      btnApple.innerHTML = `<span class="animate-spin text-sm">↻</span> Conectando con Apple Wallet...`;
      try {
        const passData = await walletService.generatePass({
          business,
          customer: mockCustomer,
          card: mockCard,
          program: mockProgram
        });
        toast.fireConfetti();
        toast.success('¡Pase de Apple Wallet listo!');
        walletService.openApplePass(passData, `${business.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-promo.pkpass`);
      } catch (err) {
        toast.error(err.message || 'Error al conectar con WalletWallet API');
      } finally {
        btnApple.disabled = false;
        btnApple.innerHTML = originalText;
      }
    });

    // Google Wallet button
    const btnGoogle = container.querySelector('#btn-google-wallet');
    btnGoogle.addEventListener('click', async () => {
      const originalText = btnGoogle.innerHTML;
      btnGoogle.disabled = true;
      btnGoogle.innerHTML = `<span class="animate-spin text-sm">↻</span> Conectando con Google Wallet...`;
      try {
        const passData = await walletService.generatePass({
          business,
          customer: mockCustomer,
          card: mockCard,
          program: mockProgram
        });
        toast.fireConfetti();
        toast.success('¡Enlace de Google Wallet listo!');
        walletService.openGooglePass(passData);
      } catch (err) {
        toast.error(err.message || 'Error al conectar con WalletWallet API');
      } finally {
        btnGoogle.disabled = false;
        btnGoogle.innerHTML = originalText;
      }
    });

    return container;
  }

  const card = customerService.getCardByToken(token);
  if (!card) {
    container.innerHTML = `
      <div class="w-full p-8 text-center glass-panel rounded-3xl space-y-4 my-auto">
        <span class="text-5xl">⚲</span>
        <h2 class="text-xl font-bold text-white">Tarjeta no encontrada</h2>
        <p class="text-xs text-zinc-400">El código de tarjeta o token no coincide.</p>
      </div>
    `;
    return container;
  }

  let business = businessService.getById(card.business_id) || businessService.getAll()[0];
  let customer = customerService.getById(card.business_id, card.customer_id) || { first_name: 'Cliente VIP', last_name: '' };
  let program = (card.loyalty_program_id ? loyaltyService.getProgram(card.business_id, card.loyalty_program_id) : null) || loyaltyService.getProgram(card.business_id);

  function getFreshState() {
    const liveCard = customerService.getCardByToken(token) || card;
    const liveBiz = (liveCard?.business_id ? businessService.getById(liveCard.business_id) : null) || business;
    const liveCust = (liveCard?.customer_id ? customerService.getById(liveCard.business_id, liveCard.customer_id) : null) || customer;
    const liveProg = (liveCard?.loyalty_program_id ? loyaltyService.getProgram(liveCard.business_id, liveCard.loyalty_program_id) : null) || loyaltyService.getProgram(liveCard?.business_id) || program;
    return { business: liveBiz, customer: liveCust, card: liveCard, program: liveProg };
  }

  container.innerHTML = `
    <div class="w-full flex items-center justify-between px-2 pt-1 text-xs text-zinc-400">
      <span class="flex items-center gap-1.5 font-bold">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Pase Activo • ${program.name}
      </span>
      <button id="btn-share-card" class="flex items-center gap-1 hover:text-white transition font-medium cursor-pointer">
        <span>⋈</span> Compartir Pase
      </button>
    </div>

    <!-- Wallet Format Selector -->
    <div class="w-full grid grid-cols-2 gap-1 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-xs">
      <button type="button" id="btn-tab-apple" class="py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${activeWalletTab === 'apple' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'} cursor-pointer">
        <span>🍎</span> Apple Wallet ${isIOS ? '<span class="text-[9px] bg-black/10 px-1.5 py-0.5 rounded font-black">iOS</span>' : ''}
      </button>
      <button type="button" id="btn-tab-google" class="py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${activeWalletTab === 'google' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'} cursor-pointer">
        <span>🤖</span> Google Wallet ${isAndroid ? '<span class="text-[9px] bg-black/10 px-1.5 py-0.5 rounded font-black">Android</span>' : ''}
      </button>
    </div>

    <!-- Authentic Pass Display -->
    <div id="customer-card-box" class="w-full flex justify-center py-1">
      ${activeWalletTab === 'apple' ? renderAppleWalletPassHTML({
        business,
        customer,
        card,
        program,
        containerId: 'customer-portal-qr'
      }) : renderGoogleWalletPassHTML({
        business,
        customer,
        card,
        program,
        containerId: 'customer-portal-qr'
      })}
    </div>

    <!-- Device-Smart Action Buttons -->
    <div class="w-full space-y-2.5 pt-2">
      ${isIOS ? `
        <!-- iPhone / iPad Priority: Apple Wallet -->
        <button id="btn-apple-wallet" class="w-full py-4 rounded-2xl bg-black border-2 border-white/40 hover:border-white text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-2xl transition transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
          <svg class="w-6 h-6 fill-current" viewBox="0 0 170 170"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.85-12.01-14.42-6.53-9.87-11.66-21.2-15.38-33.99-3.72-12.79-5.58-24.63-5.58-35.53 0-14.11 3.51-25.56 10.53-34.34 7.02-8.78 15.71-13.28 26.07-13.5 4.69 0 10.03 1.25 16.03 3.75 6 2.5 10.08 3.81 12.24 3.94 1.77-.13 5.92-1.44 12.45-3.94 6.53-2.5 11.75-3.69 15.66-3.56 11.52.48 20.73 4.61 27.63 12.39-9.88 5.98-14.73 14.28-14.56 24.89.17 8.35 3.32 15.31 9.44 20.89 6.12 5.57 13.5 8.94 22.14 10.1-2.02 5.86-4.43 11.75-7.23 17.68zM119.22 33.15c0-6.19 2.21-12.07 6.63-17.65 4.42-5.58 9.94-9.36 16.56-11.35.21 1.28.32 2.45.32 3.51 0 6.09-2.31 12.1-6.93 18.04-4.62 5.94-10.42 9.77-17.41 11.5-.22-1.39-.33-2.61-.33-3.66l1.16-.39z"/></svg>
          <span>Añadir a Apple Wallet</span>
        </button>
        <button id="btn-google-wallet" class="w-full py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
          <span>O guardar en Google Wallet</span>
        </button>
      ` : `
        <!-- Android / Other Priority: Google Wallet -->
        <button id="btn-google-wallet" class="w-full py-4 rounded-2xl bg-zinc-900 border-2 border-sky-500/50 hover:border-sky-400 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-2xl transition transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
          <span>Guardar en Google Wallet</span>
        </button>
        <button id="btn-apple-wallet" class="w-full py-2.5 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 170 170"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.85-12.01-14.42-6.53-9.87-11.66-21.2-15.38-33.99-3.72-12.79-5.58-24.63-5.58-35.53 0-14.11 3.51-25.56 10.53-34.34 7.02-8.78 15.71-13.28 26.07-13.5 4.69 0 10.03 1.25 16.03 3.75 6 2.5 10.08 3.81 12.24 3.94 1.77-.13 5.92-1.44 12.45-3.94 6.53-2.5 11.75-3.69 15.66-3.56 11.52.48 20.73 4.61 27.63 12.39-9.88 5.98-14.73 14.28-14.56 24.89.17 8.35 3.32 15.31 9.44 20.89 6.12 5.57 13.5 8.94 22.14 10.1-2.02 5.86-4.43 11.75-7.23 17.68zM119.22 33.15c0-6.19 2.21-12.07 6.63-17.65 4.42-5.58 9.94-9.36 16.56-11.35.21 1.28.32 2.45.32 3.51 0 6.09-2.31 12.1-6.93 18.04-4.62 5.94-10.42 9.77-17.41 11.5-.22-1.39-.33-2.61-.33-3.66l1.16-.39z"/></svg>
          <span>O añadir a Apple Wallet (.pkpass)</span>
        </button>
      `}
    </div>

    <!-- PWA Local Install Box -->
    <div class="w-full p-4 rounded-3xl glass-panel text-center space-y-2">
      <p class="text-[11px] text-zinc-400">Pase digital compatible con notificaciones de sellos en tiempo real en tu reloj y móvil.</p>
      <button id="btn-pwa-install" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sky-400 font-bold text-xs transition cursor-pointer">
        ◫ Guardar Acceso Directo en Pantalla
      </button>
    </div>
  `;

  function updateCustomerTab(tab) {
    activeWalletTab = tab;
    const fresh = getFreshState();
    const cardBox = container.querySelector('#customer-card-box');
    const btnApp = container.querySelector('#btn-tab-apple');
    const btnGoo = container.querySelector('#btn-tab-google');

    if (tab === 'apple') {
      btnApp.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-white text-black shadow-md cursor-pointer';
      btnGoo.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white cursor-pointer';
      cardBox.innerHTML = renderAppleWalletPassHTML({
        business: fresh.business,
        customer: fresh.customer,
        card: fresh.card,
        program: fresh.program,
        containerId: 'customer-portal-qr'
      });
    } else {
      btnGoo.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 bg-white text-black shadow-md cursor-pointer';
      btnApp.className = 'py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-zinc-400 hover:text-white cursor-pointer';
      cardBox.innerHTML = renderGoogleWalletPassHTML({
        business: fresh.business,
        customer: fresh.customer,
        card: fresh.card,
        program: fresh.program,
        containerId: 'customer-portal-qr'
      });
    }
    setTimeout(() => {
      initQRCode('customer-portal-qr', `${window.location.origin}${window.location.pathname}#/c/${fresh.card.secure_token}`);
    }, 40);
  }

  container.querySelector('#btn-tab-apple').addEventListener('click', () => updateCustomerTab('apple'));
  container.querySelector('#btn-tab-google').addEventListener('click', () => updateCustomerTab('google'));

  setTimeout(() => {
    initQRCode('customer-portal-qr', `${window.location.origin}${window.location.pathname}#/c/${card.secure_token}`);
  }, 50);

  // Apple Wallet Integration
  const btnApple = container.querySelector('#btn-apple-wallet');
  btnApple.addEventListener('click', async () => {
    const originalText = btnApple.innerHTML;
    btnApple.disabled = true;
    btnApple.innerHTML = `<span class="animate-spin text-sm">↻</span> Conectando con Apple Wallet...`;

    try {
      const fresh = getFreshState();
      const passData = await walletService.generatePass({
        business: fresh.business,
        customer: fresh.customer,
        card: fresh.card,
        program: fresh.program
      });
      toast.fireConfetti();
      toast.success('¡Pase de Apple Wallet listo!');
      walletService.openApplePass(passData, `${fresh.business.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-pase.pkpass`);
    } catch (err) {
      toast.error(err.message || 'Error al conectar con WalletWallet API');
    } finally {
      btnApple.disabled = false;
      btnApple.innerHTML = originalText;
    }
  });

  // Google Wallet Integration
  const btnGoogle = container.querySelector('#btn-google-wallet');
  btnGoogle.addEventListener('click', async () => {
    const originalText = btnGoogle.innerHTML;
    btnGoogle.disabled = true;
    btnGoogle.innerHTML = `<span class="animate-spin text-sm">↻</span> Conectando con Google Wallet...`;

    try {
      const fresh = getFreshState();
      const passData = await walletService.generatePass({
        business: fresh.business,
        customer: fresh.customer,
        card: fresh.card,
        program: fresh.program
      });
      toast.fireConfetti();
      toast.success('¡Enlace de Google Wallet listo!');
      walletService.openGooglePass(passData);
    } catch (err) {
      toast.error(err.message || 'Error al conectar con WalletWallet API');
    } finally {
      btnGoogle.disabled = false;
      btnGoogle.innerHTML = originalText;
    }
  });

  container.querySelector('#btn-share-card').addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
        title: `Tarjeta de Fidelización • ${business.name}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace de la tarjeta copiado al portapapeles.');
    }
  });

  container.querySelector('#btn-pwa-install').addEventListener('click', () => {
    toast.success('Para instalar en iOS/Android: Pulsa "Compartir" en tu navegador y selecciona "Añadir a la pantalla de inicio".');
  });

  return container;
}