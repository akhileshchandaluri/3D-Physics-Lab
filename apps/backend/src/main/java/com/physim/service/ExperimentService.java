package com.physim.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.constant.CatalogConstants;
import com.physim.dto.CreateSavedExperimentRequest;
import com.physim.dto.PageResponse;
import com.physim.dto.SavedExperimentResponse;
import com.physim.dto.UpdateSavedExperimentRequest;
import com.physim.entity.SavedExperimentEntity;
import com.physim.entity.UserEntity;
import com.physim.exception.BadRequestException;
import com.physim.exception.ForbiddenException;
import com.physim.exception.PayloadTooLargeException;
import com.physim.exception.ResourceNotFoundException;
import com.physim.repository.ExperimentShareRepository;
import com.physim.repository.SavedExperimentRepository;
import com.physim.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ExperimentService {

    private final SavedExperimentRepository savedExperimentRepository;
    private final ExperimentShareRepository experimentShareRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public ExperimentService(
            SavedExperimentRepository savedExperimentRepository,
            ExperimentShareRepository experimentShareRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.savedExperimentRepository = savedExperimentRepository;
        this.experimentShareRepository = experimentShareRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    private SavedExperimentResponse toResponse(SavedExperimentEntity entity) {
        Object parsedState = null;
        try {
            parsedState = objectMapper.readValue(entity.getStateData(), Object.class);
        } catch (Exception e) {
            parsedState = entity.getStateData();
        }

        return new SavedExperimentResponse(
                entity.getId(),
                entity.getUser().getId(),
                entity.getExperimentId(),
                entity.getTitle(),
                entity.getNotes(),
                entity.getSchemaVersion(),
                parsedState,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String serializeAndValidateStateData(String experimentId, Object stateData) {
        if (stateData == null) {
            throw new BadRequestException("State data is required.");
        }

        String jsonString;
        try {
            jsonString = objectMapper.writeValueAsString(stateData);
        } catch (Exception e) {
            throw new BadRequestException("Invalid state data format. Must be valid JSON.");
        }

        if (!CatalogConstants.isWithinStateDataLimit(jsonString)) {
            throw new PayloadTooLargeException("State data exceeds maximum allowed size of 64 KB (65,536 bytes).");
        }

        // Specific validator for Ohm's Law
        if (CatalogConstants.OHMS_LAW.equals(experimentId)) {
            try {
                JsonNode node = objectMapper.readTree(jsonString);
                if (node.isObject()) {
                    if (node.has("voltage") && !node.get("voltage").isNull()) {
                        double v = node.get("voltage").asDouble();
                        if (v < 0 || v > 24) {
                            throw new BadRequestException("Voltage must be between 0 and 24 V.");
                        }
                    }
                    if (node.has("resistance") && !node.get("resistance").isNull()) {
                        double r = node.get("resistance").asDouble();
                        if (r < 10 || r > 1000) {
                            throw new BadRequestException("Resistance must be between 10 and 1000 Ω.");
                        }
                    }
                    if (node.has("temperature") && !node.get("temperature").isNull()) {
                        double t = node.get("temperature").asDouble();
                        if (t < 25 || t > 200) {
                            throw new BadRequestException("Temperature must be between 25 and 200 °C.");
                        }
                    }
                }
            } catch (BadRequestException bre) {
                throw bre;
            } catch (Exception e) {
                throw new BadRequestException("Ohm's Law state data validation error: " + e.getMessage());
            }
        }

        return jsonString;
    }

    @Transactional
    public SavedExperimentResponse create(String userId, CreateSavedExperimentRequest request) {
        if (!CatalogConstants.isValidExperimentId(request.getExperimentId())) {
            throw new BadRequestException("Invalid experiment ID '" + request.getExperimentId() +
                    "'. Must be one of the canonical 8 experiments: " + CatalogConstants.CANONICAL_EXPERIMENT_IDS);
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        String serializedState = serializeAndValidateStateData(request.getExperimentId(), request.getStateData());

        SavedExperimentEntity entity = new SavedExperimentEntity();
        entity.setUser(user);
        entity.setExperimentId(request.getExperimentId());
        entity.setTitle(request.getTitle().trim());
        entity.setNotes(request.getNotes());
        entity.setSchemaVersion(request.getSchemaVersion() > 0 ? request.getSchemaVersion() : 1);
        entity.setStateData(serializedState);
        entity.setDeleted(false);

        SavedExperimentEntity saved = savedExperimentRepository.save(entity);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<SavedExperimentResponse> list(String userId, String experimentId, int page, int limit) {
        int pageIndex = Math.max(0, page - 1);
        int pageSize = Math.min(Math.max(1, limit), 50);

        Page<SavedExperimentEntity> resultPage = savedExperimentRepository.findActiveByUserId(
                userId,
                experimentId != null && !experimentId.isBlank() ? experimentId : null,
                PageRequest.of(pageIndex, pageSize)
        );

        List<SavedExperimentResponse> items = resultPage.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PageResponse<>(items, resultPage.getTotalElements(), page, pageSize);
    }

    @Transactional(readOnly = true)
    public SavedExperimentResponse getById(String userId, String id) {
        SavedExperimentEntity entity = savedExperimentRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Saved experiment not found."));

        if (!entity.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to access this saved experiment.");
        }

        return toResponse(entity);
    }

    @Transactional
    public SavedExperimentResponse update(String userId, String id, UpdateSavedExperimentRequest request) {
        SavedExperimentEntity entity = savedExperimentRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Saved experiment not found."));

        if (!entity.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to modify this saved experiment.");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            entity.setTitle(request.getTitle().trim());
        }
        if (request.getNotes() != null) {
            entity.setNotes(request.getNotes());
        }
        if (request.getSchemaVersion() != null && request.getSchemaVersion() > 0) {
            entity.setSchemaVersion(request.getSchemaVersion());
        }
        if (request.getStateData() != null) {
            String serializedState = serializeAndValidateStateData(entity.getExperimentId(), request.getStateData());
            entity.setStateData(serializedState);
        }

        SavedExperimentEntity updated = savedExperimentRepository.save(entity);
        return toResponse(updated);
    }

    @Transactional
    public void delete(String userId, String id) {
        SavedExperimentEntity entity = savedExperimentRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Saved experiment not found."));

        if (!entity.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have permission to delete this saved experiment.");
        }

        // Soft delete and revoke shares transactionally
        entity.setDeleted(true);
        entity.setDeletedAt(Instant.now());
        savedExperimentRepository.save(entity);

        experimentShareRepository.revokeAllBySavedExperimentId(id);
    }
}
