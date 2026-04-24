package com.idpbank.core_engine.repository;

import com.idpbank.core_engine.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    boolean existsByIdempotencyKey(String idempotencyKey);

    @Query("SELECT t FROM Transaction t WHERE (t.fromAccount.userId = :userId OR t.toAccount.userId = :userId) ORDER BY t.createdAt DESC")
    List<Transaction> findTransactionsByUserId(@Param("userId") UUID userId);
}

