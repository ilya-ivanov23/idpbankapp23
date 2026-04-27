package com.idpbank.core_engine.controller;

import com.idpbank.core_engine.dto.UserCreateDto;
import com.idpbank.core_engine.dto.UserResponseDto;
import com.idpbank.core_engine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponseDto> createUser(@RequestBody UserCreateDto dto) {
        return ResponseEntity.ok(userService.createUser(dto));
    }

    @GetMapping
    public ResponseEntity<UserResponseDto> getUserByEmail(@RequestParam String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @PatchMapping("/{userId}/pin")
    public ResponseEntity<Void> updatePin(@PathVariable java.util.UUID userId, @RequestBody java.util.Map<String, String> body) {
        userService.updatePin(userId, body.get("pinHash"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pin")
    public ResponseEntity<java.util.Map<String, String>> getPinHash(@RequestParam String email) {
        return ResponseEntity.ok(java.util.Map.of("pinHash", userService.getPinHash(email)));
    }

    @PatchMapping("/{userId}/language")
    public ResponseEntity<Void> updateLanguage(@PathVariable java.util.UUID userId, @RequestBody java.util.Map<String, String> body) {
        userService.updateLanguage(userId, body.get("language"));
        return ResponseEntity.ok().build();
    }
}
