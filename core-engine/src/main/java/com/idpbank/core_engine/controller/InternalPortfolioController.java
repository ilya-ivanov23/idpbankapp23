package com.idpbank.core_engine.controller;

import com.idpbank.core_engine.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/internal/portfolio")
@RequiredArgsConstructor
public class InternalPortfolioController {

    private final PortfolioService portfolioService;

    @GetMapping("/{userId}/allocation")
    public ResponseEntity<Map<String, Object>> getAllocation(@PathVariable UUID userId) {
        return ResponseEntity.ok(portfolioService.getAllocation(userId));
    }
}
