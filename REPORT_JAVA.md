# 📋 Технический отчёт: IDP Bank — Core Engine & Инфраструктура

**Дата:** Апрель 2026 | **Ветка:** chore/SCRUM-125-java → develop | **Статус:** ACTIVE & SECURED 🚀

---

## 1. Архитектура монорепозитория

```
idpbankapp23/
├── bank_nextjs/          ← Фронтенд (Next.js, TypeScript)
├── core-engine/          ← Бэкэнд (Java 21, Spring Boot 3.5)
│   ├── src/main/java/    ← Весь Java-код
│   ├── src/resources/    ← Настройки и миграции БД
│   ├── Dockerfile
│   └── pom.xml
├── idpbank-infra/        ← Инфраструктура (Docker Compose)
└── .github/workflows/    ← CI/CD пайплайны
```

---

## 2. CoreEngineApplication.java — Точка входа

```java
package com.idpbank.core_engine;   // Адрес файла в Java (как папки)

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication   // Главная аннотация — запускает ВЕСЬ Spring
public class CoreEngineApplication {
    public static void main(String[] args) {
        SpringApplication.run(CoreEngineApplication.class, args); // Стартует сервер
    }
}
```

**`@SpringBootApplication`** делает сразу три вещи:
- `@EnableAutoConfiguration` — Spring сам настраивает БД, Kafka и т.д.
- `@ComponentScan` — находит все наши @Service, @Repository
- `@SpringBootConfiguration` — это конфигурация Spring

---

## 3. TransactionEvent.java — DTO (объект данных)

```java
package com.idpbank.core_engine.dto;  // dto = Data Transfer Object

import lombok.Data;          // Magic-библиотека, генерирует геттеры/сеттеры
import java.math.BigDecimal; // БЕЗ ОШИБОК точности! (не double!)
import java.util.UUID;       // Глобально уникальный ID

@Data  // Автоматически создаёт getters, setters, toString, equals, hashCode
public class TransactionEvent {
    private UUID fromAccountId;   // null = внешнее пополнение (Stripe)
    private UUID toAccountId;     // Получатель — всегда обязателен
    private BigDecimal amount;    // ВАЖНО: BigDecimal, не double (0.1+0.2=0.3!)
    private String idempotencyKey; // Уникальный "отпечаток" — защита от дублей
}
```

**Почему `BigDecimal`, а не `double`?**
В Java: `0.1 + 0.2 = 0.30000000000000004`
`BigDecimal` всегда точен — стандарт для финансовых систем.

**Почему `fromAccountId` может быть `null`?**
Одна DTO покрывает два сценария:
- `fromAccountId != null` → перевод между счетами
- `fromAccountId == null` → пополнение через Stripe снаружи

---

## 4. Account.java — Сущность (Entity)

```java
package com.idpbank.core_engine.entity;

import jakarta.persistence.*;  // JPA = стандарт для работы с БД в Java
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.UUID;

@Entity                        // Hibernate: этот класс = строка в таблице
@Table(name = "accounts")     // Связан с таблицей "accounts" в PostgreSQL
@Getter                        // @Getter + @Setter безопаснее чем @Data для JPA!
@Setter                        // @Data может вызвать бесконечные циклы в Hibernate
public class Account {
    @Id                        // Первичный ключ таблицы
    private UUID id;

    @Column(name = "balance", nullable = false) // NOT NULL в SQL
    private BigDecimal balance;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "currency")
    private String currency;
}
```

**Почему `@Getter/@Setter` а не `@Data`?**
`@Data` генерирует `equals/hashCode` через все поля.
Hibernate при "ленивой загрузке" может попытаться сравнить незагруженные объекты → бесконечный цикл.
С `@Getter/@Setter` мы не генерируем опасные методы автоматически.

---

## 5. Transaction.java — Сущность транзакции

