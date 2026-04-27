package com.idpbank.core_engine.service;

import com.idpbank.core_engine.dto.UserCreateDto;
import com.idpbank.core_engine.dto.UserResponseDto;
import com.idpbank.core_engine.entity.User;
import com.idpbank.core_engine.repository.UserRepository;
import com.idpbank.core_engine.repository.AccountRepository;
import com.idpbank.core_engine.repository.TransactionRepository;
import com.idpbank.core_engine.entity.Account;
import com.idpbank.core_engine.entity.Transaction;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final AccountService accountService;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    @Transactional
    public UserResponseDto createUser(UserCreateDto dto) {
        log.info("Creating new user with email: {}", dto.getEmail());
        
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User with this email already exists");
        }

        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPasswordHash(dto.getPasswordHash());
        user.setPinHash(dto.getPinHash());
        user.setStripeCustomerId(dto.getStripeCustomerId());
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setDateOfBirth(dto.getDateOfBirth());
        user.setAddress(dto.getAddress());
        user.setCity(dto.getCity());
        user.setPostalCode(dto.getPostalCode());
        user.setLanguage(dto.getLanguage() != null ? dto.getLanguage() : "en");
        user.setPushEnabled(dto.getPushEnabled() != null ? dto.getPushEnabled() : true);

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            // Handles race condition where two requests register the same email simultaneously
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User with this email or Stripe ID already exists");
        }

        // Grant welcome bonus directly
        grantWelcomeBonus(user);

        return mapToDto(user);
    }

    public UserResponseDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + email));
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
        
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setAddress(user.getAddress());
        dto.setCity(user.getCity());
        dto.setPostalCode(user.getPostalCode());
        dto.setLanguage(user.getLanguage());
        dto.setPushEnabled(user.isPushEnabled());
        return dto;
    }

    @Transactional
    public void updatePin(UUID userId, String pinHash) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setPinHash(pinHash);
        userRepository.save(user);
    }

    public String getPinHash(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return user.getPinHash();
    }

    @Transactional
    public void updateLanguage(UUID userId, String language) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setLanguage(language);
        userRepository.save(user);
    }

    @Transactional
    protected void grantWelcomeBonus(User user) {
        // USD
        accountService.createAccount(user.getId(), "FIAT", "USD");
        Account usd = accountRepository.findByUserId(user.getId()).stream().filter(a -> a.getCurrencyCode().equals("USD")).findFirst().get();
        usd.setBalance(new BigDecimal("3000.00"));
        accountRepository.save(usd);
        saveInitialDeposit(usd, new BigDecimal("3000.00"));

        // PLN
        accountService.createAccount(user.getId(), "FIAT", "PLN");
        Account pln = accountRepository.findByUserId(user.getId()).stream().filter(a -> a.getCurrencyCode().equals("PLN")).findFirst().get();
        pln.setBalance(new BigDecimal("5000.00"));
        accountRepository.save(pln);
        saveInitialDeposit(pln, new BigDecimal("5000.00"));

        // EUR
        accountService.createAccount(user.getId(), "FIAT", "EUR");
        Account eur = accountRepository.findByUserId(user.getId()).stream().filter(a -> a.getCurrencyCode().equals("EUR")).findFirst().get();
        eur.setBalance(new BigDecimal("2000.00"));
        accountRepository.save(eur);
        saveInitialDeposit(eur, new BigDecimal("2000.00"));

        // BTC
        accountService.createAccount(user.getId(), "CRYPTO", "BTC");
        Account btc = accountRepository.findByUserId(user.getId()).stream().filter(a -> a.getCurrencyCode().equals("BTC")).findFirst().get();
        btc.setBalance(new BigDecimal("1.0"));
        accountRepository.save(btc);
        saveInitialDeposit(btc, new BigDecimal("1.0"));

        // ETH
        accountService.createAccount(user.getId(), "CRYPTO", "ETH");
        Account eth = accountRepository.findByUserId(user.getId()).stream().filter(a -> a.getCurrencyCode().equals("ETH")).findFirst().get();
        eth.setBalance(new BigDecimal("10.0"));
        accountRepository.save(eth);
        saveInitialDeposit(eth, new BigDecimal("10.0"));

        // AAPL (Stock) - Valuation fix: 4000 USD value / 170 price ~ 23.53 shares
        accountService.createAccount(user.getId(), "STOCK", "AAPL");
        Account aapl = accountRepository.findByUserId(user.getId()).stream().filter(a -> a.getCurrencyCode().equals("AAPL")).findFirst().get();
        aapl.setBalance(new BigDecimal("23.52941176")); 
        accountRepository.save(aapl);
        saveInitialDeposit(aapl, new BigDecimal("23.52941176"));
    }

    private void saveInitialDeposit(Account account, BigDecimal amount) {
        Transaction tx = new Transaction();
        tx.setAmount(amount);
        tx.setToAccount(account);
        tx.setType("INITIAL_DEPOSIT");
        tx.setStatus("COMPLETED");
        tx.setIdempotencyKey(UUID.randomUUID().toString());
        transactionRepository.save(tx);
    }
}
