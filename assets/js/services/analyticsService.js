/**
 * VYNTA LOYALTY ? Analytics & KPI Calculation Service
 */
import { db } from '../db/storage.js';

export const analyticsService = {
  getGlobalStats() {
    const businesses = db.getTable('businesses');
    const customers = db.getTable('customers');
    const cards = db.getTable('loyalty_cards');
    const transactions = db.getTable('stamp_transactions');
    const redemptions = db.getTable('redemptions');
    const coupons = db.getTable('coupons');

    const activeBusinesses = businesses.filter(b => b.status === 'active').length;
    const totalStamps = transactions.filter(t => t.type === 'add').reduce((acc, t) => acc + (t.amount || 1), 0);
    const completedCards = cards.filter(c => c.status === 'completed').length;
    const totalRedemptions = redemptions.length;

    return {
      activeBusinesses,
      totalBusinesses: businesses.length,
      totalCustomers: customers.length,
      totalCards: cards.length,
      totalStamps,
      completedCards,
      totalRedemptions,
      totalCoupons: coupons.length,
      couponsRedeemed: coupons.filter(c => c.status === 'redeemed').length,
      retentionRate: customers.length > 0 ? Math.round((cards.filter(c => c.stamps_count > 1).length / customers.length) * 100) : 0,
      businessesData: businesses.map(b => {
        const bizCusts = customers.filter(c => c.business_id === b.id);
        const bizCards = cards.filter(c => c.business_id === b.id);
        const bizStamps = transactions.filter(t => t.business_id === b.id && t.type === 'add').length;
        const bizReds = redemptions.filter(r => r.business_id === b.id).length;
        return {
          ...b,
          customerCount: bizCusts.length,
          cardCount: bizCards.length,
          stampCount: bizStamps,
          redemptionCount: bizReds
        };
      })
    };
  },

  getBusinessStats(businessId, period = 'all') {
    const customers = db.getTable('customers', businessId);
    const cards = db.getTable('loyalty_cards', businessId);
    const transactions = db.getTable('stamp_transactions', businessId);
    const redemptions = db.getTable('redemptions', businessId);
    const coupons = db.getTable('coupons', businessId);
    const program = db.getTable('loyalty_programs', businessId)[0];
    const maxStamps = program ? program.stamps_required : 10;

    const totalStamps = transactions.filter(t => t.type === 'add').reduce((acc, t) => acc + (t.amount || 1), 0);
    const activeCards = cards.filter(c => c.status === 'active').length;
    const completedCards = cards.filter(c => c.status === 'completed' || c.stamps_count >= maxStamps).length;
    const avgStampsPerCustomer = customers.length > 0 ? (totalStamps / customers.length).toFixed(1) : 0;
    const redemptionRate = (completedCards + redemptions.length) > 0 
      ? Math.round((redemptions.length / (completedCards + redemptions.length)) * 100) 
      : 0;

    const days = [];
    const dailyStamps = [];
    const dailyNewCustomers = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      days.push(dayLabel);

      const stampsToday = transactions.filter(t => t.created_at.startsWith(dateStr) && t.type === 'add').length;
      dailyStamps.push(stampsToday);

      const custsToday = customers.filter(c => c.created_at.startsWith(dateStr)).length;
      dailyNewCustomers.push(custsToday);
    }

    return {
      totalCustomers: customers.length,
      activeCards,
      completedCards,
      totalStamps,
      avgStampsPerCustomer,
      totalRedemptions: redemptions.length,
      redemptionRate,
      totalCoupons: coupons.length,
      couponsRedeemed: coupons.filter(c => c.status === 'redeemed').length,
      chartDays: days,
      chartDailyStamps: dailyStamps,
      chartDailyCustomers: dailyNewCustomers
    };
  }
};