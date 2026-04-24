package com.idpbank.core_engine.service;

import com.idpbank.core_engine.entity.Transaction;
import com.idpbank.core_engine.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatementService {

    private final TransactionRepository transactionRepository;

    public String generateCsvStatement(UUID userId) {
        log.info("Generating CSV statement for user: {}", userId);
        List<Transaction> transactions = transactionRepository.findTransactionsByUserId(userId);

        StringBuilder csvBuilder = new StringBuilder();
        // CSV Header
        csvBuilder.append("Transaction ID,Date,Type,Amount,Status,From Account,To Account\n");

        for (Transaction tx : transactions) {
            String fromAccountId = tx.getFromAccount() != null ? tx.getFromAccount().getId().toString() : "N/A";
            String toAccountId = tx.getToAccount() != null ? tx.getToAccount().getId().toString() : "N/A";

            csvBuilder.append(String.format("%s,%s,%s,%s,%s,%s,%s\n",
                    tx.getId(),
                    tx.getCreatedAt(),
                    tx.getType(),
                    tx.getAmount(),
                    tx.getStatus(),
                    fromAccountId,
                    toAccountId
            ));
        }

        return csvBuilder.toString();
    }
}
