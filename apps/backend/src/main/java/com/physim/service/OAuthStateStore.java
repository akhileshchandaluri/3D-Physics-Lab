package com.physim.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OAuthStateStore {

    public record StateEntry(
            String state,
            String nonce,
            String codeVerifier,
            String redirectUri,
            Instant expiresAt
    ) {
        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    public record LinkEntry(
            String email,
            String providerId,
            Instant expiresAt
    ) {
        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private final Map<String, StateEntry> states = new ConcurrentHashMap<>();
    private final Map<String, LinkEntry> linkTokens = new ConcurrentHashMap<>();

    public void saveState(String state, String nonce, String codeVerifier, String redirectUri, long ttlMinutes) {
        pruneExpired();
        Instant expiresAt = Instant.now().plus(ttlMinutes, ChronoUnit.MINUTES);
        states.put(state, new StateEntry(state, nonce, codeVerifier, redirectUri, expiresAt));
    }

    public Optional<StateEntry> consumeState(String state) {
        pruneExpired();
        if (state == null) {
            return Optional.empty();
        }
        StateEntry entry = states.remove(state);
        if (entry == null || entry.isExpired()) {
            return Optional.empty();
        }
        return Optional.of(entry);
    }

    public void saveLinkToken(String linkToken, String email, String providerId, long ttlMinutes) {
        pruneExpired();
        Instant expiresAt = Instant.now().plus(ttlMinutes, ChronoUnit.MINUTES);
        linkTokens.put(linkToken, new LinkEntry(email, providerId, expiresAt));
    }

    public Optional<LinkEntry> consumeLinkToken(String linkToken) {
        pruneExpired();
        if (linkToken == null) {
            return Optional.empty();
        }
        LinkEntry entry = linkTokens.remove(linkToken);
        if (entry == null || entry.isExpired()) {
            return Optional.empty();
        }
        return Optional.of(entry);
    }

    private void pruneExpired() {
        Instant now = Instant.now();
        states.entrySet().removeIf(e -> e.getValue().isExpired());
        linkTokens.entrySet().removeIf(e -> e.getValue().isExpired());
    }
}
