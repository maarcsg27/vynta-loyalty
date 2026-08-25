/**
 * VYNTA LOYALTY - Real-Time Multi-Device Cloud Sync Service
 * Integrates Authoritative Cloud Database Persistence + Live SSE Push Broadcasts
 */
import { db } from '../db/storage.js';
import { toast } from '../components/toast.js';

const GITHUB_TOKEN = '';
const GITHUB_API_URL = 'https://api.github.com/repos/Latiguillo/Vynta-loyalty/contents/data/cloud_db.json';
const SYNC_CHANNEL = 'vynta_sync_channel_live_v1';
const SYNC_URL = `https://ntfy.sh/${SYNC_CHANNEL}`;

class SyncService {
  constructor() {
    this.eventSource = null;
    this.deviceId = 'dev_' + Math.random().toString(36).substring(2, 9);
    this.isInitialized = false;
    this.pushTimeout = null;
    this.isSyncing = false;
    this.cachedSha = null;
  }

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Initial Authoritative Cloud Pull
    this.pullFromCloud();

    // 2. Catch-up with recent remote events created in the last 24h
    this.fetchRecentEvents();

    // 3. Open live SSE stream for real-time push updates
    this.connectLiveStream();

    // 4. Listen to local DB changes to automatically sync to cloud
    db.subscribe('change', () => {
      this.scheduleCloudPush();
    });

