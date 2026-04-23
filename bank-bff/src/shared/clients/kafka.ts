import { Kafka } from 'kafkajs';
import { env } from '../../config/env';

export const kafka = new Kafka({
  clientId: 'bank-bff',
  brokers: env.KAFKA_BROKERS,
});

// Создаем продюсера с включенной идемпотентностью (чтобы избежать дублей при сетевых ретраях)
export const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 1, // Требуется для строгой гарантии порядка при idempotent: true
});

export const connectKafka = async () => {
  try {
    await producer.connect();
    console.log('Kafka Producer Connected');
  } catch (error) {
    console.error('Failed to connect to Kafka', error); throw error;
  }
};

