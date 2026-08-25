/**
 * VYNTA LOYALTY ? Business & Tenant Service
 */
import { db } from '../db/storage.js';
import { auditService } from './auditService.js';
import { syncService } from './syncService.js';
import { emailService } from './emailService.js';
import { generateUUID } from '../db/schema.js';

export const businessService = {
  getAll() {
    return db.getTable('businesses');
  },

  getById(id) {
    return db.getById('businesses', id);
  },

  create(businessData, actorSession) {
    const id = 'biz_' + businessData.name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15) + '_' + Math.floor(Math.random()*1000);
    const staffPin = businessData.staff_pin || '1234';
    const ownerPassword = businessData.password || 'admin123';

    const newBiz = db.insert('businesses', {
      id: id,
      name: businessData.name,
      legal_name: businessData.legal_name || businessData.name,
      tax_id: businessData.tax_id || 'B-00000000',
      email: businessData.email,
      phone: businessData.phone || '',
      address: businessData.address || '',
      logo_url: businessData.logo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=128&auto=format&fit=crop&q=80',
      status: businessData.status || 'active',
      plan: businessData.plan || 'PRO',
      settings: {
        max_stamps_per_day: 2,
        enable_coupons: true,
        allow_manual_pin: true,
        staff_pin: staffPin
      },
      branding: {
        primary_color: businessData.primary_color || '#0EA5E9',
        secondary_color: businessData.secondary_color || '#0369A1',
        bg_gradient_from: '#0F172A',
        bg_gradient_to: '#020617',
        text_color: '#FFFFFF',
        stamp_icon: businessData.stamp_icon || 'star',
        border_radius: '24px',
        card_style: 'modern_dark'
      }
    });

    // Create Business Owner Account
    db.insert('business_users', {
      id: 'usr_owner_' + id,
      business_id: id,
      name: `Due\u00F1o (${newBiz.name})`,
      email: newBiz.email,
      password: ownerPassword,
      role: 'BUSINESS_OWNER',
      status: 'active'
    });

    const program = db.insert('loyalty_programs', {
      id: 'prog_' + id,
      business_id: id,
      name: `Programa Fidelidad ${newBiz.name}`,
      description: `Completa tu tarjeta de sellos y obt\u00E9n tu recompensa exclusiva.`,
      stamps_required: 10,
      reward_name: 'Regalo Exclusivo',
      reward_description: 'Recompensa de agradecimiento por tu fidelidad.',
      active: true
    }, id);

    const reward = db.insert('rewards', {
      id: 'rew_' + id + '_1',
      business_id: id,
      loyalty_program_id: 'prog_' + id,
      name: 'Regalo Exclusivo',
      description: 'Recompensa al completar los sellos.',
      required_stamps: 10,
      status: 'active'
    }, id);

    db.insert('business_users', {
      id: 'usr_owner_' + id,
      business_id: id,
      name: `Dueño (${newBiz.name})`,
      email: newBiz.email,
      password: 'admin123',
      role: 'BUSINESS_OWNER'
    }, id);

    auditService.log(id, 'BUSINESS_CREATED', `Nuevo negocio creado: ${newBiz.name}`, {
      userName: actorSession?.name || 'Admin VYNTA',
      role: actorSession?.role || 'SUPER_ADMIN',
      entityType: 'business',
      entityId: id
    });

    // Send access credentials to registered business email
    emailService.sendWelcomeCredentials({
      business: newBiz,
      ownerEmail: newBiz.email,
      password: ownerPassword,
      staffPin: staffPin
    });

    syncService.broadcast('BUSINESS_CREATED', {
      business: newBiz,
      program,
      reward
    });

    return newBiz;
  },

  update(id, updates, actorSession) {
    const updated = db.update('businesses', id, updates);
    auditService.log(id, 'BUSINESS_UPDATED', `Negocio actualizado: ${updated.name}`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'business',
      entityId: id
    });

    syncService.broadcast('BUSINESS_UPDATED', {
      businessId: id,
      updates
    });

    return updated;
  },

  updateBranding(id, brandingUpdates, actorSession) {
    const biz = this.getById(id);
    if (!biz) throw new Error('Negocio no encontrado');

    const updated = db.update('businesses', id, {
      branding: {
        ...biz.branding,
        ...brandingUpdates
      }
    });

    auditService.log(id, 'BRANDING_UPDATED', `Dise\u00F1o de tarjeta actualizado para ${biz.name}`, {
      userName: actorSession?.name || 'Owner',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'branding',
      entityId: id
    });

    syncService.broadcast('BRANDING_UPDATED', {
      businessId: id,
      branding: updated.branding
    });

    return updated;
  },

  updateSettings(id, settingsUpdates, actorSession) {
    const biz = this.getById(id);
    if (!biz) throw new Error('Negocio no encontrado');

    const updated = db.update('businesses', id, {
      settings: {
        ...biz.settings,
        ...settingsUpdates
      }
    });

    auditService.log(id, 'SETTINGS_UPDATED', `Configuraci\u00F3n actualizada para ${biz.name}`, {
      userName: actorSession?.name || 'Owner',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'settings',
      entityId: id
    });

    syncService.broadcast('BUSINESS_UPDATED', {
      businessId: id,
      updates: { settings: updated.settings }
    });

    return updated;
  },

  updatePlan(id, newPlan, actorSession) {
    const biz = this.getById(id);
    if (!biz) throw new Error('Negocio no encontrado');

    const cleanPlan = (newPlan || 'BASIC').toUpperCase();
    const updated = db.update('businesses', id, { plan: cleanPlan });

    auditService.log(id, 'PLAN_CHANGED', `Plan de suscripci\u00F3n cambiado a ${cleanPlan} para ${biz.name}`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'business',
      entityId: id
    });

    syncService.broadcast('PLAN_CHANGED', {
      businessId: id,
      plan: cleanPlan
    });

    return updated;
  },

  delete(id, actorSession) {
    const biz = this.getById(id);
    if (!biz) throw new Error('Negocio no encontrado');

    const bizName = biz.name;

    // Delete business and associated entities from DB
    db.delete('businesses', id);
    
    // Also remove related records for this business
    ['business_users', 'loyalty_programs', 'rewards', 'customers', 'loyalty_cards', 'stamp_transactions', 'redemptions', 'coupons', 'campaigns', 'single_use_cards'].forEach(table => {
      const items = db.getTable(table, id);
      items.forEach(item => {
        db.delete(table, item.id, id);
      });
    });

    auditService.log(id, 'BUSINESS_DELETED', `Negocio eliminado: ${bizName}`, {
      userName: actorSession?.name || 'Admin VYNTA',
      role: actorSession?.role || 'SUPER_ADMIN',
      entityType: 'business',
      entityId: id
    });

    syncService.broadcast('BUSINESS_DELETED', { businessId: id });

    return true;
  }
};