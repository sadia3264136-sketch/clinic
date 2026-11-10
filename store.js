// Storage: Upstash Redis if env vars exist (data survives), otherwise in-memory (resets often on Vercel).
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
let redis = null;
if (url && token) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({ url, token });
}
const mem = global.__clinicMem || (global.__clinicMem = { appts: {}, slots: {} });

const store = {
  persistent: !!redis,

  async takenSlots(date) {
    if (redis) return (await redis.hgetall('slots:' + date)) || {};
    return mem.slots[date] || {};
  },

  // returns true if the slot was free and is now reserved
  async reserve(date, time, id) {
    if (redis) return (await redis.hsetnx('slots:' + date, time, id)) === 1;
    mem.slots[date] = mem.slots[date] || {};
    if (mem.slots[date][time]) return false;
    mem.slots[date][time] = id;
    return true;
  },

  async release(date, time) {
    if (redis) { await redis.hdel('slots:' + date, time); return; }
    if (mem.slots[date]) delete mem.slots[date][time];
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

module.exports = store;
