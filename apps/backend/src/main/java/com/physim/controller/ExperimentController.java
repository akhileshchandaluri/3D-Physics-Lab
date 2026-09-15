package com.physim.controller;

import com.physim.dto.*;
import com.physim.security.UserPrincipal;
import com.physim.service.ExperimentService;
import com.physim.service.ShareService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/experiments")
@Tag(name = "Experiments", description = "Saved experiment states and simulation parameter management")
public class ExperimentController {

    private final ExperimentService experimentService;
    private final ShareService shareService;

    public ExperimentController(ExperimentService experimentService, ShareService shareService) {
        this.experimentService = experimentService;
        this.shareService = shareService;
    }

    @PostMapping
    @Operation(summary = "Save experiment", description = "Saves simulation state parameters for any of the 8 canonical experiments.")
    public ResponseEntity<SavedExperimentResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateSavedExperimentRequest request) {
        SavedExperimentResponse response = experimentService.create(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List saved experiments", description = "Lists current user's saved experiments with optional filtering by experiment ID.")
    public ResponseEntity<PageResponse<SavedExperimentResponse>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String experimentId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        PageResponse<SavedExperimentResponse> response = experimentService.list(principal.getId(), experimentId, page, limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get saved experiment", description = "Retrieves a specific saved experiment by ID.")
    public ResponseEntity<SavedExperimentResponse> getById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        SavedExperimentResponse response = experimentService.getById(principal.getId(), id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update saved experiment", description = "Updates title, notes, or state parameters for a saved experiment.")
    public ResponseEntity<SavedExperimentResponse> update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateSavedExperimentRequest request) {
        SavedExperimentResponse response = experimentService.update(principal.getId(), id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete saved experiment", description = "Soft deletes a saved experiment and revokes all associated share links.")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        experimentService.delete(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/share")
    @Operation(summary = "Create share link", description = "Generates an unguessable public share token for a saved experiment.")
    public ResponseEntity<ShareResponse> createShare(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @RequestBody(required = false) CreateShareRequest request) {
        CreateShareRequest safeRequest = request != null ? request : new CreateShareRequest();
        ShareResponse response = shareService.createShare(principal.getId(), id, safeRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
