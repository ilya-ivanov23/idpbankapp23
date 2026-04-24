package com.idpbank.core_engine.service;

import com.idpbank.core_engine.dto.ExchangeRequestDto;
import com.idpbank.core_engine.entity.Account;
import com.idpbank.core_engine.entity.Transaction;
import com.idpbank.core_engine.repository.AccountRepository;
import com.idpbank.core_engine.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    @Transactional
    public void executeExchange(ExchangeRequestDto request) {
        log.info("Starting exchange: {} from {} to {} with rate {}", 
                request.getAmountToDebit(), request.getFromAccountId(), request.getToAccountId(), request.getExchangeRate());

        // Idempotency check
        if (transactionRepository.existsByIdempotencyKey(request.getIdempotencyKey())) {
            log.warn("Exchange {} already processed", request.getIdempotencyKey());
            return;
        }

        if (request.getFromAccountId() == null || request.getToAccountId() == null || request.getExchangeRate() == null || request.getAmountToDebit() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields for exchange");
        }
        if (request.getFromAccountId().equals(request.getToAccountId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot exchange within the same account");
        }

        // Always lock in a consistent order to prevent deadlocks (e.g. by UUID)
        UUID firstLock = request.getFromAccountId().compareTo(request.getToAccountId()) < 0 ? request.getFromAccountId() : request.getToAccountId();
        UUID secondLock = request.getFromAccountId().compareTo(request.getToAccountId()) < 0 ? request.getToAccountId() : request.getFromAccountId();

        Account firstAccount = accountRepository.findByIdForUpdate(firstLock)
                .orElseThrow(() -> new IllegalArgumentException("Account not found: " + firstLock));
        Account secondAccount = accountRepository.findByIdForUpdate(secondLock)
                .orElseThrow(() -> new IllegalArgumentException("Account not found: " + secondLock));

        Account fromAccount = firstAccount.getId().equals(request.getFromAccountId()) ? firstAccount : secondAccount;
        Account toAccount = firstAccount.getId().equals(request.getToAccountId()) ? firstAccount : secondAccount;

        // Verify balance
        if (fromAccount.getBalance().compareTo(request.getAmountToDebit()) < 0) {
            throw new IllegalStateException("Insufficient funds for exchange");
        }

        // Calculate credited amount (Amount * Rate)
        BigDecimal amountToCredit = request.getAmountToDebit().multiply(request.getExchangeRate())
                .setScale(8, RoundingMode.HALF_UP); // 8 decimal places for crypto

        // Execute exchange
        fromAccount.setBalance(fromAccount.getBalance().subtract(request.getAmountToDebit()));
        toAccount.setBalance(toAccount.getBalance().add(amountToCredit));

        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        // Record transaction
        Transaction tx = new Transaction();
        tx.setFromAccount(fromAccount);
        tx.setToAccount(toAccount);
        tx.setAmount(request.getAmountToDebit()); // Saving the debited amount
        tx.setType("EXCHANGE");
        tx.setStatus("COMPLETED");
        tx.setIdempotencyKey(request.getIdempotencyKey());

        transactionRepository.save(tx);
        log.info("Exchange completed successfully");
    }
}
