package com.idpbank.core_engine.service;

import com.idpbank.core_engine.dto.TransactionEvent;
import com.idpbank.core_engine.entity.Account;
import com.idpbank.core_engine.entity.Transaction;
import com.idpbank.core_engine.repository.AccountRepository;
import com.idpbank.core_engine.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    @Transactional
    public void processTransfer(TransactionEvent event) {
        log.info("Начинаем обработку транзакции: {}", event.getIdempotencyKey());

        // 1. Проверка на идемпотентность (защита от двойного клика)
        if (transactionRepository.existsByIdempotencyKey(event.getIdempotencyKey())) {
            log.warn("Транзакция {} уже была обработана! Игнорируем.", event.getIdempotencyKey());
            return;
        }

        // Создаем новую запись о транзакции
        Transaction tx = new Transaction();
        tx.setId(UUID.randomUUID());
        tx.setAmount(event.getAmount());
        tx.setIdempotencyKey(event.getIdempotencyKey());

        // 2. Ищем счета в базе
        Account fromAccount = accountRepository.findById(event.getFromAccountId())
                .orElseThrow(() -> new RuntimeException("Счет отправителя не найден"));
        Account toAccount = accountRepository.findById(event.getToAccountId())
                .orElseThrow(() -> new RuntimeException("Счет получателя не найден"));

        tx.setFromAccount(fromAccount);
        tx.setToAccount(toAccount);

        // 3. Проверяем баланс
        if (fromAccount.getBalance().compareTo(event.getAmount()) < 0) {
            log.error("Недостаточно средств на счете: {}", fromAccount.getId());
            tx.setStatus("FAILED");
            transactionRepository.save(tx);
            return;
        }

        // 4. Списание и зачисление
        fromAccount.setBalance(fromAccount.getBalance().subtract(event.getAmount()));
        toAccount.setBalance(toAccount.getBalance().add(event.getAmount()));

        // 5. Сохраняем новые балансы и историю
        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        tx.setStatus("COMPLETED");
        transactionRepository.save(tx);

        log.info("Успешный перевод! От {} к {} на сумму {}", fromAccount.getId(), toAccount.getId(), event.getAmount());
    }
}

