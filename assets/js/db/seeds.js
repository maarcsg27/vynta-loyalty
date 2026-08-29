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

  const businesses = [
    {
      id: 'biz_default',
      name: 'Café & Lounge Gourmet',
      category: 'Restauración / Cafetería',
      address: 'Calle Mayor 14, Madrid',
      phone: '+34 910 000 000',
      status: 'active',
      plan: 'GROWTH',
      created_at: d(0)
    }
  ];

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

  const loyalty_programs = [
    {
      id: 'prog_default',
      business_id: 'biz_default',
      name: 'Tarjeta Loyalty Sellos',
      card_type: 'stamps',
      stamps_required: 10,
      points_required: 100,
      reward_name: 'Café Especial + Postre',
      active: true,
      branding: {
        bg_gradient_from: '#0F172A',
        bg_gradient_to: '#0F172A',
        primary_color: '#F59E0B',
        secondary_color: '#B45309',
        text_color: '#FFFFFF',
        stamp_icon: 'coffee'
      },
      created_at: d(0)
    },
    {
      id: 'prog_points',
      business_id: 'biz_default',
      name: 'Tarjeta Cliente VIP Puntos',
      card_type: 'points',
      points_required: 100,
      stamps_required: 10,
      reward_name: 'Bono Regalo 10€',
      active: false,
      branding: {
        bg_gradient_from: '#0F172A',
        bg_gradient_to: '#0F172A',
        primary_color: '#0EA5E9',
        secondary_color: '#38BDF8',
        text_color: '#FFFFFF'
      },
      created_at: d(0)
    }
  ];
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