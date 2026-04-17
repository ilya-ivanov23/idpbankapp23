package com.idpbank.core_engine.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "accounts")
@Data
public class Account {
    @Id
    private UUID id;

    @Column(name = "balance", nullable = false)
    private BigDecimal balance;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "currency")
    private String currency;
}
