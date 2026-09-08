class MemoryCache {
  constructor(defaultTtlSeconds = 60, maxItems = 1000) {
    this.defaultTtlSeconds = defaultTtlSeconds;
    this.maxItems = maxItems;
    this.store = new Map();
  }

  set(key, value, ttlSeconds = this.defaultTtlSeconds) {
    if (this.store.size >= this.maxItems) {
      // Evict oldest entry (LRU simple)
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }

    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  del(key) {
    this.store.delete(key);
  }

  invalidatePrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
  }

  stats() {
    return {
      size: this.store.size,
      maxItems: this.maxItems
    };
  }

  cacheMiddleware(ttlSeconds = 60) {
    return (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Do not cache authenticated user-specific or sensitive data unless public
      const cacheKey = `url:${req.originalUrl || req.url}`;
      const cached = this.get(cacheKey);

      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.send(cached);
      }

      res.setHeader('X-Cache', 'MISS');

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(cacheKey, JSON.stringify(body), ttlSeconds);
        }
        return originalJson(body);
      };

      next();
    };
  }
}

const cacheService = new MemoryCache();

module.exports = {
  MemoryCache,
  cacheService
};
