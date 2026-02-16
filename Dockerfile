# 1. Берем основу: легкий Linux с Node.js 20
FROM node:20-alpine AS base

# 2. Устанавливаем зависимости (Deps)
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Собираем проект (Builder)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APPWRITE_ENDPOINT
ARG NEXT_PUBLIC_APPWRITE_PROJECT
ARG APPWRITE_DATABASE_ID
ARG APPWRITE_USER_COLLECTION_ID
ARG APPWRITE_BANK_COLLECTION_ID
ARG APPWRITE_TRANSACTION_COLLECTION_ID
ARG APPWRITE_KEY
ARG PLAID_CLIENT_ID
ARG PLAID_SECRET
ARG PLAID_ENV
ARG DWOLLA_KEY
ARG DWOLLA_SECRET
ARG DWOLLA_ENV
ARG DWOLLA_BASE_URL

# for npm run build
ENV NEXT_PUBLIC_APPWRITE_ENDPOINT=$NEXT_PUBLIC_APPWRITE_ENDPOINT
ENV NEXT_PUBLIC_APPWRITE_PROJECT=$NEXT_PUBLIC_APPWRITE_PROJECT
ENV APPWRITE_DATABASE_ID=$APPWRITE_DATABASE_ID
ENV APPWRITE_USER_COLLECTION_ID=$APPWRITE_USER_COLLECTION_ID
ENV APPWRITE_BANK_COLLECTION_ID=$APPWRITE_BANK_COLLECTION_ID
ENV APPWRITE_TRANSACTION_COLLECTION_ID=$APPWRITE_TRANSACTION_COLLECTION_ID
ENV APPWRITE_KEY=$APPWRITE_KEY
ENV PLAID_CLIENT_ID=$PLAID_CLIENT_ID
ENV PLAID_SECRET=$PLAID_SECRET
ENV PLAID_ENV=$PLAID_ENV
ENV DWOLLA_KEY=$DWOLLA_KEY
ENV DWOLLA_SECRET=$DWOLLA_SECRET
ENV DWOLLA_ENV=$DWOLLA_ENV
ENV DWOLLA_BASE_URL=$DWOLLA_BASE_URL

# Отключаем телеметрию Next.js (хороший тон)
ENV NEXT_TELEMETRY_DISABLED=1

# Собираем проект
RUN npm run build

# 4. Финальный образ (Runner) - то, что пойдет в продакшн
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаем системного пользователя (безопасность - чтобы не запускать от root)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем только нужное из папки сборки
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Переключаемся на безопасного пользователя
USER nextjs

# Открываем порт 3000
EXPOSE 3000
ENV PORT=3000

# Команда запуска
CMD ["node", "server.js"]