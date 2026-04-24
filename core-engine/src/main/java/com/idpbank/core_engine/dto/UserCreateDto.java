package com.idpbank.core_engine.dto;

import lombok.Data;

@Data
public class UserCreateDto {
    private String email;
    private String passwordHash;
    private String pinHash;
    private String stripeCustomerId;
}
