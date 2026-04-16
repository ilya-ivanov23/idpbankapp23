'use strict';

require('dotenv').config();
const { Kafka } = require('kafkajs');

// ─── Kafka Client Init ────────────────────────────────────────────────────────
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
  brokers: (process.env.KAFKA_BROKERS || '34.74.252.2:9092').split(','),
  connectionTimeout: 10000,
  retry: {
    initialRetryTime: 300,
    maxRetryTime: 30000,
    retries: 5,
  },
});

// ─── Consumer Init ────────────────────────────────────────────────────────────
// groupId обязателен: позволяет масштабировать воркеры без дублирования уведомлений
const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || 'notification-group',
});

// ─── Telegram Stub (SCRUM-77 Bonus) ──────────────────────────────────────────
// Заглушка: позволяет легко прикрутить реальный Telegram Bot API в будущем.
// Достаточно заполнить TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env
const sendTelegramNotification = async (message) => {
  // TODO: раскомментить и передать реальный токен
  // const token = process.env.TELEGRAM_BOT_TOKEN;
  // const chatId = process.env.TELEGRAM_CHAT_ID;
  // await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  //   method: 'POST',
  //   body: JSON.stringify({ chat_id: chatId, text: message }),
  //   headers: { 'Content-Type': 'application/json' },
  // });
};

// ─── Notification Renderer ────────────────────────────────────────────────────
const renderReceipt = (payload) => {
  const statusIcon = payload.status === 'SUCCESS' ? '✅ УСПЕШНО' : '❌ ОШИБКА';
  const senderShort = payload.senderId ? `...${String(payload.senderId).slice(-6)}` : 'N/A';
  const receiverShort = payload.receiverId ? `...${String(payload.receiverId).slice(-6)}` : 'N/A';

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      🔔 УВЕДОМЛЕНИЕ О ТРАНЗАКЦИИ       ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  💰 Сумма:    ${String(payload.amount + ' ' + (payload.currency || 'USD')).padEnd(24)}║`);
  console.log(`║  📊 Статус:   ${String(statusIcon).padEnd(24)}║`);
  console.log(`║  📤 Отправитель: ${String(senderShort).padEnd(21)}║`);
  console.log(`║  📥 Получатель:  ${String(receiverShort).padEnd(21)}║`);
  console.log(`║  🕒 Время:    ${new Date().toLocaleString('ru-RU').padEnd(24)}║`);
  console.log('╠════════════════════════════════════════╣');
  console.log('║  📧 Email уведомление: ОТПРАВЛЕНО      ║');
  console.log('║  📱 SMS уведомление:   ОТПРАВЛЕНО      ║');
  console.log('╚════════════════════════════════════════╝\n');
};

// ─── Main Consumer Loop ───────────────────────────────────────────────────────
const run = async () => {
  console.log('⏳ [Notification Service] Подключение к Kafka...');
  await consumer.connect();
  console.log('✅ [Notification Service] Подключение успешно!');
  console.log(`📡 Слушаем топик: "${process.env.KAFKA_TOPIC || 'bank-transactions'}"\n`);

  await consumer.subscribe({
    topic: process.env.KAFKA_TOPIC || 'bank-transactions',
    // fromBeginning: true — обрабатываем исторические сообщения при первом запуске
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      // ── Poison Pill Protection ──────────────────────────────────────────────
      // try/catch вокруг JSON.parse: битое сообщение не должно крашить всю очередь
      try {
        const raw = message.value?.toString();
        if (!raw) {
          console.warn('[Kafka] Получено пустое сообщение, пропускаем.');
          return;
        }

        const payload = JSON.parse(raw);
        renderReceipt(payload);

        // Вызов заглушки для будущего Telegram-бота
        await sendTelegramNotification(
          `Транзакция ${payload.amount} ${payload.currency || 'USD'} (${payload.status})`
        );
      } catch (err) {
        // Ошибка одного сообщения НЕ останавливает Consumer
        console.error(`[Kafka] ❌ Ошибка обработки сообщения (partition ${partition}):`, err.message);
      }
    },
  });
};

run().catch((err) => {
  console.error('[Kafka] Критическая ошибка запуска Consumer:', err);
  process.exit(1);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
// Корректное отключение при SIGINT/SIGTERM/SIGUSR2 (nodemon, Docker, Ctrl+C)
// Без этого партиции Kafka "зависнут" на несколько минут после рестарта
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

signalTraps.forEach((signal) => {
  process.once(signal, async () => {
    console.log(`\n🛑 [${signal}] Получен сигнал завершения. Отключаем Consumer...`);
    try {
      await consumer.disconnect();
      console.log('✅ Consumer корректно отключен. Партиции освобождены.');
    } catch (err) {
      console.error('Ошибка при отключении Consumer:', err.message);
    } finally {
      process.kill(process.pid, signal);
    }
  });
});

// Перехват необработанных ошибок — логируем и корректно завершаем
['unhandledRejection', 'uncaughtException'].forEach((type) => {
  process.on(type, async (err) => {
    console.error(`\n🚨 [${type}]:`, err);
    try {
      await consumer.disconnect();
    } catch (_) { /* ignore */ }
    process.exit(1);
  });
});
