/**
 * VYNTA LOYALTY ? Single-Use Coupons Service
 */
import { db } from '../db/storage.js';
import { auditService } from './auditService.js';
import { syncService } from './syncService.js';
import { generateUUID } from '../db/schema.js';

export const couponService = {
  getAll(businessId) {
    return db.getTable('coupons', businessId);
  },

  getByCode(code, businessId = null) {
    const cleanCode = code.trim().toUpperCase();
    const coupons = db.getTable('coupons', businessId);
    return coupons.find(c => c.code.toUpperCase() === cleanCode) || null;
  },

  create(businessId, couponData, actorSession) {
    const code = (couponData.code || ('CPN-' + Math.random().toString(36).substring(2, 8))).toUpperCase();
    
    if (this.getByCode(code, businessId)) {
      throw new Error(`El c\u00F3digo de cup\u00F3n ${code} ya existe.`);
    }

    const expiresAt = couponData.expires_at || new Date(Date.now() + 30*24*60*60*1000).toISOString();

    const newCpn = db.insert('coupons', {
      id: 'cpn_' + generateUUID().substring(0, 8),
      business_id: businessId,
      customer_id: couponData.customer_id || null,
      code: code,
      title: couponData.title,
      discount_type: couponData.discount_type || 'percentage',
      discount_value: parseFloat(couponData.discount_value) || 0,
      expires_at: expiresAt,
      status: 'available'
    }, businessId);

    auditService.log(businessId, 'COUPON_CREATED', `Cup\u00F3n creado: ${newCpn.code} (${newCpn.title})`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'coupon',
      entityId: newCpn.id
    });

    return newCpn;
  },

  redeem(code, businessId, actorSession) {
    const coupon = this.getByCode(code, businessId);
    if (!coupon) {
      throw new Error('Cup\u00F3n no encontrado en este negocio.');
    }

    if (coupon.status === 'redeemed') {
      throw new Error(`Este cup\u00F3n ya fue canjeado previamente el ${new Date(coupon.redeemed_at).toLocaleString('es-ES')}.`);
    }

    if (coupon.status === 'expired' || new Date(coupon.expires_at) < new Date()) {
      throw new Error('Este cup\u00F3n ha caducado.');
    }

    const updated = db.update('coupons', coupon.id, {
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
      redeemed_by: actorSession?.name || 'Staff'
    }, businessId);

    auditService.log(businessId, 'COUPON_REDEEMED', `Cup\u00F3n ${coupon.code} canjeado con \u00E9xito (${coupon.title})`, {
      userName: actorSession?.name || 'Staff',
      role: actorSession?.role || 'STAFF',
      entityType: 'coupon',
      entityId: coupon.id
    });

    syncService.broadcast('COUPON_REDEEMED', { coupon: updated });
    return updated;
  },

  delete(businessId, couponId, actorSession) {
    const coupon = db.getById('coupons', couponId, businessId);
    if (!coupon) return false;

    db.delete('coupons', couponId, businessId);

    auditService.log(businessId, 'COUPON_DELETED', `Cup\u00F3n eliminado: ${coupon.code} (${coupon.title})`, {
      userName: actorSession?.name || 'Admin',
      role: actorSession?.role || 'BUSINESS_OWNER',
      entityType: 'coupon',
      entityId: couponId
    });

    syncService.broadcast('COUPON_DELETED', { businessId, couponId });
    return true;
  }
};