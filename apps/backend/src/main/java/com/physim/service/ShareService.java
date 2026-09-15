package com.physim.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.dto.CreateShareRequest;
import com.physim.dto.ShareResponse;
import com.physim.dto.SharedExperimentPublicResponse;
import com.physim.entity.ExperimentShareEntity;
import com.physim.entity.SavedExperimentEntity;
import com.physim.exception.ForbiddenException;
import com.physim.exception.ResourceNotFoundException;
import com.physim.repository.ExperimentShareRepository;
import com.physim.repository.SavedExperimentRepository;
import com.physim.security.TokenUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class ShareService {

    private final ExperimentShareRepository experimentShareRepository;
    private final SavedExperimentRepository savedExperimentRepository;
    private final ObjectMapper objectMapper;

    public ShareService(
            ExperimentShareRepository experimentShareRepository,
            SavedExperimentRepository savedExperimentRepository,
            ObjectMapper objectMapper) {
        this.experimentShareRepository = experimentShareRepository;
        this.savedExperimentRepository = savedExperimentRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ShareResponse createShare(String userId, String savedExperimentId, CreateShareRequest request) {
        SavedExperimentEntity experiment = savedExperimentRepository.findActiveById(savedExperimentId)
                .orElseThrow(() -> new ResourceNotFoundException("Saved experiment not found."));

        if (!experiment.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to share this saved experiment.");
        }

        String rawToken = "shr_" + TokenUtils.generateRandomToken(24);
        String tokenHash = TokenUtils.hashToken(rawToken);

        Instant expiresAt = null;
        if (request.getExpiresInDays() != null && request.getExpiresInDays() > 0) {
            expiresAt = Instant.now().plus(request.getExpiresInDays(), ChronoUnit.DAYS);
        }

        ExperimentShareEntity share = new ExperimentShareEntity();
        share.setSavedExperiment(experiment);
        share.setTokenHash(tokenHash);
        share.setRevoked(false);
        share.setExpiresAt(expiresAt);

        ExperimentShareEntity saved = experimentShareRepository.save(share);
        return new ShareResponse(saved.getId(), rawToken, saved.getExpiresAt());
    }

    @Transactional(readOnly = true)
    public SharedExperimentPublicResponse getByToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ResourceNotFoundException("Shared experiment not found or link has expired.");
        }

        String tokenHash = TokenUtils.hashToken(rawToken);
        ExperimentShareEntity share = experimentShareRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResourceNotFoundException("Shared experiment not found or link has expired."));

        // Enforce identical 404 behavior for revoked, expired, or soft-deleted targets
        if (share.isRevoked()) {
            throw new ResourceNotFoundException("Shared experiment not found or link has expired.");
        }

        if (share.getExpiresAt() != null && share.getExpiresAt().isBefore(Instant.now())) {
            throw new ResourceNotFoundException("Shared experiment not found or link has expired.");
        }

        SavedExperimentEntity experiment = share.getSavedExperiment();
        if (experiment == null || experiment.isDeleted()) {
            throw new ResourceNotFoundException("Shared experiment not found or link has expired.");
        }

        Object parsedState;
        try {
            parsedState = objectMapper.readValue(experiment.getStateData(), Object.class);
        } catch (Exception e) {
            parsedState = experiment.getStateData();
        }

        String authorName = (experiment.getUser() != null && experiment.getUser().getName() != null)
                ? experiment.getUser().getName()
                : "Physim Student";

        return new SharedExperimentPublicResponse(
                share.getId(),
                experiment.getExperimentId(),
                experiment.getTitle(),
                experiment.getSchemaVersion(),
                parsedState,
                authorName,
                share.getCreatedAt(),
                share.getExpiresAt()
        );
    }

    @Transactional
    public void revokeShare(String userId, String shareId) {
        ExperimentShareEntity share = experimentShareRepository.findById(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Share link not found."));

        if (!share.getSavedExperiment().getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to revoke this share link.");
        }

        share.setRevoked(true);
        experimentShareRepository.save(share);
    }
}
