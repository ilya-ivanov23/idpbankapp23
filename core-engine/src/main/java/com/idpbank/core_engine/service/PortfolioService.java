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

    private static final BigDecimal EUR_RATE = new BigDecimal("1.1");
    private static final BigDecimal PLN_RATE = new BigDecimal("0.25");
    private static final BigDecimal BTC_RATE = new BigDecimal("77000");
    private static final BigDecimal ETH_RATE = new BigDecimal("2300");
    private static final BigDecimal AAPL_RATE = new BigDecimal("170");
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

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
            allocation.put("FIAT_PERCENT", totalFiatUsd.multiply(ONE_HUNDRED).divide(totalUsd, 2, RoundingMode.HALF_UP));
            allocation.put("CRYPTO_PERCENT", totalCryptoUsd.multiply(ONE_HUNDRED).divide(totalUsd, 2, RoundingMode.HALF_UP));
            allocation.put("STOCK_PERCENT", totalStockUsd.multiply(ONE_HUNDRED).divide(totalUsd, 2, RoundingMode.HALF_UP));
        }

        return allocation;
    }

    private BigDecimal calculateUsdValue(String currencyCode, BigDecimal balance) {
        if (currencyCode == null || balance == null) {
            return BigDecimal.ZERO;
        }
        return switch (currencyCode.toUpperCase()) {
            case "USD" -> balance;
            case "EUR" -> balance.multiply(EUR_RATE);
            case "PLN" -> balance.multiply(PLN_RATE);
            case "BTC" -> balance.multiply(BTC_RATE);
            case "ETH" -> balance.multiply(ETH_RATE);
            case "AAPL" -> balance.multiply(AAPL_RATE);
            default -> balance;
        };
    }
}
