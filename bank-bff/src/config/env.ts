import dotenv from 'dotenv';
dotenv.config();
const requiredKeys = ['PORT', 'NODE_ENV', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'REDIS_URL', 'KAFKA_BROKERS'];
for (const key of requiredKeys) {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} is missing in .env!`);
  }
}

export const env = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  REDIS_URL: process.env.REDIS_URL as string,
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS as string).split(','),
};