```java
@Entity
@Table(name = "transactions")
@Getter
@Setter
public class Transaction {
    @Id
    private UUID id;

    @ManyToOne                              // Связь: много транзакций → один счёт
    @JoinColumn(name = "from_account_id")  // Имя столбца внешнего ключа в БД
    private Account fromAccount;            // Объект Account, не просто UUID!

    @ManyToOne
    @JoinColumn(name = "to_account_id")
    private Account toAccount;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "status", nullable = false)
    private String status;  // "PENDING", "COMPLETED", "FAILED"

    @Column(name = "idempotency_key", nullable = false, unique = true)
    private String idempotencyKey;  // unique = UNIQUE constraint в БД (2-й уровень защиты!)
}
```

**`@ManyToOne`** — это JOIN в SQL.
Hibernate сам подгружает объект Account когда нужно.
Мы работаем с `tx.getFromAccount().getBalance()`, а не с UUID.

**`unique = true` на `idempotencyKey`** — двойная защита:
1. В коде: `existsByIdempotencyKey()` перед сохранением
2. В базе: UNIQUE constraint — физически не даст вставить дубль

---

## 6. AccountRepository.java — Репозиторий с блокировкой

```java
package com.idpbank.core_engine.repository;

import com.idpbank.core_engine.entity.Account;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository  // Spring создаст реализацию этого интерфейса автоматически
public interface AccountRepository extends JpaRepository<Account, UUID> {
    // JpaRepository даёт БЕСПЛАТНО: findById(), save(), delete(), findAll() и т.д.

    @Lock(LockModeType.PESSIMISTIC_WRITE)  // ← ЭТО КЛЮЧ К БЕЗОПАСНОСТИ!
    @Query("SELECT a FROM Account a WHERE a.id = :id")  // JPQL (SQL для Java-объектов)
    Optional<Account> findByIdForUpdate(@Param("id") UUID id);
}
```

**Как работает `@Lock(PESSIMISTIC_WRITE)`?**

PostgreSQL выполняет: `SELECT * FROM accounts WHERE id=? FOR UPDATE`

`FOR UPDATE` = эксклюзивная блокировка строки.
Пока наша транзакция не завершится — никто другой не может изменить эту строку.

Сценарий без блокировки (ОПАСНО):
```
Поток 1: читает баланс = 100$
Поток 2: читает баланс = 100$
Поток 1: списывает 50$, сохраняет 50$
Поток 2: списывает 50$, сохраняет 50$
Итог: списали 100$, но баланс = 50$, а не 0$ → деньги из воздуха!
```

Сценарий с блокировкой (БЕЗОПАСНО):
```
Поток 1: блокирует строку, читает 100$, списывает 50$, сохраняет 50$, снимает блокировку
Поток 2: ждёт... получает строку с 50$, списывает 50$, сохраняет 0$
Итог: 100$ списано правильно
```

**`Optional<Account>`** — безопасная обёртка.
Если счёт не найден → `Optional.empty()`, а не `null`.
Мы явно обрабатываем это через `.orElseThrow()`.

---

## 7. TransactionRepository.java

```java
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    boolean existsByIdempotencyKey(String idempotencyKey);
    // Spring Data САМ строит SQL: SELECT COUNT(*) > 0 FROM transactions WHERE idempotency_key = ?
    // Это называется "Query Derivation" — запрос выводится из имени метода!
}
```

---

## 8. V1__init.sql — Схема базы данных (Flyway)

```sql
-- Flyway: V1 = версия 1, __init = описание, .sql = файл SQL
-- Запускается автоматически при старте приложения!

CREATE TABLE users (
    id UUID PRIMARY KEY,            -- UUID, не INT — безопаснее при масштабировании
    email VARCHAR(255) UNIQUE NOT NULL, -- Уникальный email
    password_hash VARCHAR(255) NOT NULL, -- НИКОГДА не храним пароль в открытом виде!
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Внешний ключ
    -- ON DELETE CASCADE = при удалении пользователя, счета удаляются тоже
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00, -- 15 цифр, 2 после запятой
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',   -- ISO 4217: USD, EUR, RUB
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    from_account_id UUID REFERENCES accounts(id),  -- Nullable! Внешнее пополнение.
    to_account_id UUID REFERENCES accounts(id),
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,                   -- PENDING, COMPLETED, FAILED
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,  -- UNIQUE в БД = 2-й уровень защиты
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индексы = "оглавление книги" для быстрого поиска
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON transactions(to_account_id);
-- Без индексов: PostgreSQL перебирает ВСЕ строки (Full Table Scan) — медленно!
-- С индексами: мгновенный поиск при миллионах транзакций
```

