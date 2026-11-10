// Storage: Upstash Redis when env vars exist (data survives), otherwise in-memory (resets often on Vercel).
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
let redis = null;
if (url && token) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({ url, token });
}
const mem = global.__clinicMem || (global.__clinicMem = { appts: {}, slots: {} });
const key = (date, resource) => 'slots:' + date + ':' + resource;

module.exports = {
  persistent: !!redis,

  async takenSlots(date, resource) {
    if (redis) return (await redis.hgetall(key(date, resource))) || {};
    return mem.slots[key(date, resource)] || {};
  },

  // true if the slot was free and is now reserved
  async reserve(date, resource, time, id) {
    if (redis) return (await redis.hsetnx(key(date, resource), time, id)) === 1;
    const k = key(date, resource);
    mem.slots[k] = mem.slots[k] || {};
    if (mem.slots[k][time]) return false;
    mem.slots[k][time] = id;
    return true;
  },

  async release(date, resource, time) {
    if (redis) { await redis.hdel(key(date, resource), time); return; }
    const k = key(date, resource);
    if (mem.slots[k]) delete mem.slots[k][time];
  },

  async save(appt) {
    if (redis) { await redis.hset('appointments', { [appt.id]: appt }); return; }
    mem.appts[appt.id] = appt;
  },

  async get(id) {
    if (redis) return (await redis.hget('appointments', id)) || null;
    return mem.appts[id] || null;
  },

  async all() {
    if (redis) return Object.values((await redis.hgetall('appointments')) || {});
    return Object.values(mem.appts);
  },
};
