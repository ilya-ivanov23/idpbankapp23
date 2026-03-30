import { Kafka } from 'kafkajs';

// Silence the default partitioner migration warning (v2 behavior is intentional)
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const brokers = (process.env.KAFKA_BROKERS || '34.74.252.2:9092').split(',');
const clientId = process.env.KAFKA_CLIENT_ID || 'bank-nextjs-app';

export const kafka = new Kafka({
  clientId,
  brokers,
  connectionTimeout: 10000,
  retry: {
    initialRetryTime: 300,
    maxRetryTime: 30000, // Явный верхний лимит — предотвращает расчёт отрицательных таймаутов
    retries: 5,
    factor: 2,          // Экспоненциальный множитель — явно, чтобы не было неожиданностей
    multiplier: 1.5,
  },
});
