import { kafka } from './client';
import { Producer } from 'kafkajs';

// Singleton: кэшируем инстанс в глобальном объекте
// Это предотвращает утечку соединений при HMR в режиме разработки Next.js
declare global {
  // eslint-disable-next-line no-var
  var _kafkaProducer: Producer | undefined;
}

let producer: Producer;

const getProducer = async (): Promise<Producer> => {
  if (global._kafkaProducer) {
    return global._kafkaProducer;
  }

  producer = kafka.producer();
  await producer.connect();
  global._kafkaProducer = producer;

  return producer;
};

export interface TransactionEvent {
  transactionId: string;
  amount: number;
  currency: string;
  senderId: string;
  receiverId: string;
  senderBankId: string;
  receiverBankId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  channel: string;
  category: string;
  name: string;
  email: string;
  timestamp: string;
}

export const publishTransaction = async (payload: TransactionEvent): Promise<void> => {
  const topic = process.env.KAFKA_TOPIC_TRANSACTIONS || 'bank-transactions';

  try {
    const prod = await getProducer();
    await prod.send({
      topic,
      messages: [
        {
          key: payload.transactionId,
          value: JSON.stringify(payload),
        },
      ],
    });
    console.log(`[Kafka] Published transaction ${payload.transactionId} to topic "${topic}"`);
  } catch (error) {
    // Kafka — не блокирующая зависимость. Не ломаем основной поток при сбое Kafka.
    console.error('[Kafka] Failed to publish transaction event:', error);
  }
};

// Graceful shutdown: вызываем при завершении процесса
export const disconnectProducer = async (): Promise<void> => {
  if (global._kafkaProducer) {
    await global._kafkaProducer.disconnect();
    global._kafkaProducer = undefined;
    console.log('[Kafka] Producer disconnected.');
  }
};

// Перехватываем сигналы завершения процесса Node.js
if (typeof process !== 'undefined') {
  process.on('SIGINT', disconnectProducer);
  process.on('SIGTERM', disconnectProducer);
}
