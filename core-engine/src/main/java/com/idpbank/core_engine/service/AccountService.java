package com.idpbank.core_engine.service;

import com.idpbank.core_engine.dto.AccountResponseDto;
import com.idpbank.core_engine.entity.Account;
import com.idpbank.core_engine.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountService {

    private final AccountRepository accountRepository;

    public AccountResponseDto createAccount(UUID userId, String assetType, String currencyCode) {
        log.info("Creating new account for user: {}, type: {}, currency: {}", userId, assetType, currencyCode);
        Account account = new Account();
        account.setUserId(userId);
        account.setAssetType(assetType);
        account.setCurrencyCode(currencyCode);
        account.setBalance(BigDecimal.ZERO);
        
        account = accountRepository.save(account);
        return mapToDto(account);
    }

    public List<AccountResponseDto> getAccountsByUserId(UUID userId) {
        return accountRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private AccountResponseDto mapToDto(Account account) {
        AccountResponseDto dto = new AccountResponseDto();
        dto.setId(account.getId());
        dto.setUserId(account.getUserId());
        dto.setBalance(account.getBalance());
        dto.setAssetType(account.getAssetType());
        dto.setCurrencyCode(account.getCurrencyCode());
        dto.setCreatedAt(account.getCreatedAt());
        return dto;
    }
}
