package com.physim.service;

import com.physim.dto.AuthResponse;
import com.physim.dto.LoginRequest;
import com.physim.dto.UserDTO;
import com.physim.entity.SessionEntity;
import com.physim.entity.UserEntity;
import com.physim.exception.UnauthorizedException;
import com.physim.repository.SessionRepository;
import com.physim.repository.UserRepository;
import com.physim.security.TokenUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
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
    private final MfaService mfaService;
    private final int sessionTtlDays;

    public AuthService(
            UserRepository userRepository,
            SessionRepository sessionRepository,
            PasswordEncoder passwordEncoder,
            @Lazy MfaService mfaService,
            @Value("${app.security.session-ttl-days:30}") int sessionTtlDays) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.mfaService = mfaService;
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
    public AuthResponse login(LoginRequest request, String userAgent, String ipAddress) {
        String email = request.getEmail().trim().toLowerCase();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Email or password is incorrect."));

        if (!user.isActive()) {
            throw new UnauthorizedException("Email or password is incorrect.");
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Email or password is incorrect.");
        }

        if (mfaService.requiresMfa(user)) {
            return mfaService.beginMfaChallenge(user);
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
