package com.idpbank.core_engine.service;

import com.idpbank.core_engine.entity.Transaction;
import com.idpbank.core_engine.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.StringWriter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatementService {

    private static final int DEFAULT_MAX_TRANSACTIONS = 1000;

    private final TransactionRepository transactionRepository;

    public String generateCsvStatement(UUID userId) {
        return generateCsvStatement(userId, DEFAULT_MAX_TRANSACTIONS);
    }

    public String generateCsvStatement(UUID userId, int maxTransactions) {
        if (maxTransactions <= 0) {
            throw new IllegalArgumentException("maxTransactions must be greater than 0");
        }
        log.info("Generating CSV statement for user: {} (max: {})", userId, maxTransactions);

        List<Transaction> transactions = transactionRepository.findTransactionsByUserId(userId);

        if (transactions.size() > maxTransactions) {
            log.warn("Truncating CSV from {} to {} for user {}", transactions.size(), maxTransactions, userId);
            transactions = transactions.subList(0, maxTransactions);
        }

        try {
            StringWriter sw = new StringWriter();
            CSVFormat format = CSVFormat.DEFAULT.builder()
                    .setHeader("Transaction ID", "Date", "Type", "Amount", "Status", "From Account", "To Account")
                    .build();

            try (CSVPrinter printer = new CSVPrinter(sw, format)) {
                for (Transaction tx : transactions) {
                    String fromAccountId = tx.getFromAccount() != null ? tx.getFromAccount().getId().toString() : "N/A";
                    String toAccountId = tx.getToAccount() != null ? tx.getToAccount().getId().toString() : "N/A";

                    printer.printRecord(
                            tx.getId(),
                            tx.getCreatedAt(),
                            tx.getType(),
                            tx.getAmount(),
                            tx.getStatus(),
                            fromAccountId,
                            toAccountId
                    );
                }
            }
            return sw.toString();
        } catch (IOException e) {
            log.error("Error generating CSV statement for user {}", userId, e);
            throw new RuntimeException("Failed to generate CSV statement", e);
        }
    }
}
