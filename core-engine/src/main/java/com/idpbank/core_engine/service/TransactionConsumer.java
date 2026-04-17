package com.idpbank.core_engine.service;

import com.idpbank.core_engine.dto.TransactionEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j // Эта аннотация дает нам объект log для красивого вывода в консоль
public class TransactionConsumer {

    // Указываем топик, куда твой фронтенд/нода кидает переводы
    @KafkaListener(topics = "bank-transactions", groupId = "bank-core-group")
    public void consumeTransaction(TransactionEvent event) {
        log.info("NEW TRANSACTION FROM KAFKA");
        log.info("Sum: {}$, Key: {}", event.getAmount(), event.getIdempotencyKey());
        
        // В следующем Task 2.5 мы напишем здесь вызов базы данных для перевода денег
    }
}

