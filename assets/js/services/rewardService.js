/**
 * VYNTA LOYALTY ? Rewards & Redemption Service (with Cloud Sync)
 */
import { db } from '../db/storage.js';
import { auditService } from './auditService.js';
import { loyaltyService } from './loyaltyService.js';
import { syncService } from './syncService.js';
import { generateUUID } from '../db/schema.js';

export const rewardService = {
  getAll(businessId) {
    return db.getTable('rewards', businessId);
  },

  getById(businessId, rewardId) {
    return db.getById('rewards', rewardId, businessId);
  },

  redeem(businessId, cardId, actorSession) {
    const card = db.getById('loyalty_cards', cardId, businessId);
    if (!card) throw new Error('Tarjeta no encontrada');

    const program = db.getById('loyalty_programs', card.loyalty_program_id, businessId) || loyaltyService.getProgram(businessId);
    const maxStamps = program ? program.stamps_required : 10;

    if (card.stamps_count < maxStamps) {
      throw new Error(`La tarjeta solo tiene ${card.stamps_count}/${maxStamps} sellos. Se necesitan ${maxStamps} sellos para canjear.`);
    }

    const updatedCard = db.update('loyalty_cards', card.id, {
      stamps_count: 0,
      rewards_redeemed_count: (card.rewards_redeemed_count || 0) + 1,
      status: 'active'
    }, businessId);

    const redemptionId = 'red_' + generateUUID().substring(0, 8);
    const newRedemption = db.insert('redemptions', {
      id: redemptionId,
      business_id: businessId,
      customer_id: card.customer_id,
      card_id: card.id,
      reward_id: 'rew_default',
      staff_user_id: actorSession?.user_id || 'usr_staff_default',
      reward_name: program?.reward_name || 'Recompensa Completada',
      redeemed_at: new Date().toISOString()
    }, businessId);

    const customer = db.getById('customers', card.customer_id, businessId);
    const custName = customer ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Cliente';

    auditService.log(businessId, 'REWARD_REDEEMED', `Recompensa "${program?.reward_name}" canjeada por ${custName} (#${card.card_number}). Tarjeta reiniciada a 0/${maxStamps} sellos.`, {
      userName: actorSession?.name || 'Staff',
      role: actorSession?.role || 'STAFF',
      entityType: 'redemption',
      entityId: redemptionId
    });

    syncService.broadcast('REWARD_REDEEMED', {
      card: updatedCard,
      redemption: newRedemption
    });

    return { card: updatedCard, redemption: newRedemption };
  }
};