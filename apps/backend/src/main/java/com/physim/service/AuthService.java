package com.physim.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.dto.AuthResponse;
import com.physim.dto.LoginRequest;
import com.physim.dto.SignupRequest;
import com.physim.dto.UserDTO;
import com.physim.entity.SessionEntity;
import com.physim.entity.UserEntity;
import com.physim.entity.UserRole;
import com.physim.exception.ConflictException;
import com.physim.exception.UnauthorizedException;
import com.physim.repository.SessionRepository;
import com.physim.repository.UserRepository;
import com.physim.security.TokenUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final int sessionTtlDays;

    public AuthService(
            UserRepository userRepository,
            SessionRepository sessionRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.security.session-ttl-days:30}") int sessionTtlDays) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.sessionTtlDays = sessionTtlDays;
    }

    public UserDTO toDTO(UserEntity user) {
        return new UserDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }

    @Transactional
    public AuthResponse signup(SignupRequest request, String userAgent, String ipAddress) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists. Log in or use another email.");
        }

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setName(request.getName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.STUDENT);
        user.setActive(true);

        UserEntity savedUser = userRepository.save(user);
        String rawToken = createSession(savedUser, userAgent, ipAddress);

        return new AuthResponse(toDTO(savedUser), rawToken, "Account created successfully.");
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String userAgent, String ipAddress) {
        String email = request.getEmail().trim().toLowerCase();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Email or password is incorrect."));

        if (!user.isActive()) {
            throw new UnauthorizedException("Email or password is incorrect.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Email or password is incorrect.");
        }

        String rawToken = createSession(user, userAgent, ipAddress);
        return new AuthResponse(toDTO(user), rawToken, "Login successful.");
    }

    @Transactional
    public String createSession(UserEntity user, String userAgent, String ipAddress) {
        String rawToken = TokenUtils.generateRandomToken(32);
        String tokenHash = TokenUtils.hashToken(rawToken);

        SessionEntity session = new SessionEntity();
        session.setUser(user);
        session.setSessionTokenHash(tokenHash);
        session.setUserAgent(userAgent);
        session.setIpAddress(ipAddress);
        session.setExpiresAt(Instant.now().plus(sessionTtlDays, ChronoUnit.DAYS));

        sessionRepository.save(session);
        return rawToken;
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken != null && !rawToken.isBlank()) {
            String tokenHash = TokenUtils.hashToken(rawToken);
            sessionRepository.deleteBySessionTokenHash(tokenHash);
        }
    }
}
