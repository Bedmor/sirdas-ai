/**
 * Sliding Window In-Memory Rate Limiter
 * API rotaları, Web ve Mobil istemcileri için IP / oturum bazlı istek sınırlandırıcı.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periyodik çöp toplayıcı (10 dakikada bir eski kayıtları temizler)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 300_000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 600_000).unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export function checkRateLimit(
  key: string,
  maxRequests = 12,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Pencere dışındaki eski zaman damgalarını temizle
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetInMs = Math.max(0, windowMs - (now - oldest));
    return {
      allowed: false,
      remaining: 0,
      resetInMs,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - record.timestamps.length),
    resetInMs: windowMs,
  };
}

export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
