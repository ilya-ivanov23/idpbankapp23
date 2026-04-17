package com.idpbank.core_engine.controller;

import com.idpbank.core_engine.dto.TransactionEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
public class TestKafkaController {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public TestKafkaController(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    // This method will be triggered when we open http://localhost:8080/test-kafka in the browser
    @GetMapping("/test-kafka")
    public String sendTestMessage() {
        TransactionEvent event = new TransactionEvent();
        event.setFromAccountId(UUID.randomUUID());
        event.setToAccountId(UUID.randomUUID());
        event.setAmount(new BigDecimal("150.00")); // Test transfer amount
        event.setIdempotencyKey("TEST-" + UUID.randomUUID().toString());

        // Sends a message to Kafka
        kafkaTemplate.send("bank-transactions", event);

        return "✅ Test transfer sent to Kafka! Check the IntelliJ IDEA console.";
    }
}
