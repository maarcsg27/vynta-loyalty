/**
 * VYNTA LOYALTY ? Single-Use Cards & Acquisition Campaigns Service
 */
import { db } from '../db/storage.js';
import { auditService } from './auditService.js';
import { syncService } from './syncService.js';
import { planService, Features } from './planService.js';
import { SingleUseStatus, generateUUID, generateSecureToken } from '../db/schema.js';

export const singleUseService = {
  getAll(businessId) {
    return this.getAllCards(businessId);
  },

  getAllCampaigns(businessId) {
    return db.getTable('campaigns', businessId);
  },

  getCampaignById(businessId, campaignId) {
    const campaign = db.getById('campaigns', campaignId, businessId);
    if (!campaign) return null;
    const cards = this.getCardsByCampaign(businessId, campaignId);
    const usedCount = cards.filter(c => c.status === SingleUseStatus.USED).length;
    const activeCount = cards.filter(c => c.status === SingleUseStatus.ACTIVE).length;
    return {
      ...campaign,
      cards,
      used_count: usedCount,
      active_count: activeCount,
      total_count: cards.length,
      redemption_rate: cards.length > 0 ? Math.round((usedCount / cards.length) * 100) : 0
    };
  },

  getCardsByCampaign(businessId, campaignId) {
    const allCards = db.getTable('single_use_cards', businessId);
    return allCards.filter(c => c.campaign_id === campaignId);
  },

  getAllCards(businessId) {
    return db.getTable('single_use_cards', businessId);
  },

  getCardByTokenOrNumber(tokenOrNumber, businessId = null) {
    if (!tokenOrNumber) return null;
    const clean = tokenOrNumber.trim().toUpperCase();
    const allCards = db.getTable('single_use_cards', businessId);
    return allCards.find(c => 
      c.secure_token.toUpperCase() === clean || 
      c.card_number.toUpperCase() === clean
    ) || null;
  },

  createCampaign(businessId, campaignData, actorSession) {
    planService.assertCanAccess(businessId, Features.MARKETING_CAMPAIGNS, actorSession);

    const biz = db.getById('businesses', businessId);
    if (!biz) throw new Error('Negocio no encontrado');

    const campaignId = 'cmp_' + generateUUID().substring(0, 8);
    const quantity = Math.max(1, Math.min(1000, parseInt(campaignData.quantity) || 50));
    const rewardName = campaignData.reward_name || 'Caf\u00E9 Gratis de Bienvenida';
    const startDate = campaignData.start_date || new Date().toISOString();
    const endDate = campaignData.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const newCampaign = db.insert('campaigns', {
      id: campaignId,
      business_id: businessId,
      name: campaignData.name || 'Campa\u00F1a de Captaci\u00F3n',
      description: campaignData.description || 'Tarjeta promocional de un solo uso.',
      reward_name: rewardName,
      start_date: startDate,
      end_date: endDate,
      total_cards: quantity,
      used_cards_count: 0,
      status: 'ACTIVE'
    }, businessId);

    const generatedCards = [];
    for (let i = 1; i <= quantity; i++) {
      const serialNum = `PRM-${Math.floor(100000 + Math.random() * 900000)}`;
      const token = generateSecureToken('vyn_promo');
      const card = db.insert('single_use_cards', {
        id: 'suc_' + generateUUID().substring(0, 8),
        business_id: businessId,
        campaign_id: campaignId,
        card_number: serialNum,
        secure_token: token,
        reward_name: rewardName,
        status: SingleUseStatus.ACTIVE,
        expires_at: endDate,
        redeemed_at: null,
        redeemed_by: null
      }, businessId);
      generatedCards.push(card);
    }

    auditService.log(businessId, 'CAMPAIGN_CREATED', `Campa\u00F1a "${newCampaign.name}" creada con ${quantity} tarjetas de 1 solo uso (${rewardName}).`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'campaign',
      entityId: campaignId
    });

    syncService.broadcast('CAMPAIGN_CREATED', {
      campaign: newCampaign,
      cardsCount: quantity
    });

    return { campaign: newCampaign, cards: generatedCards };
  },

  redeem(tokenOrNumber, businessId, actorSession) {
    const card = this.getCardByTokenOrNumber(tokenOrNumber, businessId);
    if (!card) {
      throw new Error('Tarjeta de un solo uso no encontrada en este comercio.');
    }

    if (card.business_id !== businessId) {
      throw new Error('Esta tarjeta pertenece a otro comercio.');
    }

    if (card.status === SingleUseStatus.USED) {
      const dateStr = card.redeemed_at ? new Date(card.redeemed_at).toLocaleString('es-ES') : 'previamente';
      throw new Error(`Esta tarjeta de un solo uso YA FUE CANJEADA el ${dateStr} por ${card.redeemed_by || 'personal'}.`);
    }

    if (card.status === SingleUseStatus.EXPIRED || (card.expires_at && new Date(card.expires_at) < new Date())) {
      throw new Error('Esta tarjeta promocional ha caducado.');
    }

    if (card.status === SingleUseStatus.DISABLED) {
      throw new Error('Esta tarjeta ha sido desactivada por el comercio.');
    }

    // Atomic Status Transition: ACTIVE -> USED
    const nowIso = new Date().toISOString();
    const staffName = actorSession?.name || 'Staff';

    const updatedCard = db.update('single_use_cards', card.id, {
      status: SingleUseStatus.USED,
      redeemed_at: nowIso,
      redeemed_by: staffName
    }, businessId);

    // Update campaign counter
    if (card.campaign_id) {
      const camp = db.getById('campaigns', card.campaign_id, businessId);
      if (camp) {
        db.update('campaigns', camp.id, {
          used_cards_count: (camp.used_cards_count || 0) + 1
        }, businessId);
      }
    }

    auditService.log(businessId, 'SINGLE_USE_REDEEMED', `Tarjeta single-use #${card.card_number} canjeada exitosamente (${card.reward_name}).`, {
      userName: staffName,
      role: actorSession?.role || 'STAFF',
      entityType: 'single_use_card',
      entityId: card.id
    });

    syncService.broadcast('SINGLE_USE_REDEEMED', {
      card: updatedCard
    });

    return updatedCard;
  },

  getBusinessStats(businessId) {
    const campaigns = this.getAllCampaigns(businessId);
    const cards = this.getAllCards(businessId);
    const used = cards.filter(c => c.status === SingleUseStatus.USED).length;
    const active = cards.filter(c => c.status === SingleUseStatus.ACTIVE).length;
    const expired = cards.filter(c => c.status === SingleUseStatus.EXPIRED || (c.expires_at && new Date(c.expires_at) < new Date() && c.status !== SingleUseStatus.USED)).length;

    return {
      totalCampaigns: campaigns.length,
      totalCards: cards.length,
      usedCards: used,
      activeCards: active,
      expiredCards: expired,
      conversionRate: cards.length > 0 ? Math.round((used / cards.length) * 100) : 0
    };
  },

  deleteCard(businessId, cardId, actorSession) {
    const card = db.getById('single_use_cards', cardId, businessId);
    if (!card) return false;

    db.delete('single_use_cards', cardId, businessId);

    auditService.log(businessId, 'SINGLE_USE_DELETED', `Tarjeta de 1 solo uso eliminada: #${card.card_number}`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'single_use_card',
      entityId: cardId
    });

    syncService.broadcast('SINGLE_USE_DELETED', { businessId, cardId });
    return true;
  },

  deleteCampaign(businessId, campaignId, actorSession) {
    const camp = db.getById('campaigns', campaignId, businessId);
    if (!camp) return false;

    const cards = db.getTable('single_use_cards', businessId).filter(c => c.campaign_id === campaignId);
    cards.forEach(c => {
      db.delete('single_use_cards', c.id, businessId);
    });

    db.delete('campaigns', campaignId, businessId);

    auditService.log(businessId, 'CAMPAIGN_DELETED', `Campa\u00F1a eliminada: ${camp.name}`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'campaign',
      entityId: campaignId
    });

    syncService.broadcast('CAMPAIGN_DELETED', { businessId, campaignId });
    return true;
  }
};
