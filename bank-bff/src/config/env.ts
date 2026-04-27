import dotenv from 'dotenv';
dotenv.config();

const requiredKeys = ['PORT', 'NODE_ENV', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'REDIS_URL', 'KAFKA_BROKERS', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RESEND_API_KEY'];
for (const key of requiredKeys) {
  if (!process.env[key]) {
    console.warn(`Environment variable ${key} is missing in .env!`);
  }
}

const parsePort = (value: string | undefined): number => {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${value}`);
  }
  return port;
};

export const env = {
  PORT: parsePort(process.env.PORT),
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  REDIS_URL: process.env.REDIS_URL as string,
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS as string)
    .split(',')
    .map(b => b.trim())
    .filter(b => b.length > 0),
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
  RESEND_API_KEY: process.env.RESEND_API_KEY as string,
  JAVA_CORE_URL: process.env.JAVA_CORE_URL as string,
};
