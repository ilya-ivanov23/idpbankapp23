import { createClient } from 'redis';
import { env } from '../../config/env';
export const redisClient = createClient({
  url: env.REDIS_URL as string
});
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));
export const connectRedis = async () => {
  if (!redisClient.isReady) {
    await redisClient.connect();
  }
};
