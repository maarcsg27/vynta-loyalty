/**
 * VYNTA LOYALTY ? Clean Seed Data Generator
 * Configured with 0 demo clients / users, keeping only the Super Admin account.
 */

export function seedInitialData() {
  const now = new Date();
  const d = (daysAgo, hoursAgo = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(date.getHours() - hoursAgo);
    return date.toISOString();
  };

  const businesses = [];

  const business_users = [
    {
      id: 'usr_super',
      business_id: null,
      name: 'Administrador Global VYNTA',
      email: 'admin@vynta.com',
      password: 'admin123',
      role: 'SUPER_ADMIN',
      status: 'active',
      created_at: d(0)
    }
  ];

  const loyalty_programs = [];
  const rewards = [];
  const customers = [];
  const loyalty_cards = [];
  const stamp_transactions = [];
  const redemptions = [];
  const coupons = [];
  const campaigns = [];
  const single_use_cards = [];
  const activity_logs = [
    {
      id: 'act_init',
      business_id: null,
      user_name: 'Sistema VYNTA',
      role: 'SUPER_ADMIN',
      action: 'SYSTEM_INIT',
      entity_type: 'platform',
      entity_id: 'vynta_core',
      description: 'Plataforma VYNTA iniciada. Super Admin activo y listo para registrar comercios.',
      created_at: d(0)
    }
  ];

  return {
    businesses,
    business_users,
    loyalty_programs,
    rewards,
    customers,
    loyalty_cards,
    stamp_transactions,
    redemptions,
    coupons,
    campaigns,
    single_use_cards,
    activity_logs
  };
}