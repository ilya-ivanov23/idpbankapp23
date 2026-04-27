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
    public ResponseEntity<Void> executeExchange(@RequestBody ExchangeRequestDto dto) {
        exchangeService.executeExchange(
                dto.getUserId(),
                dto.getFromCurrency(),
                dto.getToCurrency(),
                dto.getAmount(),
                dto.getRate(),
                dto.getIdempotencyKey()
        );
        return ResponseEntity.ok().build();
    }
}
