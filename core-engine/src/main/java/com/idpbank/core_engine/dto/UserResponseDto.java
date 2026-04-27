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
    private String firstName;
    private String lastName;
    private java.time.LocalDate dateOfBirth;
    private String address;
    private String city;
    private String postalCode;
    private String language;
    private boolean pushEnabled;
}
