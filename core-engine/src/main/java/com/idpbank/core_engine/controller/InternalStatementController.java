package com.idpbank.core_engine.controller;

import com.idpbank.core_engine.service.StatementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/internal/statements")
@RequiredArgsConstructor
public class InternalStatementController {

    private final StatementService statementService;

    @GetMapping(value = "/csv/{userId}", produces = "text/csv")
    public ResponseEntity<String> downloadCsvStatement(@PathVariable UUID userId) {
        String csvContent = statementService.generateCsvStatement(userId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tax_statement_" + userId + ".csv");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvContent);
    }
}
