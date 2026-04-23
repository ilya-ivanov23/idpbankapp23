import { Kafka } from 'kafkajs';
import { env } from '../../config/env';

export const kafka = new Kafka({
  clientId: 'bank-bff',
  brokers: env.KAFKA_BROKERS,
});

// Create a producer with idempotency enabled to prevent duplicate messages on network retries
export const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 1, // Required to guarantee strict ordering when idempotent: true
});

export const connectKafka = async () => {
  try {
    await producer.connect();
    console.log('Kafka Producer Connected');
  } catch (error) {
    console.error('Failed to connect to Kafka', error); throw error;
  }
};

