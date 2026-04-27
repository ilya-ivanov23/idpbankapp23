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
    public void executeExchange(UUID userId, String fromCurrency, String toCurrency, BigDecimal amount, BigDecimal rate, String idempotencyKey) {
        log.info("Starting exchange for user: {} from {} to {} with rate {}", userId, fromCurrency, toCurrency, rate);

        if (transactionRepository.existsByIdempotencyKey(idempotencyKey)) {
            log.info("Exchange with idempotencyKey {} already exists, skipping", idempotencyKey);
            return;
        }

        if (fromCurrency.equals(toCurrency)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot exchange within the same currency");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount must be positive");
        }
        if (rate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Exchange rate must be positive");
        }

        // Fetch user's accounts once
        java.util.List<Account> userAccounts = accountRepository.findByUserId(userId);

        Account fromAccount = userAccounts.stream()
                .filter(a -> a.getCurrencyCode().equalsIgnoreCase(fromCurrency))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Source account not found: " + fromCurrency));

        Account toAccount = userAccounts.stream()
                .filter(a -> a.getCurrencyCode().equalsIgnoreCase(toCurrency))
                .findFirst()
                .orElseGet(() -> {
                    String assetType = determineAssetType(toCurrency);
                    UUID newAccountId = accountService.createAccount(userId, assetType, toCurrency).getId();
                    return accountRepository.findById(newAccountId)
                        .orElseThrow(() -> new IllegalStateException("Failed to create account"));
                });

        // Consistent locking order
        UUID firstId = fromAccount.getId().compareTo(toAccount.getId()) < 0 ? fromAccount.getId() : toAccount.getId();
        UUID secondId = fromAccount.getId().compareTo(toAccount.getId()) < 0 ? toAccount.getId() : fromAccount.getId();

        Account lockedFirst = accountRepository.findByIdForUpdate(firstId).orElseThrow();
        Account lockedSecond = accountRepository.findByIdForUpdate(secondId).orElseThrow();

        // Map back to correct variables
        fromAccount = fromAccount.getId().equals(lockedFirst.getId()) ? lockedFirst : lockedSecond;
        toAccount = toAccount.getId().equals(lockedFirst.getId()) ? lockedFirst : lockedSecond;

        if (fromAccount.getBalance().compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient funds for exchange");
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
        tx.setIdempotencyKey(idempotencyKey);

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
