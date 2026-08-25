/**
 * VYNTA LOYALTY ? QR Scanner & Validation Service (with Wallet Sync)
 */
import { db } from '../db/storage.js';
import { loyaltyService } from './loyaltyService.js';
import { rewardService } from './rewardService.js';
import { couponService } from './couponService.js';
import { singleUseService } from './singleUseService.js';
import { walletService } from './walletService.js';
import { SingleUseStatus } from '../db/schema.js';

export const scannerService = {
  parseScanText(rawText) {
    if (!rawText) return null;
    let clean = rawText.trim();
    
    if (clean.includes('/c/')) {
      const parts = clean.split('/c/');
      clean = parts[parts.length - 1].split('?')[0].split('#')[0];
    } else if (clean.includes('vyn_')) {
      const match = clean.match(/vyn_[A-Za-z0-9_]+/);
      if (match) clean = match[0];
    }
    return clean;
  },

  identify(tokenOrCode, activeBusinessId) {
    const cleanToken = this.parseScanText(tokenOrCode);
    if (!cleanToken) throw new Error('C\u00F3digo o QR no v\u00E1lido.');

    // 1. Check Customer Loyalty Cards (BASIC / PRO / ENTERPRISE)
    const cards = db.getTable('loyalty_cards');
    const card = cards.find(c => c.secure_token === cleanToken || c.card_number.toUpperCase() === cleanToken.toUpperCase());

    if (card) {
      if (card.business_id !== activeBusinessId) {
        const otherBiz = db.getById('businesses', card.business_id);
        throw new Error(`Esta tarjeta pertenece a otro negocio (${otherBiz ? otherBiz.name : 'otro comercio'}). No tienes autorizaci\u00F3n para procesarla.`);
      }

      const customer = db.getById('customers', card.customer_id, activeBusinessId);
      const program = db.getById('loyalty_programs', card.loyalty_program_id, activeBusinessId) || loyaltyService.getProgram(activeBusinessId);
      const business = db.getById('businesses', activeBusinessId);

      const maxStamps = program ? program.stamps_required : 10;
      const isCompleted = card.stamps_count >= maxStamps;

      return {
        type: 'CARD',
        card,
        customer,
        program,
        business,
        maxStamps,
        isCompleted,
        canAddStamp: card.stamps_count < maxStamps,
        canRedeem: isCompleted
      };
    }

    // 2. Check Single-Use Campaign Cards (PRO / ENTERPRISE)
    const singleUseCards = db.getTable('single_use_cards');
    const singleCard = singleUseCards.find(c => 
      c.secure_token.toUpperCase() === cleanToken.toUpperCase() || 
      c.card_number.toUpperCase() === cleanToken.toUpperCase()
    );

    if (singleCard) {
      if (singleCard.business_id !== activeBusinessId) {
        const otherBiz = db.getById('businesses', singleCard.business_id);
        throw new Error(`Esta tarjeta de 1 solo uso pertenece a otro negocio (${otherBiz ? otherBiz.name : 'otro comercio'}). No tienes autorizaci\u00F3n.`);
      }

      const campaign = singleCard.campaign_id ? db.getById('campaigns', singleCard.campaign_id, activeBusinessId) : null;
      const isExpired = singleCard.expires_at && new Date(singleCard.expires_at) < new Date();
      const isUsed = singleCard.status === SingleUseStatus.USED;
      const isAvailable = singleCard.status === SingleUseStatus.ACTIVE && !isExpired;

      return {
        type: 'SINGLE_USE',
        card: singleCard,
        campaign,
        reward_name: singleCard.reward_name,
        isAvailable,
        isUsed,
        isExpired,
        status: isUsed ? 'USED' : (isExpired ? 'EXPIRED' : singleCard.status)
      };
    }

    // 3. Check Promotional Coupons (PRO / ENTERPRISE)
    const coupon = couponService.getByCode(cleanToken, activeBusinessId);
    if (coupon) {
      return {
        type: 'COUPON',
        coupon,
        isAvailable: coupon.status === 'available',
        isRedeemed: coupon.status === 'redeemed'
      };
    }

    throw new Error('No se ha encontrado ninguna tarjeta de fidelidad, cup\u00F3n o pase de 1 solo uso con el c\u00F3digo escaneado.');
  },

  addStampToCard(cardId, businessId, actorSession, amount = 1) {
    const res = loyaltyService.addStamp(businessId, cardId, actorSession, amount);
    // Background sync with Wallet (updates Apple & Google Wallet push notifications)
    walletService.syncLivePass(cardId, businessId);
    return res;
  },

  addPointsToCard(cardId, businessId, actorSession, amount = 10) {
    const res = loyaltyService.addPoints(businessId, cardId, actorSession, amount);
    walletService.syncLivePass(cardId, businessId);
    return res;
  },

  redeemCardReward(cardId, businessId, actorSession) {
    const res = rewardService.redeem(businessId, cardId, actorSession);
    walletService.syncLivePass(cardId, businessId);
    return res;
  },

  redeemSingleUseCard(tokenOrNumber, businessId, actorSession) {
    return singleUseService.redeem(tokenOrNumber, businessId, actorSession);
  },

  redeemCouponCode(code, businessId, actorSession) {
    return couponService.redeem(code, businessId, actorSession);
  }
};