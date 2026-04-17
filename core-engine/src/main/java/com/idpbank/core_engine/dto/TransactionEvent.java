package com.idpbank.core_engine.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TransactionEvent {
    private UUID fromAccountId; // Может быть null, если это пополнение с карты (Stripe)
    private UUID toAccountId;
    private BigDecimal amount;
    private String idempotencyKey;
}

