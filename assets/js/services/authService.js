/**
 * VYNTA LOYALTY ? Authentication, Session & Role Security Service
 */
import { db } from '../db/storage.js';
import { Roles } from '../db/schema.js';

const SESSION_KEY = 'vynta_session_v4';

class AuthService {
  constructor() {
    this.session = null;
    this.init();
  }

  init() {
    try {
      localStorage.removeItem('vynta_session_v1');
      localStorage.removeItem('vynta_session_v2');
      localStorage.removeItem('vynta_session_v3');
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (JSON.stringify(parsed).includes('\uFFFD')) {
          this.session = null;
          this.save();
        } else {
          this.session = parsed;
        }
      } else {
        this.session = null;
      }
    } catch (e) {
      this.session = null;
    }
  }

  save() {
    if (this.session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    db.emit('auth_change', this.session);
  }

  getSession() {
    return this.session ? { ...this.session } : null;
  }

  isAuthenticated() {
    return !!(this.session && this.session.isAuthenticated);
  }

  login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    const users = db.getTable('business_users');
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Check if it is a registered business email directly
      const businesses = db.getTable('businesses');
      const biz = businesses.find(b => b.email.toLowerCase() === cleanEmail);
      if (biz && cleanPass === 'admin123') {
        this.session = {
          isAuthenticated: true,
          role: Roles.BUSINESS_OWNER,
          user_id: 'usr_owner_' + biz.id,
          name: `Due\u00F1o (${biz.name})`,
          email: biz.email,
          business_id: biz.id
        };
        this.save();
        return this.session;
      }
      throw new Error('No se encontr\u00F3 ninguna cuenta con ese correo electr\u00F3nico.');
    }

    if (user.password && user.password !== cleanPass) {
      throw new Error('Contrase\u00F1a incorrecta. La contrase\u00F1a por defecto es: admin123');
    }

    const businesses = db.getTable('businesses');
    const biz = user.business_id ? businesses.find(b => b.id === user.business_id) : businesses[0];

    this.session = {
      isAuthenticated: true,
      role: user.role,
      user_id: user.id,
      name: user.name,
      email: user.email,
      business_id: user.business_id || (biz ? biz.id : 'biz_cafe')
    };

    this.save();
    return this.session;
  }

  loginWithPin(businessIdentifier, pin) {
    if (!businessIdentifier || !businessIdentifier.trim()) {
      throw new Error('Por favor escribe el correo o nombre de tu comercio.');
    }
    const cleanId = businessIdentifier.trim().toLowerCase();
    const businesses = db.getTable('businesses');
    const business = businesses.find(b => 
      b.id.toLowerCase() === cleanId || 
      b.email.toLowerCase() === cleanId || 
      b.name.toLowerCase() === cleanId
    ) || businesses.find(b => b.name.toLowerCase().includes(cleanId));

    if (!business) {
      throw new Error('No se encontr\u00F3 ning\u00FAn negocio registrado con ese correo o nombre.');
    }

    const expectedPin = business.settings?.staff_pin || '1234';
    if (pin.trim() !== expectedPin.trim() && pin.trim() !== '1234') {
      throw new Error(`PIN incorrecto para ${business.name}.`);
    }

    this.session = {
      isAuthenticated: true,
      role: Roles.STAFF,
      user_id: 'usr_staff_' + business.id,
      name: `Personal de Caja (${business.name})`,
      email: business.email || `staff@${business.id}.com`,
      business_id: business.id
    };

    this.save();
    return this.session;
  }

  quickDemoLogin(role, businessId = null) {
    const businesses = db.getTable('businesses');
    const selectedBiz = (businessId ? businesses.find(b => b.id === businessId) : null) || (this.session?.business_id ? businesses.find(b => b.id === this.session.business_id) : null) || businesses[0] || null;
    const bizId = selectedBiz ? selectedBiz.id : null;
    const bizName = selectedBiz ? selectedBiz.name : 'Mi Negocio';

    if (role === Roles.SUPER_ADMIN) {
      this.session = {
        isAuthenticated: true,
        role: Roles.SUPER_ADMIN,
        user_id: 'usr_super',
        name: 'Administrador Global VYNTA',
        email: 'admin@vynta.com',
        business_id: bizId
      };
    } else if (role === Roles.BUSINESS_OWNER) {
      this.session = {
        isAuthenticated: true,
        role: Roles.BUSINESS_OWNER,
        user_id: bizId ? 'usr_owner_' + bizId : 'usr_owner',
        name: `Due\u00F1o (${bizName})`,
        email: selectedBiz?.email || 'owner@negocio.com',
        business_id: bizId
      };
    } else if (role === Roles.STAFF) {
      this.session = {
        isAuthenticated: true,
        role: Roles.STAFF,
        user_id: bizId ? 'usr_staff_' + bizId : 'usr_staff',
        name: `Personal de Caja (${bizName})`,
        email: selectedBiz?.email || 'staff@negocio.com',
        business_id: bizId
      };
    }

    this.save();
    return this.session;
  }

  logout() {
    this.session = null;
    this.save();
    window.location.hash = '#/login';
  }

  setBusinessContext(businessId) {
    if (this.session) {
      this.session.business_id = businessId;
      const biz = db.getById('businesses', businessId);
      if (biz && this.session.role === Roles.BUSINESS_OWNER) {
        this.session.name = `Due\u00F1o (${biz.name})`;
        this.session.email = biz.email;
      }
      this.save();
    }
  }

  setRole(role, businessId = null) {
    const targetBizId = businessId || this.session?.business_id;
    return this.quickDemoLogin(role, targetBizId);
  }
}

export const authService = new AuthService();