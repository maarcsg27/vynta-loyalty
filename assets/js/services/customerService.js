/**
 * VYNTA LOYALTY ? Customer & Loyalty Card Service
 */
import { db } from '../db/storage.js';
import { auditService } from './auditService.js';
import { syncService } from './syncService.js';
import { generateUUID, generateSecureToken } from '../db/schema.js';

export const customerService = {
  getAll(businessId) {
    return db.getTable('customers', businessId);
  },

  getById(businessId, customerId) {
    const custs = db.getTable('customers');
    return custs.find(c => c.id === customerId && (!businessId || c.business_id === businessId)) || custs.find(c => c.id === customerId) || null;
  },

  getCardByCustomerId(businessId, customerId) {
    const cards = db.getTable('loyalty_cards');
    let card = cards.find(c => c.customer_id === customerId);

    // Auto heal/create if customer exists without card
    if (!card && customerId) {
      const customer = this.getById(businessId, customerId);
      if (customer) {
        const bizId = businessId || customer.business_id || 'biz_cafe';
        const programs = db.getTable('loyalty_programs', bizId);
        const activeProgram = programs.find(p => p.active) || programs[0];
        const token = generateSecureToken(`vyn_${customer.first_name.toLowerCase().replace(/[^a-z]/g, '')}`);
        const cardNumSeq = (cards.length + 1).toString().padStart(5, '0');
        const cardPrefix = bizId.replace('biz_', '').toUpperCase().substring(0, 2);

        card = db.insert('loyalty_cards', {
          id: 'card_' + generateUUID().substring(0, 8),
          business_id: bizId,
          customer_id: customerId,
          loyalty_program_id: activeProgram ? activeProgram.id : null,
          secure_token: token,
          card_number: `${cardPrefix}-${cardNumSeq}`,
          stamps_count: 0,
          stamps_total_lifetime: 0,
          rewards_redeemed_count: 0,
          status: 'active'
        }, bizId);

        syncService.broadcast('CUSTOMER_CREATED', { customer, card });
      }
    }
    return card || null;
  },

  getCardByToken(token) {
    if (!token || token === 'undefined' || token === 'null') return null;
    const clean = decodeURIComponent(token).trim();
    const cards = db.getTable('loyalty_cards');

    // 1. Direct match by secure token
    let found = cards.find(c => c.secure_token === clean);
    if (found) return found;

    // 2. Match by card_number (e.g. CA-00004 or CC-00109)
    found = cards.find(c => c.card_number && c.card_number.toUpperCase() === clean.toUpperCase());
    if (found) return found;

    // 3. Match by card id (card_...)
    found = cards.find(c => c.id === clean);
    if (found) return found;

    // 4. Match by customer id (cust_...)
    found = cards.find(c => c.customer_id === clean);
    if (found) return found;

    // 5. Match by partial token substring
    found = cards.find(c => c.secure_token && c.secure_token.includes(clean));
    if (found) return found;

    // 6. Match by customer phone or name
    const custs = db.getTable('customers');
    const cust = custs.find(c => (c.phone && c.phone.includes(clean)) || (c.first_name && c.first_name.toLowerCase() === clean.toLowerCase()));
    if (cust) {
      return this.getCardByCustomerId(cust.business_id, cust.id);
    }

    return null;
  },

  create(businessId, customerData, actorSession) {
    const firstName = (customerData.first_name || 'Cliente').trim();
    const lastName = (customerData.last_name || '').trim();
    const email = (customerData.email || `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}@cliente.com`).trim();
    const phone = (customerData.phone || '+34 600 000 000').trim();

    // Check if customer with the same phone or email already exists in this business to prevent duplicates
    const existingCustomers = db.getTable('customers', businessId);
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const foundCust = existingCustomers.find(c => {
      const cPhone = (c.phone || '').replace(/[^0-9+]/g, '');
      return (cleanPhone.length > 5 && cPhone === cleanPhone) || (email && c.email && c.email.toLowerCase() === email.toLowerCase());
    });

    if (foundCust) {
      const existingCard = this.getCardByCustomerId(businessId, foundCust.id);
      if (existingCard) {
        return { customer: foundCust, card: existingCard, isExisting: true };
      }
    }

    const customerId = 'cust_' + generateUUID().substring(0, 8);
    const newCustomer = db.insert('customers', {
      id: customerId,
      business_id: businessId,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      status: 'active'
    }, businessId);

    const programs = db.getTable('loyalty_programs', businessId);
    const activeProgram = programs.find(p => p.active) || programs[0];

    const token = generateSecureToken(`vyn_${firstName.toLowerCase().replace(/[^a-z]/g, '')}`);
    const allCards = db.getTable('loyalty_cards');
    const cardNumSeq = (allCards.length + 1).toString().padStart(5, '0');
    const cardPrefix = (businessId || 'VN').replace('biz_', '').toUpperCase().substring(0, 2);

    const newCard = db.insert('loyalty_cards', {
      id: 'card_' + generateUUID().substring(0, 8),
      business_id: businessId,
      customer_id: customerId,
      loyalty_program_id: activeProgram ? activeProgram.id : null,
      secure_token: token,
      card_number: `${cardPrefix}-${cardNumSeq}`,
      stamps_count: 0,
      stamps_total_lifetime: 0,
      rewards_redeemed_count: 0,
      status: 'active'
    }, businessId);

    auditService.log(businessId, 'CUSTOMER_CREATED', `Cliente registrado: ${newCustomer.first_name} ${newCustomer.last_name} (Tarjeta #${newCard.card_number})`, {
      userName: actorSession?.name || 'Registro QR',
      role: actorSession?.role || 'CUSTOMER',
      entityType: 'customer',
      entityId: customerId
    });

    // Broadcast across all connected devices in real time
    syncService.broadcast('CUSTOMER_CREATED', {
      customer: newCustomer,
      card: newCard
    });

    return { customer: newCustomer, card: newCard, isExisting: false };
  },

  update(businessId, customerId, updates, actorSession) {
    const updated = db.update('customers', customerId, updates, businessId);
    auditService.log(businessId, 'CUSTOMER_UPDATED', `Cliente actualizado: ${updated.first_name} ${updated.last_name}`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'customer',
      entityId: customerId
    });
    return updated;
  },

  delete(businessId, customerId, actorSession) {
    const cust = this.getById(businessId, customerId);
    if (!cust) return false;

    const card = this.getCardByCustomerId(businessId, customerId);
    if (card) {
      db.delete('loyalty_cards', card.id, businessId);
    }

    db.delete('customers', customerId, businessId);

    auditService.log(businessId, 'CUSTOMER_DELETED', `Cliente eliminado: ${cust.first_name} ${cust.last_name}`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'customer',
      entityId: customerId
    });
    return true;
  }
};