---

## 9. TransactionService.java — Главная бизнес-логика (разбор построчно)

```java
@Service              // Spring создаёт один экземпляр (Singleton) этого класса
@RequiredArgsConstructor // Lombok: создаёт конструктор для всех final полей
@Slf4j                // Lombok: создаёт объект log для логирования
public class TransactionService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    // private final = нельзя переназначить
    // Spring автоматически "инжектирует" реализации при создании класса (DI)

    @Transactional  // АТОМАРНОСТЬ: если что-то упадёт — ВСЁ откатится (ROLLBACK)
    public void processTransfer(TransactionEvent event) {
        log.info("Starting transaction: {}", event.getIdempotencyKey());

        // ШАГ 1: ИДЕМПОТЕНТНОСТЬ — была ли уже эта транзакция?
        if (transactionRepository.existsByIdempotencyKey(event.getIdempotencyKey())) {
            log.warn("Already processed! Ignoring: {}", event.getIdempotencyKey());
            return; // Нормальная ситуация, не ошибка — Kafka retry не нужен
        }

        // ШАГ 2: Создаём объект транзакции (пока только в памяти, не в БД)
        Transaction tx = new Transaction();
        tx.setId(UUID.randomUUID());         // Генерируем уникальный ID
        tx.setAmount(event.getAmount());
        tx.setIdempotencyKey(event.getIdempotencyKey());

        // ШАГ 3: Блокируем счёт получателя (SELECT FOR UPDATE)
        Account toAccount = accountRepository.findByIdForUpdate(event.getToAccountId())
                .orElseThrow(() -> new IllegalArgumentException(
                    "Receiver not found: " + event.getToAccountId()));
        tx.setToAccount(toAccount);

        // ШАГ 4: Это перевод или внешнее пополнение?
        if (event.getFromAccountId() != null) {
            // == ПЕРЕВОД МЕЖДУ СЧЕТАМИ ==
            Account fromAccount = accountRepository.findByIdForUpdate(
                    event.getFromAccountId())
                    .orElseThrow(() -> new IllegalArgumentException(
                        "Sender not found: " + event.getFromAccountId()));
            tx.setFromAccount(fromAccount);

            // ШАГ 5: Проверяем баланс (compareTo — для BigDecimal, не <)
            if (fromAccount.getBalance().compareTo(event.getAmount()) < 0) {
                log.error("Insufficient funds: {}", fromAccount.getId());
                tx.setStatus("FAILED");
                transactionRepository.save(tx); // Сохраняем даже неудачу — аудит-лог!
                return;
            }

            // ШАГ 6: Списываем деньги (subtract возвращает НОВЫЙ BigDecimal — иммутабельность)
            fromAccount.setBalance(fromAccount.getBalance().subtract(event.getAmount()));
            accountRepository.save(fromAccount);
        } else {
            // == ВНЕШНЕЕ ПОПОЛНЕНИЕ (Stripe, банковский перевод) ==
            log.info("External deposit/top-up transaction.");
        }

        // ШАГ 7: Зачисляем получателю (всегда, и при переводе, и при пополнении)
        toAccount.setBalance(toAccount.getBalance().add(event.getAmount()));
        accountRepository.save(toAccount);

        tx.setStatus("COMPLETED");
        transactionRepository.save(tx); // Только здесь сохраняем в БД!
        // Если что-то упало выше, @Transactional откатит ВСЁ
    }
}
```

