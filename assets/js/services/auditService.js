/**
 * VYNTA LOYALTY ? Audit & Global Activity Log Service (with Cloud Sync)
 */
import { db } from '../db/storage.js';
import { syncService } from './syncService.js';
import { generateUUID } from '../db/schema.js';

export const auditService = {
  log(businessId, action, description, { userName = 'Sistema', role = 'SYSTEM', entityType = null, entityId = null } = {}) {
    const newLog = db.insert('activity_logs', {
      id: 'act_' + generateUUID().substring(0, 8),
      business_id: businessId,
      user_name: userName,
      role: role,
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      description: description,
      created_at: new Date().toISOString()
    });

    // Broadcast globally to all connected devices in real time
    syncService.broadcast('LOG_CREATED', { log: newLog });

    return newLog;
  },

  getByBusiness(businessId, limit = 50) {
    const logs = db.getTable('activity_logs', businessId);
    return logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
  },

  getAll(limit = 100) {
    const logs = db.getTable('activity_logs');
    return logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
  }
};