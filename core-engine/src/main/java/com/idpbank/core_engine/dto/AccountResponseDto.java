package com.idpbank.core_engine.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AccountResponseDto {
    private UUID id;
    private UUID userId;
    private BigDecimal balance;
    private String assetType;
    private String currencyCode;
    private LocalDateTime createdAt;
}
