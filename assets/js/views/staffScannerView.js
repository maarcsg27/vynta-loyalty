/**
 * VYNTA LOYALTY ? Staff Scanner Terminal (Mobile-First)
 */
import { businessService } from '../services/businessService.js';
import { scannerService } from '../services/scannerService.js';
import { authService } from '../services/authService.js';
import { CameraQRScanner } from '../components/qrScannerModal.js';
import { toast } from '../components/toast.js';

export function renderStaffScannerView() {
  const session = authService.getSession();
  const businessId = session.business_id || 'biz_cafe';
  const business = businessService.getById(businessId);

  const container = document.createElement('div');
  container.className = 'min-h-[calc(100vh-61px)] bg-[#090A0F] text-white p-4 max-w-md mx-auto flex flex-col items-center space-y-5';

  let currentResult = null;
  let qrScanner = null;

  container.innerHTML = `
    <div class="w-full flex items-center justify-between p-3 rounded-2xl glass-panel">
      <div class="flex items-center gap-2.5">
        <img src="${business?.logo_url}" alt="${business?.name}" class="w-8 h-8 rounded-xl object-cover border border-white/10">
        <div>
          <h2 class="text-xs font-bold text-white">${business?.name}</h2>
          <span class="text-[9px] text-sky-400 font-bold uppercase">Terminal de Sellos \u2022 Staff</span>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        Conectado
      </span>
    </div>

    <div class="w-full relative rounded-3xl overflow-hidden glass-panel border border-sky-500/30 shadow-2xl p-4 flex flex-col items-center text-center">
      <div id="camera-viewport" class="w-full h-64 bg-black rounded-2xl overflow-hidden relative flex items-center justify-center border border-zinc-800">
        <div id="scanner-placeholder" class="space-y-3 p-6">
          <span class="text-4xl font-bold">\u25EB</span>
          <p class="text-xs text-zinc-400 font-medium">Apunta al c\u00F3digo QR de la tarjeta del cliente</p>
          <button id="btn-start-camera" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition">
            Iniciar C\u00E1mara
          </button>
        </div>
        <div id="qr-reader-target" class="w-full h-full hidden"></div>
        <div id="scan-laser-line" class="scan-laser hidden"></div>
      </div>

      <p class="text-[10px] text-zinc-500 mt-3 font-medium">Lector compatible con QR de tarjetas VYNTA y cupones</p>
    </div>

    <div class="w-full glass-panel p-4 rounded-3xl space-y-2.5">
      <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">O introducir c\u00F3digo manualmente:</span>
      <form id="form-manual-token" class="flex gap-2">
        <input type="text" id="input-manual-token" placeholder="Ej: vyn_maria_cafe01 o CC-00109" class="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-sky-500">
        <button type="submit" class="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition">
          Buscar
        </button>
      </form>
    </div>

    <div id="scan-result-card" class="w-full hidden transform transition-all duration-300"></div>
  `;

  function handleDetectedCode(tokenOrCode) {
    try {
      const match = scannerService.identify(tokenOrCode, businessId);
      currentResult = match;
      renderScanResult(match);
      toast.success('\u00A1C\u00F3digo identificado correctamente!');
    } catch (err) {
      toast.error(err.message);
    }
  }

  function renderScanResult(match) {
    const resultCard = container.querySelector('#scan-result-card');
    resultCard.classList.remove('hidden');

    if (match.type === 'CARD') {
      const { card, customer, program, maxStamps, isCompleted } = match;
      const custName = customer ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Cliente VIP';
      const cardType = program?.card_type || 'points';
      const stamps = Number(card.stamps_count) || 0;
      const currentPoints = Number(card.points_count !== undefined ? card.points_count : stamps * 10);
      const maxPoints = Number(program?.points_required || (maxStamps * 10) || 100);
      const isPointsCompleted = currentPoints >= maxPoints;

      if (cardType === 'points') {
        resultCard.innerHTML = `
          <div class="w-full glass-panel p-5 rounded-3xl border border-sky-500/50 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span class="text-[10px] font-bold text-sky-400 uppercase tracking-wider">\uD83D\uDCB3 Tarjeta Cliente \u2022 Puntos</span>
                <h3 class="text-base font-extrabold text-white">${custName}</h3>
                <p class="text-[10px] font-mono text-zinc-400">Tarjeta #${card.card_number} \u2022 ${customer?.phone || ''}</p>
              </div>
              <div class="text-right">
                <span class="text-[10px] font-bold text-zinc-400 uppercase block">Saldo Actual</span>
                <span class="text-xl font-extrabold font-mono text-sky-400">
                  ${currentPoints} <span class="text-xs">PTS</span>
                </span>
              </div>
            </div>

            <div class="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <span class="text-lg font-bold text-amber-400">\uD83C\uDF81</span>
              <div class="flex-1">
                <p class="text-[10px] text-zinc-400 uppercase font-bold">Meta: ${maxPoints} pts</p>
                <p class="text-xs font-bold text-white">${program?.reward_name || '10\u20AC de Descuento'}</p>
              </div>
              ${isPointsCompleted ? `
                <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500 text-black animate-pulse shadow-md">\u00A1META ALCANZADA!</span>
              ` : `
                <span class="text-[10px] font-bold text-zinc-400">${maxPoints - currentPoints} pts restantes</span>
              `}
            </div>

            <!-- Quick Points Addition Buttons -->
            <div class="space-y-2 pt-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Asignar Puntos por Compra:</span>
              <div class="grid grid-cols-4 gap-2">
                <button data-add-pts="10" class="btn-scanner-add-pts py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs shadow transition cursor-pointer">
                  +10 pts
                </button>
                <button data-add-pts="20" class="btn-scanner-add-pts py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs shadow transition cursor-pointer">
                  +20 pts
                </button>
                <button data-add-pts="50" class="btn-scanner-add-pts py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs shadow transition cursor-pointer">
                  +50 pts
                </button>
                <button data-add-pts="100" class="btn-scanner-add-pts py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs shadow transition cursor-pointer">
                  +100 pts
                </button>
              </div>

              <!-- Custom points input -->
              <div class="flex items-center gap-2 pt-1">
                <input type="number" id="input-custom-scan-points" placeholder="Puntos a medida..." min="1" class="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono">
                <button id="btn-add-custom-pts" class="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition cursor-pointer">
                  + Sumar
                </button>
              </div>

              ${isPointsCompleted ? `
                <button id="btn-redeem-reward" class="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2">
                  <span>\u2605</span> CANJEAR PREMIO (${program?.reward_name || 'Premio'})
                </button>
              ` : ''}

              <button id="btn-dismiss-scan" class="w-full py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white font-semibold text-xs transition cursor-pointer">
                Cerrar y Escanear Siguiente
              </button>
            </div>
          </div>
        `;

        resultCard.querySelectorAll('.btn-scanner-add-pts').forEach(btn => {
          btn.addEventListener('click', () => {
            const pts = Number(btn.getAttribute('data-add-pts')) || 10;
            try {
              const res = scannerService.addPointsToCard(card.id, businessId, session, pts);
              toast.fireConfetti();
              toast.success(`\u2714 +${pts} puntos asignados a ${custName} (Saldo: ${res.card.points_count} pts)`);
              if (res.isCompleted) {
                alert(`\u00A1Felicidades! ${custName} ha alcanzado ${res.card.points_count} puntos y puede canjear "${program?.reward_name}".`);
              }
              handleDetectedCode(card.secure_token);
            } catch (e) {
              toast.error(e.message);
            }
          });
        });

        const btnCustomPts = resultCard.querySelector('#btn-add-custom-pts');
        const inputCustomPts = resultCard.querySelector('#input-custom-scan-points');
        if (btnCustomPts && inputCustomPts) {
          btnCustomPts.addEventListener('click', () => {
            const pts = Number(inputCustomPts.value);
            if (!pts || pts <= 0) {
              toast.error('Ingresa una cantidad v\u00E1lida de puntos.');
              return;
            }
            try {
              const res = scannerService.addPointsToCard(card.id, businessId, session, pts);
              toast.fireConfetti();
              toast.success(`\u2714 +${pts} puntos asignados a ${custName} (Saldo: ${res.card.points_count} pts)`);
              handleDetectedCode(card.secure_token);
            } catch (e) {
              toast.error(e.message);
            }
          });
        }
      } else {
        // Stamps Card
        resultCard.innerHTML = `
          <div class="w-full glass-panel p-5 rounded-3xl border border-amber-500/50 shadow-2xl space-y-4">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider">\u2B50 Tarjeta Loyalty \u2022 Sellos</span>
                <h3 class="text-base font-extrabold text-white">${custName}</h3>
                <p class="text-[10px] font-mono text-zinc-400">Tarjeta #${card.card_number} \u2022 ${customer?.phone || ''}</p>
              </div>
              <div class="text-right">
                <span class="text-[10px] font-bold text-zinc-400 uppercase block">Progreso</span>
                <span class="text-xl font-extrabold ${isCompleted ? 'text-emerald-400' : 'text-amber-400'}">
                  ${stamps} / ${maxStamps}
                </span>
              </div>
            </div>

            <div class="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <span class="text-lg font-bold text-amber-400">\u2605</span>
              <div class="flex-1">
                <p class="text-[10px] text-zinc-400 uppercase font-bold">Premio del Programa</p>
                <p class="text-xs font-bold text-white">${program?.reward_name || 'Recompensa'}</p>
              </div>
              ${isCompleted ? `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-black animate-pulse">\u00A1LISTA!</span>
              ` : `
                <span class="text-[10px] font-bold text-zinc-400">${maxStamps - stamps} restantes</span>
              `}
            </div>

            <div class="space-y-2 pt-1">
              ${!isCompleted ? `
                <button id="btn-add-stamp" class="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer">
                  <span class="text-base font-black">+1</span> ESTAMPAR SELLO
                </button>
              ` : `
                <button id="btn-redeem-reward" class="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer">
                  <span>\u2605</span> CANJEAR RECOMPENSA
                </button>
              `}

              <button id="btn-dismiss-scan" class="w-full py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white font-semibold text-xs transition cursor-pointer">
                Cerrar y Escanear Siguiente
              </button>
            </div>
          </div>
        `;

        const btnAdd = resultCard.querySelector('#btn-add-stamp');
        if (btnAdd) {
          btnAdd.addEventListener('click', () => {
            try {
              const res = scannerService.addStampToCard(card.id, businessId, session);
              toast.success(`\u2714 Sello a\u00F1adido con \u00E9xito a ${custName} (${res.card.stamps_count}/${maxStamps})`);
              if (res.isCompleted) {
                toast.fireConfetti();
                alert(`\u00A1Felicidades! ${custName} ha completado todos los sellos y tiene su recompensa "${program?.reward_name}" disponible.`);
              }
              handleDetectedCode(card.secure_token);
            } catch (e) {
              toast.error(e.message);
            }
          });
        }
      }

      const btnRedeem = resultCard.querySelector('#btn-redeem-reward');
      if (btnRedeem) {
        btnRedeem.addEventListener('click', () => {
          if (confirm(`\u00BFConfirmar el canje de "${program?.reward_name}" para ${custName}?`)) {
            try {
              const res = scannerService.redeemCardReward(card.id, businessId, session);
              toast.fireConfetti();
              toast.success(`Recompensa canjeada con \u00E9xito. Tarjeta reiniciada para el pr\u00F3ximo ciclo.`);
              handleDetectedCode(card.secure_token);
            } catch (e) {
              toast.error(e.message);
            }
          }
        });
      }

      resultCard.querySelector('#btn-dismiss-scan').addEventListener('click', () => {
        resultCard.classList.add('hidden');
        currentResult = null;
      });
    } else if (match.type === 'SINGLE_USE') {
      const { card, campaign, reward_name, isAvailable, isUsed, isExpired } = match;
      const dateStr = card.redeemed_at ? new Date(card.redeemed_at).toLocaleString('es-ES') : '';
      const expStr = card.expires_at ? new Date(card.expires_at).toLocaleDateString('es-ES') : 'Sin fecha';

      resultCard.innerHTML = `
        <div class="w-full glass-panel p-5 rounded-3xl border ${isAvailable ? 'border-emerald-500/50 shadow-emerald-950/40' : 'border-zinc-700'} shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">\u2728 Campa\u00F1a \u2022 1 Solo Uso</span>
              <h3 class="text-base font-extrabold text-white">${campaign?.name || 'Promoci\u00F3n de Captaci\u00F3n'}</h3>
              <p class="text-[10px] font-mono text-zinc-400">Pase #${card.card_number} \u2022 Caduca: ${expStr}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
              isAvailable 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse' 
                : isUsed 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }">
              ${isAvailable ? 'Disponible' : isUsed ? 'Ya Canjeada' : 'Caducada'}
            </span>
          </div>

          <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <span class="text-2xl font-bold text-amber-400">\uD83C\uDF81</span>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] text-zinc-400 uppercase font-bold">Premio a Entregar</p>
              <p class="text-sm font-black text-white truncate text-emerald-400">${reward_name || 'Recompensa Exclusiva'}</p>
            </div>
          </div>

          ${isAvailable ? `
            <button id="btn-redeem-single-use" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs tracking-wider shadow-lg transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer">
              <span>\u2714</span> CANJEAR TARJETA (1 SOLO USO)
            </button>
          ` : isUsed ? `
            <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
              <p class="text-xs font-bold text-rose-400">\u26A0 Esta tarjeta ya fue canjeada</p>
              <p class="text-[10px] text-zinc-400 mt-0.5">Fecha: ${dateStr} \u2022 Por: ${card.redeemed_by || 'Staff'}</p>
            </div>
          ` : `
            <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <p class="text-xs font-bold text-amber-400">\u26A0 Tarjeta caducada</p>
              <p class="text-[10px] text-zinc-400 mt-0.5">Fecha l\u00EDmite superada (${expStr})</p>
            </div>
          `}

          <button id="btn-dismiss-single" class="w-full py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white font-semibold text-xs transition cursor-pointer">
            Cerrar y Escanear Siguiente
          </button>
        </div>
      `;

      const btnRedeemSingle = resultCard.querySelector('#btn-redeem-single-use');
      if (btnRedeemSingle) {
        btnRedeemSingle.addEventListener('click', () => {
          if (confirm(`\u00BFConfirmar el canje de "${reward_name}" para el pase #${card.card_number}? Esta operaci\u00F3n es irreversible.`)) {
            try {
              scannerService.redeemSingleUseCard(card.secure_token, businessId, session);
              toast.fireConfetti();
              toast.success(`\u2728 \u00A1Tarjeta #${card.card_number} canjeada con \u00E9xito!`);
              handleDetectedCode(card.secure_token);
            } catch (e) {
              toast.error(e.message);
            }
          }
        });
      }

      resultCard.querySelector('#btn-dismiss-single').addEventListener('click', () => {
        resultCard.classList.add('hidden');
        currentResult = null;
      });
    } else if (match.type === 'COUPON') {
      const { coupon, isAvailable } = match;
      resultCard.innerHTML = `
        <div class="w-full glass-panel p-5 rounded-3xl border border-purple-500/50 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <span class="text-[10px] font-bold text-zinc-400 uppercase">Cup\u00F3n de Descuento</span>
              <h3 class="text-base font-extrabold text-white">${coupon.title}</h3>
              <p class="text-[10px] font-mono text-purple-400 font-bold">${coupon.code}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold ${isAvailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}">
              ${isAvailable ? 'Disponible' : 'Ya Canjeado'}
            </span>
          </div>

          ${isAvailable ? `
            <button id="btn-redeem-coupon" class="w-full py-3 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs shadow-lg transition">
              Canjear Cup\u00F3n de Un Solo Uso
            </button>
          ` : `
            <p class="text-xs text-rose-400 text-center font-semibold">Este cup\u00F3n no puede volver a utilizarse.</p>
          `}

          <button id="btn-dismiss-coupon" class="w-full py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white font-semibold text-xs transition">
            Cerrar
          </button>
        </div>
      `;

      const btnRedeemCpn = resultCard.querySelector('#btn-redeem-coupon');
      if (btnRedeemCpn) {
        btnRedeemCpn.addEventListener('click', () => {
          if (confirm(`\u00BFCanjear el cup\u00F3n ${coupon.code}?`)) {
            try {
              scannerService.redeemCouponCode(coupon.code, businessId, session);
              toast.fireConfetti();
              toast.success(`Cup\u00F3n ${coupon.code} canjeado con \u00E9xito.`);
              handleDetectedCode(coupon.code);
            } catch (e) {
              toast.error(e.message);
            }
          }
        });
      }

      resultCard.querySelector('#btn-dismiss-coupon').addEventListener('click', () => {
        resultCard.classList.add('hidden');
      });
    }
  }

  const btnStartCamera = container.querySelector('#btn-start-camera');
  const scannerPlaceholder = container.querySelector('#scanner-placeholder');
  const qrReaderTarget = container.querySelector('#qr-reader-target');
  const laserLine = container.querySelector('#scan-laser-line');

  btnStartCamera.addEventListener('click', async () => {
    scannerPlaceholder.classList.add('hidden');
    qrReaderTarget.classList.remove('hidden');
    laserLine.classList.remove('hidden');

    qrScanner = new CameraQRScanner(
      'qr-reader-target',
      (decodedText) => {
        handleDetectedCode(decodedText);
      },
      () => {}
    );

    try {
      await qrScanner.start();
    } catch (e) {
      toast.warning('No se pudo abrir la c\u00E1mara o no hay permisos. Puedes usar el buscador de c\u00F3digo manual.');
      scannerPlaceholder.classList.remove('hidden');
      qrReaderTarget.classList.add('hidden');
      laserLine.classList.add('hidden');
    }
  });

  const formManual = container.querySelector('#form-manual-token');
  const inputManual = container.querySelector('#input-manual-token');

  formManual.addEventListener('submit', (e) => {
    e.preventDefault();
    const token = inputManual.value.trim();
    if (token) {
      handleDetectedCode(token);
    }
  });

  return container;
}