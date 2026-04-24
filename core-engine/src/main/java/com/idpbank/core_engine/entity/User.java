package com.idpbank.core_engine.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "pin_hash")
    private String pinHash;

    @Column(name = "stripe_customer_id", unique = true)
    private String stripeCustomerId;

    @Column(name = "is_verified", nullable = false)
    private boolean isVerified = false;

    @Column(name = "daily_limit", nullable = false)
    private BigDecimal dailyLimit = new BigDecimal("3000.00");

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
