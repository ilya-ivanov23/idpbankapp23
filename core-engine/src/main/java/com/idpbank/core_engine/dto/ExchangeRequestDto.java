package com.idpbank.core_engine.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ExchangeRequestDto {
    private UUID fromAccountId;
    private UUID toAccountId;
    private BigDecimal amountToDebit;
    private BigDecimal exchangeRate;
    private String idempotencyKey;
}
