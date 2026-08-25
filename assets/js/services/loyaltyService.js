/**
 * VYNTA LOYALTY ? Loyalty Programs & Stamp Engine (with Cloud Sync)
 */
import { db } from '../db/storage.js';
import { auditService } from './auditService.js';
import { syncService } from './syncService.js';
import { generateUUID } from '../db/schema.js';

export const loyaltyService = {
  getProgram(businessId) {
    const programs = db.getTable('loyalty_programs', businessId);
    return programs.find(p => p.active) || programs[0] || null;
  },

  getProgramById(businessId, programId) {
    if (!businessId || !programId) return null;
    const programs = db.getTable('loyalty_programs', businessId);
    return programs.find(p => p.id === programId) || null;
  },

  getAllPrograms(businessId) {
    if (!businessId) return [];
    const programs = db.getTable('loyalty_programs', businessId);
    return programs || [];
  },

  createProgram(businessId, data, actorSession) {
    const newProgram = {
      id: 'prog_' + generateUUID().substring(0, 8),
      business_id: businessId,
      name: data.name || 'Nueva Tarjeta Digital',
      description: data.description || '',
      stamps_required: Number(data.stamps_required) || 10,
      points_required: Number(data.points_required) || (Number(data.stamps_required) ? Number(data.stamps_required) * 10 : 100),
      points_ratio: Number(data.points_ratio) || 10,
      reward_name: data.reward_name || 'Premio de Fidelidad',
      card_type: data.card_type || 'points',
      tier_levels: data.tier_levels || [
        { name: 'Nivel Silver', req: 5, reward: '10% Descuento' },
        { name: 'Nivel Gold', req: 10, reward: '20% Descuento' },
        { name: 'Nivel VIP Black', req: 15, reward: 'Men\u00FA Especial Gratis' }
      ],
      promo_benefit: data.promo_benefit || 'Consumici\u00F3n de Bienvenida Gratis',
      valid_until: data.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      terms: data.terms || 'V\u00E1lido 1 canje por cliente.',
      discount_type: data.discount_type || 'percentage',
      discount_value: data.discount_value !== undefined ? data.discount_value : 20,
      coupon_code: data.coupon_code || 'VYNTA-PROMO',
      min_spend: data.min_spend || 'Sin consumo m\u00EDnimo',
      branding: data.branding || null,
      active: data.active !== undefined ? data.active : false,
      created_at: new Date().toISOString()
    };

    const inserted = db.insert('loyalty_programs', newProgram, businessId);
    auditService.log(businessId, 'PROGRAM_CREATED', `Nueva tarjeta creada: ${inserted.name} (${inserted.card_type})`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'loyalty_program',
      entityId: inserted.id
    });
    syncService.broadcast('PROGRAM_CREATED', { businessId, program: inserted });
    return inserted;
  },

  setActiveProgram(businessId, programId, actorSession) {
    const programs = db.getTable('loyalty_programs', businessId);
    programs.forEach(p => {
      db.update('loyalty_programs', p.id, { active: p.id === programId }, businessId);
    });
    auditService.log(businessId, 'PROGRAM_ACTIVATED', `Tarjeta/programa principal activado: ${programId}`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'loyalty_program',
      entityId: programId
    });
    syncService.broadcast('PROGRAM_ACTIVATED', { businessId, programId });
  },

  updateProgram(businessId, programId, updates, actorSession) {
    const updated = db.update('loyalty_programs', programId, updates, businessId);
    auditService.log(businessId, 'PROGRAM_UPDATED', `Programa de fidelizaci\u00F3n actualizado`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'loyalty_program',
      entityId: programId
    });
    syncService.broadcast('PROGRAM_UPDATED', { businessId, program: updated });
    return updated;
  },

  deleteProgram(businessId, programId, actorSession) {
    const prog = db.getById('loyalty_programs', programId, businessId);
    if (!prog) return false;

    db.delete('loyalty_programs', programId, businessId);

    const remaining = db.getTable('loyalty_programs', businessId);
    if (remaining.length > 0 && !remaining.some(p => p.active)) {
      db.update('loyalty_programs', remaining[0].id, { active: true }, businessId);
    }

    auditService.log(businessId, 'PROGRAM_DELETED', `Tarjeta eliminada: ${prog.name}`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'loyalty_program',
      entityId: programId
    });

    syncService.broadcast('PROGRAM_DELETED', { businessId, programId });
    return true;
  },

  addStamp(businessId, cardId, actorSession, amount = 1) {
    const card = db.getById('loyalty_cards', cardId, businessId) || db.getTable('loyalty_cards').find(c => c.id === cardId);
    if (!card) throw new Error('Tarjeta no encontrada');

    const bizId = businessId || card.business_id;
    const program = db.getById('loyalty_programs', card.loyalty_program_id, bizId) || this.getProgram(bizId);
    const maxStamps = program ? program.stamps_required : 10;

    const newCount = Math.min(maxStamps, (card.stamps_count || 0) + amount);
    const totalLifetime = (card.stamps_total_lifetime || 0) + amount;
    const isCompleted = newCount >= maxStamps;

    const updatedCard = db.update('loyalty_cards', card.id, {
      stamps_count: newCount,
      stamps_total_lifetime: totalLifetime,
      status: isCompleted ? 'completed' : 'active'
    }, bizId);

    const transactionId = 'st_' + generateUUID().substring(0, 8);
    const newTransaction = db.insert('stamp_transactions', {
      id: transactionId,
      business_id: bizId,
      customer_id: card.customer_id,
      card_id: card.id,
      staff_user_id: actorSession?.user_id || 'usr_staff_default',
      amount: amount,
      type: 'add',
      resulting_stamps: newCount
    }, bizId);

    const customer = db.getById('customers', card.customer_id, bizId);
    const custName = customer ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Cliente';

    auditService.log(bizId, 'STAMP_ADDED', `A\u00F1adido +${amount} sello a ${custName} (#${card.card_number}). Progreso: ${newCount}/${maxStamps}${isCompleted ? ' (\u00A1Tarjeta Completada!)' : ''}`, {
      userName: actorSession?.name || 'Staff',
      role: actorSession?.role || 'STAFF',
      entityType: 'loyalty_card',
      entityId: card.id
    });

    syncService.broadcast('STAMP_ADDED', {
      card: updatedCard,
      transaction: newTransaction
    });

    return { card: updatedCard, transaction: newTransaction, isCompleted };
  },

  removeStamp(businessId, cardId, actorSession, amount = 1) {
    const card = db.getById('loyalty_cards', cardId, businessId) || db.getTable('loyalty_cards').find(c => c.id === cardId);
    if (!card) throw new Error('Tarjeta no encontrada');

    const bizId = businessId || card.business_id;
    const program = db.getById('loyalty_programs', card.loyalty_program_id, bizId) || this.getProgram(bizId);
    const maxStamps = program ? program.stamps_required : 10;

    const newCount = Math.max(0, (card.stamps_count || 0) - amount);
    const isCompleted = newCount >= maxStamps;

    const updatedCard = db.update('loyalty_cards', card.id, {
      stamps_count: newCount,
      status: isCompleted ? 'completed' : 'active'
    }, bizId);

    const transactionId = 'st_' + generateUUID().substring(0, 8);
    const newTransaction = db.insert('stamp_transactions', {
      id: transactionId,
      business_id: bizId,
      customer_id: card.customer_id,
      card_id: card.id,
      staff_user_id: actorSession?.user_id || 'usr_staff_default',
      amount: -amount,
      type: 'remove',
      resulting_stamps: newCount
    }, bizId);

    const customer = db.getById('customers', card.customer_id, bizId);
    const custName = customer ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Cliente';

    auditService.log(bizId, 'STAMP_REMOVED', `Retirado -${amount} sello a ${custName} (#${card.card_number}). Progreso: ${newCount}/${maxStamps}`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'loyalty_card',
      entityId: card.id
    });

    syncService.broadcast('STAMP_ADDED', {
      card: updatedCard,
      transaction: newTransaction
    });

    return { card: updatedCard, transaction: newTransaction };
  },

  addPoints(businessId, cardId, actorSession, amount = 10) {
    const card = db.getById('loyalty_cards', cardId, businessId) || db.getTable('loyalty_cards').find(c => c.id === cardId);
    if (!card) throw new Error('Tarjeta no encontrada');

    const bizId = businessId || card.business_id;
    const program = db.getById('loyalty_programs', card.loyalty_program_id, bizId) || this.getProgram(bizId);
    const maxPoints = Number(program?.points_required || (program?.stamps_required ? program.stamps_required * 10 : 100));

    const currentPts = Number(card.points_count !== undefined ? card.points_count : (card.stamps_count || 0) * 10);
    const newCount = currentPts + amount;
    const totalLifetime = Number(card.points_total_lifetime !== undefined ? card.points_total_lifetime : currentPts) + amount;
    const isCompleted = newCount >= maxPoints;

    const updatedCard = db.update('loyalty_cards', card.id, {
      points_count: newCount,
      points_total_lifetime: totalLifetime,
      stamps_count: Math.floor(newCount / 10),
      status: isCompleted ? 'completed' : 'active'
    }, bizId);

    const transactionId = 'pt_' + generateUUID().substring(0, 8);
    const newTransaction = db.insert('stamp_transactions', {
      id: transactionId,
      business_id: bizId,
      customer_id: card.customer_id,
      card_id: card.id,
      staff_user_id: actorSession?.user_id || 'usr_staff_default',
      amount: amount,
      type: 'add_points',
      resulting_stamps: Math.floor(newCount / 10),
      resulting_points: newCount
    }, bizId);

    const customer = db.getById('customers', card.customer_id, bizId);
    const custName = customer ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Cliente';

    auditService.log(bizId, 'POINTS_ADDED', `A\u00F1adidos +${amount} puntos a ${custName} (#${card.card_number}). Saldo actual: ${newCount} pts${isCompleted ? ' (\u00A1Meta Alcanzada!)' : ''}`, {
      userName: actorSession?.name || 'Staff',
      role: actorSession?.role || 'STAFF',
      entityType: 'loyalty_card',
      entityId: card.id
    });

    syncService.broadcast('STAMP_ADDED', {
      card: updatedCard,
      transaction: newTransaction
    });

    return { card: updatedCard, transaction: newTransaction, isCompleted };
  },

  removePoints(businessId, cardId, actorSession, amount = 10) {
    const card = db.getById('loyalty_cards', cardId, businessId) || db.getTable('loyalty_cards').find(c => c.id === cardId);
    if (!card) throw new Error('Tarjeta no encontrada');

    const bizId = businessId || card.business_id;
    const program = db.getById('loyalty_programs', card.loyalty_program_id, bizId) || this.getProgram(bizId);
    const maxPoints = Number(program?.points_required || (program?.stamps_required ? program.stamps_required * 10 : 100));

    const currentPts = Number(card.points_count !== undefined ? card.points_count : (card.stamps_count || 0) * 10);
    const newCount = Math.max(0, currentPts - amount);
    const isCompleted = newCount >= maxPoints;

    const updatedCard = db.update('loyalty_cards', card.id, {
      points_count: newCount,
      stamps_count: Math.floor(newCount / 10),
      status: isCompleted ? 'completed' : 'active'
    }, bizId);

    const transactionId = 'pt_' + generateUUID().substring(0, 8);
    const newTransaction = db.insert('stamp_transactions', {
      id: transactionId,
      business_id: bizId,
      customer_id: card.customer_id,
      card_id: card.id,
      staff_user_id: actorSession?.user_id || 'usr_staff_default',
      amount: -amount,
      type: 'remove_points',
      resulting_stamps: Math.floor(newCount / 10),
      resulting_points: newCount
    }, bizId);

    const customer = db.getById('customers', card.customer_id, bizId);
    const custName = customer ? `${customer.first_name} ${customer.last_name || ''}`.trim() : 'Cliente';

    auditService.log(bizId, 'POINTS_REMOVED', `Retirados -${amount} puntos a ${custName} (#${card.card_number}). Saldo actual: ${newCount} pts`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'loyalty_card',
      entityId: card.id
    });

    syncService.broadcast('STAMP_ADDED', {
      card: updatedCard,
      transaction: newTransaction
    });

    return { card: updatedCard, transaction: newTransaction };
  }
};