package com.idpbank.core_engine.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ExchangeRequestDto {
    private UUID userId;
    private String fromCurrency;
    private String toCurrency;
    private BigDecimal amount;
    private BigDecimal rate;
    private String idempotencyKey;
}
