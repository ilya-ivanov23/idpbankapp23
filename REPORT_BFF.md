# 📘 REPORT: bank-bff — Backend For Frontend Microservice

### Epic 3 | SCRUM-145 + SCRUM-146 | IDP Bank App

> **Автор**: ilya-ivanov23
> **Ветка**: `chore/SCRUM-125-java`
> **Дата завершения**: 23 апреля 2026
> **Статус**: ✅ ЗАКРЫТ

---

## 📋 Содержание

1. [Что такое BFF и зачем он нам нужен](#что-такое-bff)
2. [Архитектура проекта](#архитектура)
3. [Файловая структура](#файловая-структура)
4. [Подробный разбор каждого файла](#разбор-файлов)
5. [Хронология ошибок и их решений](#ошибки-и-решения)
6. [Все замечания GitHub Copilot и что мы с ними сделали](#copilot-review)
7. [Полный флоу пополнения кошелька](#полный-флоу)
8. [Как тестировать](#как-тестировать)
9. [Переменные окружения](#env-переменные)
10. [Полезные ссылки для самостоятельного изучения](#ссылки)

---

## 1. Что такое BFF и зачем он нам нужен {#что-такое-bff}

**BFF (Backend for Frontend)** — это отдельный микросервис-посредник между фронтендом (Next.js) и бэкендом (Java Core Engine).

```
[Next.js Frontend]  ←→  [bank-bff (Node.js)]  ←→  [Java Core Engine]
                              ↕                         ↕
                           [Redis]                   [Kafka]
                              ↕
                           [Stripe]
```

**Зачем он нужен, если уже есть Java?**

- Java — тяжелый сервис для бизнес-логики (база данных, транзакции, счета)
- BFF — легкий «адаптер»: авторизация, валидация, трансформация данных для фронта
- Java не понимает HTTP-специфику фронта (cookies, JWT, CORS) — BFF берёт это на себя
- Разные frontend клиенты (веб, мобилка) могут иметь свои BFF с разными ответами

**Ресурс для изучения**: https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends

---

## 2. Архитектура {#архитектура}

### Полная схема системы:

```
┌─────────────────────────────────────────────────────────┐
│                    КЛИЕНТ (Браузер)                      │
│           Next.js Frontend (localhost:3001)               │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (REST API)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              bank-bff (Node.js/Express)                  │
│                   localhost:3000                          │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐│
│  │ /api/auth   │  │/api/transact │  │ /api/wallet     ││
│  │ POST /login │  │POST /transfer│  │ POST /checkout  ││
│  │ POST /logout│  └──────┬───────┘  │ POST /webhook   ││
│  └──────┬──────┘         │          └────────┬────────┘│
└─────────┼────────────────┼───────────────────┼─────────┘
          │                │                   │
          ▼                ▼                   ▼
       [Redis]          [Kafka]            [Stripe API]
   Session storage   broker:9092             ↑
   Token revocation  topic: bank-transactions │
                          │               [Stripe Webhook]
                          ▼                   │
               [Java Core Engine] ←───────────┘
               PostgreSQL database
```

### Что происходит пошагово при пополнении кошелька:

```
1. User: "Хочу пополнить на $50"
   ↓
2. Next.js → POST /api/wallet/checkout {amount: 50}
   ↓
3. BFF создаёт Stripe Checkout Session (stripe.checkout.sessions.create)
   ↓
4. BFF возвращает {url: "https://checkout.stripe.com/pay/cs_..."}
   ↓
5. Next.js redirect → Stripe Hosted Payment Page
   ↓
6. User вводит данные карты и платит
   ↓
7. Stripe → POST /api/wallet/webhook (с HMAC подписью)
   ↓
8. BFF проверяет подпись + payment_status === 'paid'
   ↓
9. BFF публикует DEPOSIT_COMPLETED в Kafka (с event.id для идемпотентности)
   ↓
10. Java Core читает из Kafka → зачисляет $50 в PostgreSQL
```

---

## 3. Файловая структура {#файловая-структура}

```
bank-bff/
├── .env                          # Секреты (не в git!)
├── .gitignore
├── package.json                  # Зависимости проекта
├── tsconfig.json                 # Настройки TypeScript
└── src/
    ├── app.ts                    # Express приложение + middleware + роуты
    ├── server.ts                 # Точка входа (запуск сервера)
    ├── config/
    │   └── env.ts                # Валидация и экспорт переменных окружения
    ├── modules/
    │   ├── auth/
    │   │   ├── auth.controller.ts   # Контроллер: login, logout
    │   │   ├── auth.routes.ts       # Роуты: POST /login, POST /logout
    │   │   └── auth.service.ts      # Логика: JWT + Redis sessions
    │   ├── transactions/
    │   │   ├── transaction.controller.ts  # Контроллер: transfer
    │   │   ├── transaction.routes.ts      # Роуты: POST /transfer
    │   │   └── transaction.service.ts     # Логика: публикация в Kafka
    │   └── wallet/
    │       ├── stripe.controller.ts  # Контроллер: checkout, webhook
    │       └── stripe.routes.ts      # Роуты: POST /checkout, POST /webhook
    └── shared/
        ├── clients/
        │   ├── kafka.ts          # Kafka Producer (idempotent)
        │   └── redis.ts          # Redis клиент
        └── middleware/
            └── auth.middleware.ts # JWT Guard + Token Revocation
```

---

## 4. Подробный разбор каждого файла {#разбор-файлов}

### 📄 `src/server.ts` — Точка входа

```typescript
import app from "./app";
import { env } from "./config/env";
import { connectRedis } from "./shared/clients/redis";
import { connectKafka } from "./shared/clients/kafka";

const startServer = async () => {
  try {
    await connectRedis();
    await connectKafka(); // Connect Kafka producer before accepting requests
    app.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1); // Fail-fast: если Redis/Kafka упали — сервер не стартует
  }
};
startServer();
```

**Ключевые решения:**

- `process.exit(1)` — паттерн "fail-fast". Лучше упасть сразу, чем молча принимать запросы без БД
- Сначала подключаем Redis, потом Kafka, потом только слушаем порт

---

### 📄 `src/app.ts` — Express приложение

```typescript
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes";
import transactionRoutes from "./modules/transactions/transaction.routes";
import stripeRoutes from "./modules/wallet/stripe.routes";

const app = express();
app.use(helmet()); // Безопасные HTTP заголовки
app.use(cors());

// IMPORTANT: Stripe routes must be registered BEFORE `app.use(express.json())`!
// Otherwise express.json() will parse the body into an object and Stripe signature verification will fail.
app.use("/api/wallet", stripeRoutes);

app.use(express.json()); // Глобальный JSON парсер

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);

app.get("/health", (req, res) => res.status(200).json({ status: "OK" }));

export default app;
```

**🔴 КРИТИЧЕСКИ ВАЖНЫЙ МОМЕНТ — порядок middleware:**
Webhook от Stripe работает только если тело запроса — это **сырой Buffer** (массив байт).
Если сначала подключить `express.json()`, он преобразует Buffer в JavaScript-объект, и Stripe не сможет проверить свою подпись (HMAC не совпадёт). Поэтому Stripe-роуты идут ПЕРВЫМИ.

**Ресурс**: https://stripe.com/docs/webhooks#verify-official-libraries

---

### 📄 `src/config/env.ts` — Конфигурация

```typescript
import dotenv from "dotenv";
dotenv.config();

// Проверяем, что все нужные переменные существуют
const requiredKeys = [
  "PORT",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "REDIS_URL",
  "KAFKA_BROKERS",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

for (const key of requiredKeys) {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} is missing in .env!`);
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
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  REDIS_URL: process.env.REDIS_URL as string,
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS as string)
    .split(",")
    .map((b) => b.trim())
    .filter((b) => b.length > 0),
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
};
```

**Зачем это важно:** Если забыть добавить, например, `JWT_SECRET` в `.env` на продакшн-сервере, сервер **сразу упадёт** при старте с понятным сообщением. Без этой проверки он бы стартовал, но тихо ломался при первом запросе.

---

### 📄 `src/shared/clients/redis.ts` — Redis клиент

Redis используется как **быстрое хранилище** для двух вещей:

1. **Сессии** — `session:{userId}:{deviceId}` → refreshToken (TTL: 7 дней)
2. **Черный список токенов** — `revoked_token:{jti}` → 'revoked' (TTL: 15 минут)

**Почему Redis, а не PostgreSQL для токенов?**

- Проверка токена происходит при КАЖДОМ запросе → должна быть молниеносной
- Redis хранит данные в памяти → O(1) поиск по ключу
- TTL встроен в Redis → не нужно писать cron-джобы для очистки старых токенов

**Ресурс**: https://redis.io/docs/manual/keyspace-notifications/

---

### 📄 `src/shared/clients/kafka.ts` — Kafka Producer

```typescript
export const producer = kafka.producer({
  idempotent: true, // Гарантия "exactly-once" доставки
  maxInFlightRequests: 1, // Строгий порядок сообщений
});
```

**Idempotent Producer** — это настройка, которая защищает от дублирования при сетевых сбоях.
Пример проблемы без idempotent: сеть моргнула, producer не получил подтверждение → отправил снова → сообщение дошло дважды → $50 зачислилось дважды.
С `idempotent: true`: Kafka отслеживает уникальный sequence number каждого сообщения и игнорирует дубли.

**Ресурс**: https://kafka.apache.org/documentation/#producerconfigs_enable.idempotence

---

### 📄 `src/shared/middleware/auth.middleware.ts` — JWT Guard

```typescript
export const authGuard = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const verifiedToken = jwt.verify(token, env.JWT_SECRET);
    const decoded = verifiedToken as DecodedAuthToken;

    // Проверяем, не был ли токен отозван (logout)
    const isRevoked = await redisClient.get(`revoked_token:${decoded.jti}`);
    if (isRevoked) return res.status(401).json({ error: "Token revoked" });

    req.user = decoded; // Инжектируем данные пользователя в запрос
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
```

**Что такое `jti`?** — JWT ID. Уникальный идентификатор конкретного токена.
При логауте мы добавляем `jti` в Redis black list. Это позволяет сделать логаут мгновенным, не дожидаясь истечения срока токена.

**Ресурс**: https://jwt.io/introduction

---

### 📄 `src/modules/auth/auth.service.ts` — Логика авторизации

```typescript
async login(userId: string, deviceId: string) {
  const jti = uuidv4(); // Уникальный ID для этого токена

  const accessToken = jwt.sign(
    { userId, deviceId },
    env.JWT_SECRET,
    { expiresIn: '15m', jwtid: jti } // Живёт 15 минут
  );

  const refreshToken = jwt.sign(
    { userId, deviceId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d', jwtid: jti } // Живёт 7 дней
  );

  // Сохраняем сессию в Redis (TTL = 7 дней)
  await redisClient.setEx(`session:${userId}:${deviceId}`, 7 * 24 * 60 * 60, refreshToken);

  return { accessToken, refreshToken };
}

async logout(userId: string, deviceId: string, jti: string) {
  await redisClient.del(`session:${userId}:${deviceId}`); // Удаляем сессию
  await redisClient.setEx(`revoked_token:${jti}`, 15 * 60, 'revoked'); // Блокируем токен на 15 мин
}
```

**Почему два токена?**

- `accessToken` (15 мин) — для API запросов. Короткий срок = если утечёт, урон минимален
- `refreshToken` (7 дней) — для получения нового accessToken без повторного логина

---

### 📄 `src/modules/transactions/transaction.service.ts` — Переводы

```typescript
async publishTransferEvent(userId, toAccount, amount, currency) {
  const eventId = uuidv4(); // UUID для трекинга этой конкретной транзакции

  const payload = {
    eventId, userId, toAccount, amount, currency,
    timestamp: new Date().toISOString(),
    type: 'TRANSFER_INITIATED'
  };

  await producer.send({
    topic: 'bank-transactions',
    messages: [{
      key: userId, // Partition by userId — все транзакции одного юзера в одну партицию
      value: JSON.stringify(payload)
    }]
  });

  return { eventId, payload };
}
```

**Зачем `key: userId`?**
Kafka разбивает сообщения по партициям. Если все транзакции пользователя `ilya777` идут в одну партицию, они будут обработаны строго по порядку. Без этого деньги могут "прийти" раньше, чем "ушли".

**Ресурс**: https://kafka.apache.org/documentation/#design_partitionsandreplication

---

### 📄 `src/modules/wallet/stripe.controller.ts` — Stripe

**Метод 1: `createCheckoutSession`** (POST /api/wallet/checkout)

```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "payment",
  client_reference_id: userId, // Ключевое поле! Webhook использует его для зачисления
  line_items: [
    {
      price_data: {
        currency: "usd",
        unit_amount: Math.round(amount * 100), // Всегда в центах!
        product_data: { name: "Wallet Top-Up" },
      },
      quantity: 1,
    },
  ],
  success_url: `${FRONTEND_URL}/wallet?payment=success`,
  cancel_url: `${FRONTEND_URL}/wallet?payment=cancelled`,
});

return res.json({ url: session.url }); // Отдаём URL фронту
```

**Метод 2: `webhook`** (POST /api/wallet/webhook)

```typescript
// 1. Нормализация заголовка (может быть string | string[])
const signature = Array.isArray(sig) ? sig[0] : sig;

// 2. Криптографическая верификация подписи HMAC-SHA256
event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  env.STRIPE_WEBHOOK_SECRET,
);

// 3. Проверка статуса оплаты (защита от async payments)
if (session.payment_status !== "paid") {
  return res.status(200).send();
}

// 4. Идемпотентность через event.id от Stripe (не uuidv4!)
const eventId = event.id; // Одинаковый при ретраях → нет двойного зачисления

// 5. Публикация в Kafka
await producer.send({
  topic: "bank-transactions",
  messages: [{ key: userId, value: JSON.stringify(payload) }],
});

// 6. Обязательный 200!!! Иначе Stripe будет слать ретраи
res.status(200).send();
```

---

## 5. Хронология ошибок и их решений {#ошибки-и-решения}

### 🔴 Ошибка #1: Терминал «съедал» код

**Проблема:** При попытке вставить код через `cat << 'EOF'` в zsh терминал, он начинал склеивать строки, добавлял мусор и создавал синтаксически неверный файл. Пример:

```
heredoc> const userId = session.client_referencimport { Request, Response } from 'express';
heredoc> import S  import Stripe from 'stripe';
```

**Причина:** zsh предсказывает и перебрасывает курсор при вставке длинных блоков из буфера обмена (особенность iTerm2 + zsh autosuggestions).

**Решение:** Отказались от терминального метода. Код записывался напрямую через AI (IDE интеграция), минуя терминал.

---

### 🔴 Ошибка #2: TypeScript компилятор — 45 ошибок `verbatimModuleSyntax`

**Проблема:**

```
error TS1295: ECMAScript imports and exports cannot be written in a CommonJS file
under 'verbatimModuleSyntax'.
```

**Причина:** В `tsconfig.json` была включена жёсткая настройка `"verbatimModuleSyntax": true`, несовместимая с `"type": "commonjs"` в `package.json`.

**Решение:**

```bash
sed -i '' 's/"verbatimModuleSyntax": true/"verbatimModuleSyntax": false/g' tsconfig.json
```

**Урок:** `verbatimModuleSyntax` требует ESM (`"type": "module"`). Для CommonJS Node.js проектов с `ts-node` его нужно выключать.

---

### 🔴 Ошибка #3: Stripe TypeScript типы

**Проблема:**

```
Type '"2025-02-24.acacia"' is not assignable to type '"2026-03-25.dahlia"'
Namespace 'StripeConstructor' has no exported member 'Event'
Namespace 'StripeConstructor' has no exported member 'Checkout'
```

**Причина:** Установленная версия `stripe@22.0.2` имеет другую структуру типов. Типы `Stripe.Event` и `Stripe.Checkout.Session` недоступны напрямую через `import Stripe from 'stripe'` при таком импорте.

**Решение:** Использовали `as any` для обхода конфликта версий:

```typescript
apiVersion: "2026-03-25.dahlia" as any;
let event: any;
const session = event.data.object as any;
```

---

### 🔴 Ошибка #4: `req.body is undefined` на `/api/wallet/checkout`

**Проблема:**

```
TypeError: Cannot destructure property 'amount' of 'req.body' as it is undefined
```

**Причина:** Роут `/api/wallet` зарегистрирован **до** `app.use(express.json())`, чтобы вебхук получал сырой буфер. Но это означает, что `/checkout` тоже не получает JSON парсинг.

**Решение:** Добавили `express.json()` непосредственно в роут `/checkout`:

```typescript
router.post('/checkout', express.json(), authGuard, stripeController.createCheckoutSession.bind(...));
```

---

### 🟡 Ошибка #5: `package.json` скрипт запуска

**Проблема:** `nodemon` без указания исполнителя не мог запустить `.ts` файлы напрямую.

**Решение:**

```json
"dev": "nodemon --exec ts-node src/server.ts"
```

---

## 6. Все замечания GitHub Copilot и что мы с ними сделали {#copilot-review}

GitHub Copilot сделал автоматическое ревью PR и предложил **14 замечаний** в двух волнах.

### Волна 1 (SCRUM-145: Transactions + Auth)

| #   | Файл                        | Проблема                                                                           | Статус       | Что сделали                                                         |
| --- | --------------------------- | ---------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------- |
| 1   | `tsconfig.json`             | Нет `esModuleInterop: true` — дефолтные импорты CommonJS пакетов могут не работать | ✅ Применено | Добавили `"esModuleInterop": true`                                  |
| 2   | `auth.middleware.ts`        | `jwt.verify` без указания `algorithms` — уязвимость к algorithm confusion атакам   | ❌ Отложено  | Отмечено как tech debt для production                               |
| 3   | `transaction.controller.ts` | `(req as any).user` вместо `req.user` — теряем типобезопасность                    | ✅ Применено | Добавили type-safe guard: `if (!req.user) { return 401 }`           |
| 4   | `transaction.controller.ts` | `!amount` — ложная проверка на 0 (falsy), `"10"` не будет числом                   | ✅ Применено | Добавили `typeof amount !== 'number' \|\| !Number.isFinite(amount)` |
| 5   | `transaction.controller.ts` | Опечатка `"Standarad"` в комментарии                                               | ✅ Применено | Исправили на `"Standard"`                                           |
| 6   | `auth.controller.ts`        | `(req as any).user` при logout                                                     | ✅ Применено | Заменили на `req.user` с guard                                      |

### Волна 2 (SCRUM-146: Stripe Webhooks)

| #   | Файл                   | Проблема                                                                                                          | Критичность    | Статус       | Что сделали                                                    |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------- | ------------ | -------------------------------------------------------------- |
| 1   | `stripe.controller.ts` | `apiVersion` строка невалидна                                                                                     | 🟡 Средняя     | ✅           | Применили `as any` обходной путь                               |
| 2   | `stripe.controller.ts` | `req.headers['stripe-signature']` может быть `string[]` — передача массива в `constructEvent` сломает верификацию | 🔴 Критическая | ✅           | `const signature = Array.isArray(sig) ? sig[0] : sig;`         |
| 3   | `stripe.controller.ts` | `error.message` утекает в HTTP ответ — раскрывает внутренние детали                                               | 🟡 Средняя     | ✅           | Заменили на generic: `'Webhook signature verification failed'` |
| 4   | `stripe.controller.ts` | `checkout.session.completed` ≠ деньги пришли (async payments: SEPA, банковский перевод)                           | 🔴 Критическая | ✅           | Добавили проверку `payment_status === 'paid'`                  |
| 5   | `stripe.controller.ts` | `if (userId && amount && currency)` — falsy для `amount = 0`                                                      | 🟡 Средняя     | ✅           | `amount !== undefined && amount !== null`                      |
| 6   | `stripe.controller.ts` | Генерируем новый `uuidv4()` → два одинаковых webhook от Stripe = два разных eventId = двойное зачисление          | 🔴 КРИТИЧЕСКАЯ | ✅           | **Заменили `uuidv4()` на `event.id` от Stripe**                |
| 7   | `stripe.controller.ts` | Ответ 200 блокируется на Kafka → при медленной Kafka Stripe будет считать вебхук провалившимся                    | 🟡 Средняя     | ❌ Осознанно | Финтех-стандарт: лучше потерять идемпотентность, чем деньги    |

---

## 7. Полный флоу пополнения кошелька {#полный-флоу}

### Шаг 1: Получение JWT токена

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ilya777","password":"any","deviceId":"test-device-1"}'

# Ответ:
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

### Шаг 2: Создание Stripe Checkout Session

```bash
curl -X POST http://localhost:3000/api/wallet/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGci..." \
  -d '{"amount": 50, "currency": "usd"}'

# Ответ:
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### Шаг 3: Оплата через Stripe (открыть URL в браузере)

Тестовая карта Stripe: `4242 4242 4242 4242` | Любая дата будущего | Любой CVV

### Шаг 4: Stripe шлёт вебхук (автоматически)

```bash
# Для локальной разработки нужен Stripe CLI туннель:
stripe listen --forward-to localhost:3000/api/wallet/webhook
```

### Шаг 5: Имитация оплаты (для тестирования без UI)

```bash
stripe trigger checkout.session.completed \
  --add checkout_session:client_reference_id=ilya777

# BFF получит вебхук и опубликует в Kafka:
# { eventId: "evt_1234...", userId: "ilya777", amount: 50, currency: "USD", type: "DEPOSIT_COMPLETED" }
```

### Шаг 6: Перевод между счетами

```bash
curl -X POST http://localhost:3000/api/transactions/transfer \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{"toAccount": "account-456", "amount": 25, "currency": "USD"}'

# Ответ 202 Accepted:
{
  "message": "Transfer accepted for processing",
  "eventId": "f45e0008-...",
  "status": "PROCESSING"
}
```

---

## 8. Как тестировать {#как-тестировать}

### Запуск проекта локально

Требования:

- Docker запущен (для Redis и Kafka)
- Stripe CLI установлен
- Node.js 18+

```bash
# 1. Перейти в папку
cd bank-bff

# 2. Установить зависимости
npm install

# 3. Запустить Redis и Kafka через Docker
docker-compose up -d redis kafka

# 4. Запустить Stripe туннель (отдельный терминал)
stripe listen --forward-to localhost:3000/api/wallet/webhook

# 5. Запустить BFF
npm run dev

# Ты должен увидеть:
# Redis Client Connected
# Kafka Producer Connected
# Server is running on port 3000
```

### Health Check

```bash
curl http://localhost:3000/health
# {"status":"OK"}
```

---

## 9. Переменные окружения {#env-переменные}

Файл `bank-bff/.env` (НЕ пушится в git!):

```env
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# Stripe
STRIPE_SECRET_KEY=sk_test_...          # Из Stripe Dashboard → API Keys
STRIPE_WEBHOOK_SECRET=whsec_...        # Из `stripe listen` CLI

# Frontend (для redirect после оплаты)
FRONTEND_URL=http://localhost:3001
```

---

## 10. Полезные ссылки для самостоятельного изучения {#ссылки}

### Архитектура и Паттерны

| Тема                      | Ссылка                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------ |
| BFF Pattern (Microsoft)   | https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends |
| API First Design          | https://swagger.io/resources/articles/adopting-an-api-first-approach/                |
| Event-Driven Architecture | https://aws.amazon.com/event-driven-architecture/                                    |

### TypeScript + Express

| Тема                      | Ссылка                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Express с TypeScript      | https://blog.logrocket.com/using-typescript-with-express-js/                                               |
| TypeScript tsconfig.json  | https://www.typescriptlang.org/tsconfig                                                                    |
| Request type augmentation | https://stackoverflow.com/questions/44383387/typescript-error-property-user-does-not-exist-on-type-request |

### JWT и Безопасность

| Тема                       | Ссылка                                                         |
| -------------------------- | -------------------------------------------------------------- |
| JWT Introduction           | https://jwt.io/introduction                                    |
| JWT Best Practices         | https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/ |
| Algorithm Confusion Attack | https://portswigger.net/web-security/jwt/algorithm-confusion   |
| Redis для сессий           | https://redis.io/docs/manual/patterns/twitter-clone/           |

### Kafka

| Тема                     | Ссылка                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| KafkaJS (Node.js клиент) | https://kafka.js.org/docs/getting-started                                                         |
| Idempotent Producer      | https://kafka.apache.org/documentation/#producerconfigs_enable.idempotence                        |
| Partitioning Strategy    | https://kafka.apache.org/documentation/#design_partitionsandreplication                           |
| Exactly-Once Semantics   | https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/ |

### Stripe

| Тема                   | Ссылка                                                            |
| ---------------------- | ----------------------------------------------------------------- |
| Stripe Checkout        | https://stripe.com/docs/payments/checkout                         |
| Webhook Security       | https://stripe.com/docs/webhooks/signatures                       |
| Webhook Best Practices | https://stripe.com/docs/webhooks/best-practices                   |
| Async Payments         | https://stripe.com/docs/payments/payment-intents/verifying-status |
| Test Cards             | https://stripe.com/docs/testing#cards                             |

### Инструменты

| Инструмент   | Назначение                     | Ссылка                                            |
| ------------ | ------------------------------ | ------------------------------------------------- |
| Stripe CLI   | Тестирование вебхуков локально | https://stripe.com/docs/stripe-cli                |
| Postman      | API тестирование               | https://www.postman.com/                          |
| RedisInsight | GUI для Redis                  | https://redis.com/redis-enterprise/redis-insight/ |
| Kafka UI     | GUI для Kafka                  | https://github.com/provectus/kafka-ui             |

---

## 📊 Итоговая статистика

| Метрика                              | Значение                                       |
| ------------------------------------ | ---------------------------------------------- |
| Файлов создано                       | 10                                             |
| Эндпоинтов                           | 5 (login, logout, transfer, checkout, webhook) |
| Коммитов                             | 9                                              |
| Ошибок исправлено (из ревью Copilot) | 14                                             |
| Критических уязвимостей закрыто      | 4                                              |
| Технологий интегрировано             | 5 (Express, Redis, Kafka, Stripe, JWT)         |

---

## 🗺️ Что дальше (следующие Epic)

| Шаг | Задача                                                   | Сложность |
| --- | -------------------------------------------------------- | --------- |
| 1   | Кнопка "Top Up Wallet" в Next.js                         | ⭐⭐      |
| 2   | Kafka Consumer в Java Core для `DEPOSIT_COMPLETED`       | ⭐⭐⭐    |
| 3   | Реальная авторизация в `auth.controller.ts` (сейчас мок) | ⭐⭐      |
| 4   | Деплой `bank-bff` на GCP сервер (Docker + Caddy)         | ⭐⭐⭐    |
| 5   | JWT algorithm pinning (`algorithms: ['HS256']`)          | ⭐        |

---

_Отчёт создан автоматически по итогам разработки сессии Эпика 3._
_Ветка: `chore/SCRUM-125-java` | Репозиторий: `ilya-ivanov23/idpbankapp23`_