    // 5. Sync on reconnect or window focus
    window.addEventListener('online', () => {
      this.pullFromCloud();
      this.connectLiveStream();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.pullFromCloud();
        this.fetchRecentEvents();
      }
    });
  }

  async pullFromCloud() {
    try {
      // 1. Try internal /api/sync endpoint
      let json = null;
      try {
        const response = await fetch('/api/sync', { cache: 'no-store' });
        if (response.ok) {
          const resJson = await response.json();
          if (resJson && resJson.data) {
            json = resJson.data;
            this.cachedSha = resJson.sha || this.cachedSha;
          }
        }
      } catch (err) {}

      // 2. Direct GitHub API fallback
      if (!json) {
        try {
          const ghRes = await fetch(GITHUB_API_URL, {
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'User-Agent': 'VyntaAppClient',
              'Accept': 'application/vnd.github.v3+json'
            },
            cache: 'no-store'
          });
          if (ghRes.ok) {
            const ghData = await ghRes.json();
            this.cachedSha = ghData.sha;
            const contentStr = decodeURIComponent(escape(atob(ghData.content.replace(/\s/g, ''))));
            json = JSON.parse(contentStr);
          }
        } catch (err) {}
      }

      if (json && typeof json === 'object') {
        const hasChanges = db.mergeRemoteData(json);
        if (hasChanges) {
          console.log('[VYNTA Cloud Sync] Datos actualizados desde la nube.');
        }

        // If local has businesses or records that are newer, push back to cloud
        const localState = db.getFullState();
        const localBizCount = (localState.businesses || []).length;
        const cloudBizCount = (json.businesses || []).length;
        if (localBizCount > cloudBizCount) {
          this.scheduleCloudPush();
        }
      } else {
        // If cloud is empty or first run, upload current local state to initialize cloud
        this.scheduleCloudPush();
      }
    } catch (e) {
      console.warn('[VYNTA Cloud Sync] Cloud pull notice:', e);
    }
  }

  scheduleCloudPush() {
    if (this.pushTimeout) clearTimeout(this.pushTimeout);
    this.pushTimeout = setTimeout(() => {
      this.pushToCloud();
    }, 300);
  }

  async pushToCloud() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const fullState = db.getFullState();
      const payload = {
        ...fullState,
        updated_at: new Date().toISOString()
      };

      let success = false;

      // 1. Try /api/sync endpoint
      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: payload, sha: this.cachedSha })
        });
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.sha) this.cachedSha = resJson.sha;
          success = true;
        }
      } catch (err) {}

      // 2. Direct GitHub API Fallback
      if (!success) {
        try {
          let sha = this.cachedSha;
          if (!sha) {
            const checkRes = await fetch(GITHUB_API_URL, {
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'User-Agent': 'VyntaAppClient',
                'Accept': 'application/vnd.github.v3+json'
              },
              cache: 'no-store'
            });
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              sha = checkData.sha;
            }
          }

          const jsonStr = JSON.stringify(payload, null, 2);
          const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
          const commitPayload = {
            message: `Cloud database sync [${new Date().toISOString()}]`,
            content: b64
          };
          if (sha) commitPayload.sha = sha;

          const ghPutRes = await fetch(GITHUB_API_URL, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'User-Agent': 'VyntaAppClient',
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(commitPayload)
          });

          if (ghPutRes.ok) {
            const ghPutJson = await ghPutRes.json();
            this.cachedSha = ghPutJson.content?.sha;
          }
        } catch (e) {
          console.warn('[VYNTA Cloud Sync] Direct GH push notice:', e);
        }
      }
    } catch (e) {
      console.warn('[VYNTA Cloud Sync] Cloud push notice:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  async fetchRecentEvents() {
    try {
      const response = await fetch(`${SYNC_URL}/json?poll=1&since=24h`, { cache: 'no-store' });
      if (!response.ok) return;
      const text = await response.text();
      const lines = text.split('\n').filter(l => l.trim().length > 0);

      lines.forEach(line => {
        try {
          const parsed = JSON.parse(line);
          if (parsed.event === 'message' && parsed.message) {
            const payload = JSON.parse(parsed.message);
            this.handleIncomingSync(payload, false);
          }
        } catch (e) {}
      });
    } catch (e) {
      console.warn('Sync catch-up notice:', e);
    }
  }

  connectLiveStream() {
    try {
      if (this.eventSource) this.eventSource.close();
      this.eventSource = new EventSource(`${SYNC_URL}/sse`);

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'message' && data.message) {
            const payload = JSON.parse(data.message);
            this.handleIncomingSync(payload, true);
          }
        } catch (e) {}
      };

      this.eventSource.onerror = () => {
        setTimeout(() => this.connectLiveStream(), 5000);
      };
    } catch (e) {
      console.warn('SSE connection notice:', e);
    }
  }

  broadcast(actionType, data) {
    // Fire-and-forget: schedule everything off the current call stack
    setTimeout(async () => {
      // 1. Schedule cloud database push
      this.scheduleCloudPush();

      // 2. Broadcast via pub/sub SSE to all active clients
      const packet = {
        senderId: this.deviceId,
        action: actionType,
        timestamp: Date.now(),
        data: data
      };

      try {
        await fetch(SYNC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(packet)
        });
      } catch (e) {
        console.warn('Sync broadcast notice:', e);
      }
    }, 0);
  }

  handleIncomingSync(packet, notify = true) {
    if (!packet || packet.senderId === this.deviceId || !packet.action) return;

    const { action, data } = packet;

    if (action === 'BUSINESS_CREATED') {
      const { business, program, reward } = data;
      if (business && !db.getById('businesses', business.id)) {
        db.rawInsert('businesses', business);
      }
      if (program && !db.getById('loyalty_programs', program.id, program.business_id)) {
        db.rawInsert('loyalty_programs', program);
      }
      if (reward && !db.getById('rewards', reward.id, reward.business_id)) {
        db.rawInsert('rewards', reward);
      }
      db.save(false);

      if (notify) {
        toast.success(`\u2728 Nuevo comercio registrado: ${business.name}`);
      }
    } else if (action === 'BUSINESS_UPDATED') {
      const { businessId, updates } = data;
      if (businessId && updates) {
        db.rawUpdate('businesses', businessId, updates);
        db.save(false);
        if (notify && updates.name) {
          toast.success(`Informaci\u00F3n de negocio actualizada: ${updates.name}`);
        }
      }
    } else if (action === 'BRANDING_UPDATED') {
      const { businessId, branding } = data;
      if (businessId && branding) {
        const biz = db.getById('businesses', businessId);
        if (biz) {
          db.rawUpdate('businesses', businessId, { branding });
          db.save(false);
        }
      }
    } else if (action === 'PROGRAM_CREATED') {
      const { businessId, program } = data;
      if (program && program.id) {
        db.rawInsert('loyalty_programs', program);
        db.save(false);
        if (notify) {
          toast.success(`\u2728 Nueva tarjeta creada: ${program.name}`);
        }
      }
    } else if (action === 'PROGRAM_UPDATED') {
      const { businessId, program } = data;
      if (program && program.id) {
        db.rawUpdate('loyalty_programs', program.id, program, businessId);
        db.save(false);
      }
    } else if (action === 'PROGRAM_ACTIVATED') {
      const { businessId, programId } = data;
      if (businessId && programId) {
        const programs = db.getTable('loyalty_programs', businessId);
        programs.forEach(p => {
          db.rawUpdate('loyalty_programs', p.id, { active: p.id === programId }, businessId);
        });
        db.save(false);
      }
    } else if (action === 'CUSTOMER_CREATED') {
      const { customer, card } = data;
      if (customer && !db.getById('customers', customer.id, customer.business_id)) {
        db.rawInsert('customers', customer);
      }
      if (card && !db.getById('loyalty_cards', card.id, card.business_id)) {
        db.rawInsert('loyalty_cards', card);
      }
      db.save(false);

      if (notify) {
        toast.success(`\u2728 Nuevo cliente registrado: ${customer.first_name} (#${card.card_number})`);
      }
    } else if (action === 'CUSTOMER_UPDATED') {
      const { customerId, updates, businessId } = data;
      if (customerId && updates) {
        db.rawUpdate('customers', customerId, updates, businessId);
        db.save(false);
      }
    } else if (action === 'STAMP_ADDED') {
      const { card, transaction } = data;
      if (card) {
        db.rawUpdate('loyalty_cards', card.id, card, card.business_id);
      }
      if (transaction && !db.getById('stamp_transactions', transaction.id, transaction.business_id)) {
        db.rawInsert('stamp_transactions', transaction);
      }
      db.save(false);

      if (notify) {
        toast.success(`\u25A3 Sellos actualizados en directo para #${card.card_number}`);
      }
    } else if (action === 'STAMP_REMOVED') {
      const { card, transaction } = data;
      if (card) {
        db.rawUpdate('loyalty_cards', card.id, card, card.business_id);
      }
      if (transaction && !db.getById('stamp_transactions', transaction.id, transaction.business_id)) {
        db.rawInsert('stamp_transactions', transaction);
      }
      db.save(false);
    } else if (action === 'REWARD_REDEEMED') {
      const { card, redemption } = data;
      if (card) {
        db.rawUpdate('loyalty_cards', card.id, card, card.business_id);
      }
      if (redemption && !db.getById('redemptions', redemption.id, redemption.business_id)) {
        db.rawInsert('redemptions', redemption);
      }
      db.save(false);

      if (notify) {
        toast.success(`\u2605 Recompensa canjeada: ${redemption.reward_name}`);
      }
    } else if (action === 'PLAN_CHANGED') {
      const { businessId, plan } = data;
      if (businessId && plan) {
        db.rawUpdate('businesses', businessId, { plan });
        db.save(false);
      }
    } else if (action === 'CAMPAIGN_CREATED') {
      const { campaign } = data;
      if (campaign && !db.getById('campaigns', campaign.id, campaign.business_id)) {
        db.rawInsert('campaigns', campaign);
        db.save(false);
      }
    } else if (action === 'SINGLE_USE_CREATED') {
      const { card } = data;
      if (card && !db.getById('single_use_cards', card.id, card.business_id)) {
        db.rawInsert('single_use_cards', card);
        db.save(false);
      }
    } else if (action === 'SINGLE_USE_REDEEMED') {
      const { card } = data;
      if (card) {
        db.rawUpdate('single_use_cards', card.id, card, card.business_id);
        db.save(false);
        if (notify) {
          toast.success(`\u2714 Tarjeta de 1 solo uso canjeada: #${card.card_number}`);
        }
      }
    } else if (action === 'COUPON_CREATED') {
      const { coupon } = data;
      if (coupon && !db.getById('coupons', coupon.id, coupon.business_id)) {
        db.rawInsert('coupons', coupon);
        db.save(false);
      }
    } else if (action === 'COUPON_DELETED') {
      const { businessId, couponId } = data;
      if (businessId && couponId) {
        db.delete('coupons', couponId, businessId);
        db.save(false);
      }
    } else if (action === 'SINGLE_USE_DELETED') {
      const { businessId, cardId } = data;
      if (businessId && cardId) {
        db.delete('single_use_cards', cardId, businessId);
        db.save(false);
      }
    } else if (action === 'CAMPAIGN_DELETED') {
      const { businessId, campaignId } = data;
      if (businessId && campaignId) {
        const cards = db.getTable('single_use_cards', businessId).filter(c => c.campaign_id === campaignId);
        cards.forEach(c => db.delete('single_use_cards', c.id, businessId));
        db.delete('campaigns', campaignId, businessId);
        db.save(false);
      }
    } else if (action === 'PROGRAM_DELETED') {
      const { businessId, programId } = data;
      if (businessId && programId) {
        db.delete('loyalty_programs', programId, businessId);
        const remaining = db.getTable('loyalty_programs', businessId);
        if (remaining.length > 0 && !remaining.some(p => p.active)) {
          db.rawUpdate('loyalty_programs', remaining[0].id, { active: true }, businessId);
        }
        db.save(false);
      }
    } else if (action === 'BUSINESS_DELETED') {
      const { businessId } = data;
      if (businessId) {
        db.delete('businesses', businessId);
        ['business_users', 'loyalty_programs', 'rewards', 'customers', 'loyalty_cards', 'stamp_transactions', 'redemptions', 'coupons', 'campaigns', 'single_use_cards'].forEach(table => {
          const items = db.getTable(table, businessId);
          items.forEach(item => {
            db.delete(table, item.id, businessId);
          });
        });
        db.save(false);
      }
    } else if (action === 'LOG_CREATED') {
      const { log } = data;
      if (log && !db.getById('activity_logs', log.id)) {
        db.rawInsert('activity_logs', log);
        db.save(false);
      }
    } else if (action === 'DB_STATE_SYNC') {
      if (data && typeof data === 'object') {
        db.mergeRemoteData(data);
      }
    }
  }
}

export const syncService = new SyncService();

