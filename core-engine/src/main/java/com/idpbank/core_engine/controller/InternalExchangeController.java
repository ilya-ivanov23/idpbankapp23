package com.idpbank.core_engine.controller;

import com.idpbank.core_engine.service.ExchangeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/internal/exchange")
@RequiredArgsConstructor
public class InternalExchangeController {

    private final ExchangeService exchangeService;

    @PostMapping
    public ResponseEntity<Void> executeExchange(@RequestBody Map<String, Object> body) {
        UUID userId = UUID.fromString((String) body.get("userId"));
        String fromCurrency = (String) body.get("fromCurrency");
        String toCurrency = (String) body.get("toCurrency");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        BigDecimal rate = new BigDecimal(body.get("rate").toString());

        exchangeService.executeExchange(userId, fromCurrency, toCurrency, amount, rate);
        return ResponseEntity.ok().build();
    }
}
