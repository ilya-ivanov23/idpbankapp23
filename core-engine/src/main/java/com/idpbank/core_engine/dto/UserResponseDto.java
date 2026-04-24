package com.idpbank.core_engine.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserResponseDto {
    private UUID id;
    private String email;
    private String stripeCustomerId;
    private boolean isVerified;
    private BigDecimal dailyLimit;
    private LocalDateTime createdAt;
}
