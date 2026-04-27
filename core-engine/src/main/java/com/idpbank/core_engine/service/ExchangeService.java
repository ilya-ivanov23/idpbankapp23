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
    private final AccountService accountService;

    @Transactional
    public void executeExchange(UUID userId, String fromCurrency, String toCurrency, BigDecimal amount, BigDecimal rate) {
        log.info("Starting exchange for user: {} from {} to {} with rate {}", userId, fromCurrency, toCurrency, rate);

        if (fromCurrency.equals(toCurrency)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot exchange within the same currency");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be positive");
        }
        if (rate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Exchange rate must be positive");
        }

        // Find accounts
        Account fromAccount = accountRepository.findByUserId(userId).stream()
                .filter(a -> a.getCurrencyCode().equals(fromCurrency))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Source account not found"));

        Account toAccount = accountRepository.findByUserId(userId).stream()
                .filter(a -> a.getCurrencyCode().equals(toCurrency))
                .findFirst()
                .orElseGet(() -> {
                    String assetType = determineAssetType(toCurrency);
                    return accountRepository.findById(accountService.createAccount(userId, assetType, toCurrency).getId())
                        .orElseThrow(() -> new IllegalStateException("Failed to create account"));
                });

        // Always lock in a consistent order to prevent deadlocks
        UUID firstLock = fromAccount.getId().compareTo(toAccount.getId()) < 0 ? fromAccount.getId() : toAccount.getId();
        UUID secondLock = fromAccount.getId().compareTo(toAccount.getId()) < 0 ? toAccount.getId() : fromAccount.getId();

        accountRepository.findByIdForUpdate(firstLock);
        accountRepository.findByIdForUpdate(secondLock);

        // Re-fetch to get locked entity state
        fromAccount = accountRepository.findById(fromAccount.getId()).orElseThrow();
        toAccount = accountRepository.findById(toAccount.getId()).orElseThrow();

        if (fromAccount.getBalance().compareTo(amount) < 0) {
            throw new IllegalStateException("Insufficient funds for exchange");
        }

        BigDecimal amountToCredit = amount.multiply(rate).setScale(8, RoundingMode.HALF_UP);

        fromAccount.setBalance(fromAccount.getBalance().subtract(amount));
        toAccount.setBalance(toAccount.getBalance().add(amountToCredit));

        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        Transaction tx = new Transaction();
        tx.setFromAccount(fromAccount);
        tx.setToAccount(toAccount);
        tx.setAmount(amount);
        tx.setCurrencyRate(rate);
        tx.setType("EXCHANGE");
        tx.setStatus("COMPLETED");
        tx.setIdempotencyKey(UUID.randomUUID().toString());

        transactionRepository.save(tx);
        log.info("Exchange completed successfully");
    }

    private String determineAssetType(String currency) {
        return switch (currency.toUpperCase()) {
            case "BTC", "ETH" -> "CRYPTO";
            case "AAPL" -> "STOCK";
            default -> "FIAT";
        };
    }
}
