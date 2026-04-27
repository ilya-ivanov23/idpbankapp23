package com.idpbank.core_engine.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
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

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "date_of_birth")
    private java.time.LocalDate dateOfBirth;

    @Column(name = "address")
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "language", length = 10)
    private String language = "en";

    @Column(name = "push_enabled")
    private boolean pushEnabled = true;
}
