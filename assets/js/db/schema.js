/**
 * VYNTA LOYALTY ? Data Model & Schema Definitions
 */

export const Roles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BUSINESS_OWNER: 'BUSINESS_OWNER',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER'
};

export const BusinessStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive'
};

export const CardStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SUSPENDED: 'suspended'
};

export const CouponStatus = {
  AVAILABLE: 'available',
  REDEEMED: 'redeemed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

export const RewardStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

export const Plans = {
  BASIC: 'BASIC',
  PRO: 'PRO',
  ENTERPRISE: 'ENTERPRISE'
};

export const CardTypes = {
  LOYALTY: 'LOYALTY',
  COUPON: 'COUPON',
  SINGLE_USE: 'SINGLE_USE'
};

export const SingleUseStatus = {
  ACTIVE: 'ACTIVE',
  USED: 'USED',
  EXPIRED: 'EXPIRED',
  DISABLED: 'DISABLED'
};

export const StampTransactionType = {
  ADD: 'add',
  REMOVE: 'remove',
  RESET: 'reset',
  REDEEM: 'redeem'
};

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateSecureToken(prefix = 'vyn') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${token}`;
}