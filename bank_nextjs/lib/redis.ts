import { Redis } from '@upstash/redis';

// Create a robust Redis client that doesn't crash if env vars are missing during local dev
const createRedisClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("⚠️  Redis credentials not found in environment. Caching will be bypassed.");
    return null;
  }

  return new Redis({
    url,
    token,
  });
};

export const redis = createRedisClient();

/**
 * Universal Cache Wrapper
 * @param key Unique key for the cache (e.g. `accounts:12345`)
 * @param fetcher Async function that fetches data from actual DB/API if cache misses
 * @param ttl Time to live in seconds (default: 300s = 5 minutes)
 * @returns Data either from cache or from the DB
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  if (!redis) {
    // If no Redis configured, just run the original fetcher immediately
    return await fetcher();
  }

  try {
    const cachedData = await redis.get<T>(key);
    
    if (cachedData) {
      console.log(`[Redis] CACHE HIT: ${key}`);
      return cachedData;
    }

    console.log(`[Redis] CACHE MISS: ${key}. Fetching fresh data...`);
    const freshData = await fetcher();

    // Store in cache for TTL seconds
    // Note: Upstash handles object serialization automatically
    await redis.set(key, freshData, { ex: ttl });

    return freshData;
  } catch (error) {
    console.error(`[Redis] Error accessing cache for ${key}:`, error);
    // Fallback to fetcher if Redis goes down to maintain high availability
    return await fetcher();
  }
}

/**
 * Universal Cache Invalidation
 * @param keys Array of cache keys to clear
 */
export async function clearCache(...keys: string[]) {
  if (!redis) return;

  try {
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Redis] 🗑️ CACHE CLEARED: ${keys.join(", ")}`);
    }
  } catch (error) {
    console.error(`[Redis] ❌ Error clearing cache for:`, keys, error);
  }
}
