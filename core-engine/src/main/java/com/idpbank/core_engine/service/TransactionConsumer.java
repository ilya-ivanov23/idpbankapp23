package com.idpbank.core_engine.service;

import com.idpbank.core_engine.dto.TransactionEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j // This annotation gives us a log object for console output
public class TransactionConsumer {

    private final TransactionService transactionService;

    // Specify the topic where the frontend/node sends transfers
    @KafkaListener(topics = "bank-transactions", groupId = "bank-core-group")
    public void consumeTransaction(TransactionEvent event) {
        log.info("🚀 NEW TRANSFER RECEIVED FROM KAFKA!");

        try {
            transactionService.processTransfer(event);
        } catch (Exception e) {
            log.error("Critical error processing transfer: {}", e.getMessage());
        }
    }
}