**Принцип ACID реализован через `@Transactional`:**
- **A**tomicity (Атомарность) — либо всё, либо ничего
- **C**onsistency (Согласованность) — данные всегда корректны
- **I**solation (Изоляция) — блокировки защищают от race conditions
- **D**urability (Долговечность) — данные сохранены после commit

---

## 10. TransactionConsumer.java — Слушатель Kafka

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionConsumer {

    private final TransactionService transactionService;
    // Consumer знает только о существовании сервиса — не о его деталях
    // Это принцип Single Responsibility (SRP) — Consumer только получает, Сервис только обрабатывает

    @KafkaListener(
        topics = "bank-transactions",  // Слушаем этот топик
        groupId = "bank-core-group"    // Group ID: если 3 экземпляра бэкэнда,
    )                                  // Kafka сам распределит сообщения между ними!
    public void consumeTransaction(TransactionEvent event) {
        // Spring автоматически десериализует JSON из Kafka в объект TransactionEvent
        log.info("NEW TRANSFER FROM KAFKA: {}", event.getIdempotencyKey());

        try {
            transactionService.processTransfer(event);
        } catch (Exception e) {
            log.error("CRITICAL ERROR {}: {}", event.getIdempotencyKey(), e.getMessage(), e);
            throw e;  // ← КРИТИЧЕСКИ ВАЖНО! Исправление по совету Copilot
            // БЕЗ throw e: Kafka думает "обработано OK", удаляет сообщение → деньги потеряны!
            // С throw e: Kafka понимает "сбой" → запускает retry или Dead Letter Queue
        }
    }
}
```

**Как Kafka retry работает:**
```
1. Consumer получил сообщение
2. Бросил исключение (throw e)
3. Kafka: "Не обработано!" → ждёт N секунд → пробует снова
4. После MAX_RETRIES попыток → отправляет в Dead Letter Topic (DLT)
5. DLT = "очередь" неудачных сообщений для ручного разбора
```

---

## 11. Dockerfile — Multi-stage сборка

```dockerfile
# ═══════════════════════════════════════════
# ЭТАП 1: СБОРКА (Build Stage) — тяжёлый образ
# ═══════════════════════════════════════════
FROM maven:3.9.6-eclipse-temurin-21 AS build
# Образ с полным JDK 21 + Maven — ~500МБ
# AS build = псевдоним этапа

WORKDIR /app  # Рабочая директория внутри контейнера

COPY pom.xml .
# Сначала ТОЛЬКО pom.xml — Docker кэширует Layer!
# Если изменили только код, зависимости не скачиваются снова → экономия минут

RUN mvn dependency:go-offline
# Скачиваем все зависимости. Медленно (1-5 мин), но кэшируется!

COPY src ./src  # Теперь копируем код

RUN mvn clean package -DskipTests
# Компиляция + создание .jar файла
# -DskipTests = тесты запускаются в CI отдельно, не здесь

# ═══════════════════════════════════════════
# ЭТАП 2: ЗАПУСК (Runtime Stage) — лёгкий образ
# ═══════════════════════════════════════════
FROM eclipse-temurin:21-jre-alpine
# ТОЛЬКО JRE (не JDK!) + Alpine Linux
# JRE = только для запуска, без инструментов разработки
# Alpine = минимальный Linux
# Итоговый размер: ~150МБ вместо ~500МБ

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar
# Магия Multi-stage! Берём ТОЛЬКО .jar из этапа "build"
# Весь Maven, исходники, кэш — НЕ попадают в финальный образ
# Меньше образ = быстрее деплой, меньше уязвимостей

ENTRYPOINT ["java", "-jar", "app.jar"]
# Команда при запуске контейнера
```

**Результат Multi-stage:**
- Этап 1 (build): 500МБ — используется только во время сборки
- Этап 2 (runtime): 150МБ — именно это едет на сервер

---

## 12. core-engine-ci.yml — Автоматический деплой

```yaml
name: Core Engine CI/CD

