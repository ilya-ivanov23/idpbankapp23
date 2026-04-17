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

    // Этот метод сработает, когда мы откроем http://localhost:8080/test-kafka в браузере
    @GetMapping("/test-kafka")
    public String sendTestMessage() {
        TransactionEvent event = new TransactionEvent();
        event.setFromAccountId(UUID.randomUUID());
        event.setToAccountId(UUID.randomUUID());
        event.setAmount(new BigDecimal("150.00")); // Тестовая сумма перевода
        event.setIdempotencyKey("TEST-" + UUID.randomUUID().toString());

        // Отправляем сообщение в Кафку
        kafkaTemplate.send("bank-transactions", event);

        return "✅ Тестовый перевод отправлен в Kafka! Загляни в консоль IntelliJ IDEA.";
    }
}

