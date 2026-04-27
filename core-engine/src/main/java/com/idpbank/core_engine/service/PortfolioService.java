package com.idpbank.core_engine.service;

import com.idpbank.core_engine.entity.Account;
import com.idpbank.core_engine.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final AccountRepository accountRepository;

    public Map<String, Object> getAllocation(UUID userId) {
        List<Account> accounts = accountRepository.findByUserId(userId);

        BigDecimal totalFiatUsd = BigDecimal.ZERO;
        BigDecimal totalCryptoUsd = BigDecimal.ZERO;
        BigDecimal totalStockUsd = BigDecimal.ZERO;

        for (Account account : accounts) {
            BigDecimal usdValue = calculateUsdValue(account.getCurrencyCode(), account.getBalance());
            if ("FIAT".equals(account.getAssetType())) {
                totalFiatUsd = totalFiatUsd.add(usdValue);
            } else if ("CRYPTO".equals(account.getAssetType())) {
                totalCryptoUsd = totalCryptoUsd.add(usdValue);
            } else if ("STOCK".equals(account.getAssetType())) {
                totalStockUsd = totalStockUsd.add(usdValue);
            }
        }

        BigDecimal totalUsd = totalFiatUsd.add(totalCryptoUsd).add(totalStockUsd);

        Map<String, Object> allocation = new HashMap<>();
        allocation.put("TOTAL_USD_VALUE", totalUsd);

        if (totalUsd.compareTo(BigDecimal.ZERO) == 0) {
            allocation.put("FIAT_PERCENT", 0);
            allocation.put("CRYPTO_PERCENT", 0);
            allocation.put("STOCK_PERCENT", 0);
        } else {
            allocation.put("FIAT_PERCENT", totalFiatUsd.multiply(new BigDecimal("100")).divide(totalUsd, 2, RoundingMode.HALF_UP));
            allocation.put("CRYPTO_PERCENT", totalCryptoUsd.multiply(new BigDecimal("100")).divide(totalUsd, 2, RoundingMode.HALF_UP));
            allocation.put("STOCK_PERCENT", totalStockUsd.multiply(new BigDecimal("100")).divide(totalUsd, 2, RoundingMode.HALF_UP));
        }

        return allocation;
    }

    private BigDecimal calculateUsdValue(String currencyCode, BigDecimal balance) {
        return switch (currencyCode.toUpperCase()) {
            case "USD" -> balance;
            case "EUR" -> balance.multiply(new BigDecimal("1.1"));
            case "PLN" -> balance.multiply(new BigDecimal("0.25"));
            case "BTC" -> balance.multiply(new BigDecimal("77000"));
            case "ETH" -> balance.multiply(new BigDecimal("2300"));
            case "AAPL" -> balance.multiply(new BigDecimal("170"));
            default -> balance;
        };
    }
}
