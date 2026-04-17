package com.idpbank.core_engine.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TransactionEvent {
    private UUID fromAccountId; // May be null if this is a card top-up (Stripe)
    private UUID toAccountId;
    private BigDecimal amount;
    private String idempotencyKey;
}

