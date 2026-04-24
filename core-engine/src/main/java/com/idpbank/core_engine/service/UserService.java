package com.idpbank.core_engine.service;

import com.idpbank.core_engine.dto.UserCreateDto;
import com.idpbank.core_engine.dto.UserResponseDto;
import com.idpbank.core_engine.entity.User;
import com.idpbank.core_engine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final AccountService accountService;

    @Transactional
    public UserResponseDto createUser(UserCreateDto dto) {
        log.info("Creating new user with email: {}", dto.getEmail());
        
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("User with this email already exists");
        }

        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPasswordHash(dto.getPasswordHash());
        user.setPinHash(dto.getPinHash());
        user.setStripeCustomerId(dto.getStripeCustomerId());
        
        user = userRepository.save(user);

        // Auto-create a default FIAT USD account for the new user
        accountService.createAccount(user.getId(), "FIAT", "USD");

        return mapToDto(user);
    }

    public UserResponseDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        return mapToDto(user);
    }

    private UserResponseDto mapToDto(User user) {
        UserResponseDto dto = new UserResponseDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setStripeCustomerId(user.getStripeCustomerId());
        dto.setVerified(user.isVerified());
        dto.setDailyLimit(user.getDailyLimit());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
