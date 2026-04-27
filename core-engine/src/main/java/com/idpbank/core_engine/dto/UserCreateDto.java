package com.idpbank.core_engine.dto;

import lombok.Data;

@Data
public class UserCreateDto {
    private String email;
    private String passwordHash;
    private String pinHash;
    private String stripeCustomerId;
    private String firstName;
    private String lastName;
    private java.time.LocalDate dateOfBirth;
    private String address;
    private String city;
    private String postalCode;
    private String language;
    private Boolean pushEnabled;
}
