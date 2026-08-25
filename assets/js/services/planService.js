/**
 * VYNTA LOYALTY ? Plan Entitlements & Subscription Management Service
 */
import { db } from '../db/storage.js';
import { Plans } from '../db/schema.js';

export const Features = {
  BUSINESS_MANAGEMENT: 'BUSINESS_MANAGEMENT',
  LOYALTY_CARD: 'LOYALTY_CARD',
  LOYALTY_CUSTOMIZATION: 'LOYALTY_CUSTOMIZATION',
  POINTS_ACCUMULATION: 'POINTS_ACCUMULATION',
  REWARDS: 'REWARDS',
  REWARDS_REDEMPTION: 'REWARDS_REDEMPTION',
  POINTS_HISTORY: 'POINTS_HISTORY',
  COUPONS: 'COUPONS',
  COUPONS_CUSTOMIZATION: 'COUPONS_CUSTOMIZATION',
  SINGLE_USE_CARDS: 'SINGLE_USE_CARDS',
  MARKETING_CAMPAIGNS: 'MARKETING_CAMPAIGNS',
  SINGLE_USE_REDEMPTION: 'SINGLE_USE_REDEMPTION'
};

const PLAN_DEFINITIONS = {
  [Plans.BASIC]: {
    id: Plans.BASIC,
    name: 'BASIC',
    label: 'Plan Basic',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    color: '#94A3B8',
    price: '19\u20AC/mes',
    description: 'Tarjeta de fidelizaci\u00F3n digital con acumulaci\u00F3n de sellos/puntos y recompensas.',
    features: [
      Features.BUSINESS_MANAGEMENT,
      Features.LOYALTY_CARD,
      Features.LOYALTY_CUSTOMIZATION,
      Features.POINTS_ACCUMULATION,
      Features.REWARDS,
      Features.REWARDS_REDEMPTION,
      Features.POINTS_HISTORY
    ]
  },
  [Plans.PRO]: {
    id: Plans.PRO,
    name: 'PRO',
    label: 'Plan Pro',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    color: '#0EA5E9',
    price: '49\u20AC/mes',
    description: 'Todo lo de Basic + Cupones promocionales + Tarjetas de Un Solo Uso para captaci\u00F3n.',
    features: [
      Features.BUSINESS_MANAGEMENT,
      Features.LOYALTY_CARD,
      Features.LOYALTY_CUSTOMIZATION,
      Features.POINTS_ACCUMULATION,
      Features.REWARDS,
      Features.REWARDS_REDEMPTION,
      Features.POINTS_HISTORY,
      Features.COUPONS,
      Features.COUPONS_CUSTOMIZATION,
      Features.SINGLE_USE_CARDS,
      Features.MARKETING_CAMPAIGNS,
      Features.SINGLE_USE_REDEMPTION
    ]
  },
  [Plans.ENTERPRISE]: {
    id: Plans.ENTERPRISE,
    name: 'ENTERPRISE',
    label: 'Plan Enterprise',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    color: '#A855F7',
    price: 'Personalizado',
    description: 'Capacidades Pro con arquitectura extensible lista para integraciones y gran volumen.',
    features: [
      Features.BUSINESS_MANAGEMENT,
      Features.LOYALTY_CARD,
      Features.LOYALTY_CUSTOMIZATION,
      Features.POINTS_ACCUMULATION,
      Features.REWARDS,
      Features.REWARDS_REDEMPTION,
      Features.POINTS_HISTORY,
      Features.COUPONS,
      Features.COUPONS_CUSTOMIZATION,
      Features.SINGLE_USE_CARDS,
      Features.MARKETING_CAMPAIGNS,
      Features.SINGLE_USE_REDEMPTION
    ]
  }
};

export const planService = {
  getPlans() {
    return Plans;
  },

  getFeatures() {
    return Features;
  },

  getPlanDetails(planKey) {
    const key = (planKey || Plans.BASIC).toUpperCase();
    return PLAN_DEFINITIONS[key] || PLAN_DEFINITIONS[Plans.BASIC];
  },

  getBusinessPlan(businessId) {
    if (!businessId) return PLAN_DEFINITIONS[Plans.BASIC];
    const biz = db.getById('businesses', businessId);
    const planKey = (biz?.plan || Plans.BASIC).toUpperCase();
    return PLAN_DEFINITIONS[planKey] || PLAN_DEFINITIONS[Plans.BASIC];
  },

  canAccessFeature(businessOrPlan, feature) {
    if (!feature) return true;
    let planKey = Plans.BASIC;

    if (typeof businessOrPlan === 'string') {
      planKey = businessOrPlan.toUpperCase();
    } else if (businessOrPlan && typeof businessOrPlan === 'object') {
      planKey = (businessOrPlan.plan || Plans.BASIC).toUpperCase();
    }

    const planDef = PLAN_DEFINITIONS[planKey] || PLAN_DEFINITIONS[Plans.BASIC];
    return planDef.features.includes(feature);
  },

  assertCanAccess(businessId, feature, actorSession = null) {
    const plan = this.getBusinessPlan(businessId);
    if (!this.canAccessFeature(plan.id, feature)) {
      throw new Error(`Esta funcionalidad requiere el Plan PRO o superior. Plan actual del negocio: ${plan.name}.`);
    }
    return true;
  },

  getPlanMatrix() {
    return Object.values(PLAN_DEFINITIONS);
  }
};
