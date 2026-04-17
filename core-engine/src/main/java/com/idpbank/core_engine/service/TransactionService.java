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
        log.info("Starting transaction processing: {}", event.getIdempotencyKey());

        // 1. Idempotency check (protection against double processing)
        if (transactionRepository.existsByIdempotencyKey(event.getIdempotencyKey())) {
            log.warn("Transaction {} has already been processed! Ignoring.", event.getIdempotencyKey());
            return;
        }

        // Create a new transaction record
        Transaction tx = new Transaction();
        tx.setId(UUID.randomUUID());
        tx.setAmount(event.getAmount());
        tx.setIdempotencyKey(event.getIdempotencyKey());

        // 2. Fetch receiver account with Pessimistic Lock
        Account toAccount = accountRepository.findByIdForUpdate(event.getToAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Receiver account not found: " + event.getToAccountId()));
        tx.setToAccount(toAccount);

        // 3. If it's a transfer (not a top-up), check sender
        if (event.getFromAccountId() != null) {
            Account fromAccount = accountRepository.findByIdForUpdate(event.getFromAccountId())
                    .orElseThrow(() -> new IllegalArgumentException("Sender account not found: " + event.getFromAccountId()));
            tx.setFromAccount(fromAccount);

            // 4. Check balance
            if (fromAccount.getBalance().compareTo(event.getAmount()) < 0) {
                log.error("Insufficient funds in account: {}", fromAccount.getId());
                tx.setStatus("FAILED");
                transactionRepository.save(tx);
                return;
            }

            // 5. Debit sender
            fromAccount.setBalance(fromAccount.getBalance().subtract(event.getAmount()));
            accountRepository.save(fromAccount);
            log.info("Debited {} from sender account {}", event.getAmount(), fromAccount.getId());
        } else {
            // It's a deposit/top-up
            log.info("From account is null. Executing as a deposit/top-up transaction.");
        }

        // 6. Credit receiver
        toAccount.setBalance(toAccount.getBalance().add(event.getAmount()));
        accountRepository.save(toAccount);

        tx.setStatus("COMPLETED");
        transactionRepository.save(tx);

        log.info("Successful transfer processed for amount {} to account {}", event.getAmount(), toAccount.getId());
    }
}