on:
  push:
    branches: [ "develop", "main" ]
    paths:
      - 'core-engine/**'  # Умно! Запускается ТОЛЬКО если изменился Java-код
                          # Изменил фронт? Этот пайплайн НЕ запустится

env:
  REGISTRY: ghcr.io  # GitHub Container Registry (бесплатно для публичных репо)
  IMAGE_NAME: ${{ github.repository }}-core-engine
  # → ghcr.io/ilya-ivanov23/idpbankapp23-core-engine

jobs:
  build-and-push:
    runs-on: ubuntu-latest  # GitHub даёт виртуальную машину с Ubuntu
    permissions:
      packages: write  # Разрешение писать в GitHub Packages

    steps:
      - uses: actions/checkout@v4  # Шаг 1: скачать код репо

      - uses: docker/login-action@v3  # Шаг 2: авторизоваться в GHCR
        with:
          registry: ghcr.io
          username: ${{ github.actor }}  # Твой логин в GitHub
          password: ${{ secrets.GITHUB_TOKEN }}  # Авто-токен! Не нужно создавать вручную

      - name: Lowercase image name  # Docker требует нижний регистр в именах
        run: echo "IMAGE_NAME_LOWER=${IMAGE_NAME,,}" >> ${GITHUB_ENV}
        # ${VAR,,} — Bash-синтаксис для lower case

      - uses: docker/build-push-action@v5  # Шаг 3: собрать и запушить образ
        with:
          context: ./core-engine  # Dockerfile ищем тут
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_LOWER }}:latest
          # → ghcr.io/ilya-ivanov23/idpbankapp23-core-engine:latest
```

**Полный цикл:** `git push` → GitHub Actions → Docker build → GHCR → `docker compose pull` на сервере

---

## 13. Итоговая архитектура (как всё связано)

```
Пользователь                Сервер GCP
    │                           │
    │  Открывает сайт банка     │
    ├──────────────────────────>│ bank_nextjs (Next.js, порт 3000)
    │                           │
    │  Делает перевод           │
    │                           │ bank_nextjs publish → Kafka topic "bank-transactions"
    │                           │
    │                           │ bank_core @KafkaListener ← СЛУШАЕТ этот топик
    │                           │    │
    │                           │    ├─ existsByIdempotencyKey? → защита от дублей
    │                           │    ├─ findByIdForUpdate() → блокировка в PostgreSQL
    │                           │    ├─ проверка баланса
    │                           │    ├─ subtract/add баланс
    │                           │    └─ save() → PostgreSQL сохраняет результат
    │                           │
    │  Видит обновлённый баланс │
    │<──────────────────────────│
```

---

## 14. Ресурсы для изучения

| Тема | Ссылка |
|------|--------|
| Spring Boot | https://docs.spring.io/spring-boot/docs/current/reference/html/ |
| Spring Data JPA | https://docs.spring.io/spring-data/jpa/docs/current/reference/html/ |
| JPA & Hibernate аннотации | https://www.baeldung.com/jpa-entities |
| Pessimistic Locking | https://www.baeldung.com/jpa-pessimistic-locking |
| @Transactional и ACID | https://www.baeldung.com/transaction-configuration-with-jpa-and-spring |
| Lombok | https://projectlombok.org/features/all |
| BigDecimal для финансов | https://www.baeldung.com/java-bigdecimal-biginteger |
| Spring Kafka | https://docs.spring.io/spring-kafka/docs/current/reference/html/ |
| Idempotency в API | https://stripe.com/docs/idempotency |
| Docker Multi-stage | https://docs.docker.com/build/building/multi-stage/ |
| GitHub Actions | https://docs.github.com/en/actions |
| ACID в PostgreSQL | https://www.postgresql.org/docs/current/transaction-iso.html |
| Event-Driven Architecture | https://martinfowler.com/articles/201701-event-driven.html |
| Flyway миграции | https://flywaydb.org/documentation/ |

---

*Статус: Все изменения влиты в `develop`. Система запущена на GCP и работает.*
