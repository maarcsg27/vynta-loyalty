/**
 * VYNTA LOYALTY ? Multi-Tenant Storage Engine with Live Sync Support
 */
import { seedInitialData } from './seeds.js';

const STORAGE_KEY = 'vynta_loyalty_db_v3';

class StorageEngine {
  constructor() {
    this.data = null;
    this.listeners = new Map();
    this.init();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            this.data = JSON.parse(e.newValue);
            this.emit('change', this.data);
          } catch (err) {
            console.error('Storage sync error:', err);
          }
        }
      });
    }
  }

  init() {
    try {
      localStorage.removeItem('vynta_loyalty_db_v1');
      localStorage.removeItem('vynta_loyalty_db_v2');
      
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const testStr = JSON.stringify(parsed);
        if (testStr.includes('\uFFFD') || !parsed.businesses || !parsed.business_users) {
          this.data = seedInitialData();
          this.save(false);
        } else {
          parsed.campaigns = parsed.campaigns || [];
          parsed.single_use_cards = parsed.single_use_cards || [];
          this.data = parsed;
        }
      } else {
        this.data = seedInitialData();
        this.save(false);
      }
    } catch (e) {
      console.warn('Error loading VYNTA db from localStorage, re-seeding:', e);
      this.data = seedInitialData();
      this.save(false);
    }
  }

  save(shouldEmit = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      if (shouldEmit) {
        this.emit('change', this.data);
      }
    } catch (e) {
      console.error('Error saving VYNTA db:', e);
    }
  }

  reset() {
    this.data = seedInitialData();
    this.save(true);
    this.emit('reset', this.data);
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try { cb(payload); } catch (e) { console.error(e); }
      });
    }
  }

  getTable(tableName, tenantId = null) {
    const table = this.data[tableName] || [];
    if (!tenantId) return [...table];
    return table.filter(item => item.business_id === tenantId);
  }

  getById(tableName, id, tenantId = null) {
    const table = this.getTable(tableName, tenantId);
    return table.find(item => item.id === id) || null;
  }

  insert(tableName, item, tenantId = null) {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
    }

    if (tenantId && !item.business_id && tableName !== 'businesses') {
      item.business_id = tenantId;
    }

    const now = new Date().toISOString();
    const newRecord = {
      ...item,
      created_at: item.created_at || now,
      updated_at: now
    };

    this.data[tableName].unshift(newRecord);
    this.save(true);
    return newRecord;
  }

  rawInsert(tableName, item) {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
    }
    const idx = this.data[tableName].findIndex(i => i.id === item.id);
    if (idx >= 0) {
      this.data[tableName][idx] = { ...this.data[tableName][idx], ...item };
    } else {
      this.data[tableName].unshift(item);
    }
    this.emit('change', this.data);
  }

  rawUpdate(tableName, id, updates, tenantId = null) {
    const table = this.data[tableName] || [];
    const index = table.findIndex(item => item.id === id && (!tenantId || item.business_id === tenantId));
    if (index !== -1) {
      this.data[tableName][index] = { ...this.data[tableName][index], ...updates };
      this.emit('change', this.data);
    }
  }

  update(tableName, id, updates, tenantId = null) {
    const table = this.data[tableName] || [];
    const index = table.findIndex(item => item.id === id && (!tenantId || item.business_id === tenantId));
    if (index === -1) {
      throw new Error(`Record with ID ${id} not found in ${tableName}`);
    }

    const updatedRecord = {
      ...table[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.data[tableName][index] = updatedRecord;
    this.save(true);
    return updatedRecord;
  }

  delete(tableName, id, tenantId = null) {
    const table = this.data[tableName] || [];
    const index = table.findIndex(item => item.id === id && (!tenantId || item.business_id === tenantId));
    if (index === -1) {
      return false;
    }

    this.data[tableName].splice(index, 1);
    this.save(true);
    return true;
  }

  getFullState() {
    return JSON.parse(JSON.stringify(this.data));
  }

  mergeRemoteData(remoteData) {
    if (!remoteData || typeof remoteData !== 'object') return false;

    const tables = [
      'businesses',
      'business_users',
      'loyalty_programs',
      'rewards',
      'customers',
      'loyalty_cards',
      'stamp_transactions',
      'redemptions',
      'coupons',
      'campaigns',
      'single_use_cards',
      'activity_logs'
    ];

    let hasChanges = false;

    tables.forEach(table => {
      if (Array.isArray(remoteData[table])) {
        if (!this.data[table]) this.data[table] = [];

        remoteData[table].forEach(remoteItem => {
          if (!remoteItem || !remoteItem.id) return;
          const idx = this.data[table].findIndex(localItem => localItem.id === remoteItem.id);
          if (idx === -1) {
            this.data[table].push(remoteItem);
            hasChanges = true;
          } else {
            const localUpdated = new Date(this.data[table][idx].updated_at || this.data[table][idx].created_at || 0).getTime();
            const remoteUpdated = new Date(remoteItem.updated_at || remoteItem.created_at || 0).getTime();
            if (remoteUpdated > localUpdated) {
              this.data[table][idx] = { ...this.data[table][idx], ...remoteItem };
              hasChanges = true;
            }
          }
        });
      }
    });

    if (hasChanges) {
      this.save(true);
    }
    return hasChanges;
  }
}

export const db = new StorageEngine();