import { kv } from "@vercel/kv";
export class MemoryTtlCache {
    ttlMs;
    maxEntries;
    entries = new Map();
    constructor(ttlMs, maxEntries = 300) {
        this.ttlMs = ttlMs;
        this.maxEntries = maxEntries;
    }
    get(key) {
        return this.getLiveEntry(key)?.value;
    }
    has(key) {
        return this.getLiveEntry(key) !== undefined;
    }
    set(key, value) {
        if (this.entries.size >= this.maxEntries) {
            const firstKey = this.entries.keys().next().value;
            if (firstKey)
                this.entries.delete(firstKey);
        }
        this.entries.set(key, {
            expiresAt: Date.now() + this.ttlMs,
            value
        });
    }
    getLiveEntry(key) {
        const entry = this.entries.get(key);
        if (!entry)
            return undefined;
        if (entry.expiresAt < Date.now()) {
            this.entries.delete(key);
            return undefined;
        }
        return entry;
    }
}
export class DistributedCache {
    prefix;
    ttlMs;
    memoryCache;
    isKvEnabled;
    constructor(prefix, ttlMs, maxMemoryEntries = 300) {
        this.prefix = prefix;
        this.ttlMs = ttlMs;
        this.memoryCache = new MemoryTtlCache(ttlMs, maxMemoryEntries);
        this.isKvEnabled = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
    }
    async get(key) {
        const memVal = this.memoryCache.get(key);
        if (memVal !== undefined)
            return memVal;
        if (this.isKvEnabled) {
            try {
                // kv.get returns null if key doesn't exist. If we explicitly set null, it also returns null?
                // Actually, Vercel KV returns null if missing. So we can't distinguish missing from stored null easily unless we wrap it.
                // Let's just wrap it.
                const wrapped = await kv.get(`${this.prefix}:${key}`);
                if (wrapped !== null) {
                    this.memoryCache.set(key, wrapped.value);
                    return wrapped.value;
                }
            }
            catch (error) {
                console.warn(`[KV Cache] Error getting key ${key}:`, error);
            }
        }
        return undefined; // Not found
    }
    async set(key, value) {
        this.memoryCache.set(key, value);
        if (this.isKvEnabled) {
            try {
                await kv.set(`${this.prefix}:${key}`, { value }, { px: this.ttlMs });
            }
            catch (error) {
                console.warn(`[KV Cache] Error setting key ${key}:`, error);
            }
        }
    }
}
