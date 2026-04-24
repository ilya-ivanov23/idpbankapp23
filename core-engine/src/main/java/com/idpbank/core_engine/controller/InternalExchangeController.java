package com.idpbank.core_engine.controller;

import com.idpbank.core_engine.dto.ExchangeRequestDto;
import com.idpbank.core_engine.service.ExchangeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/internal/exchange")
@RequiredArgsConstructor
public class InternalExchangeController {

    private final ExchangeService exchangeService;

    @PostMapping
    public ResponseEntity<String> executeExchange(@RequestBody ExchangeRequestDto request) {
        try {
            exchangeService.executeExchange(request);
            return ResponseEntity.ok("Exchange completed successfully");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
