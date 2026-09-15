package com.physim.controller;

import com.physim.dto.SharedExperimentPublicResponse;
import com.physim.security.UserPrincipal;
import com.physim.service.ShareService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/share")
@Tag(name = "Share", description = "Public read-only sharing of experiment setups")
public class ShareController {

    private final ShareService shareService;

    public ShareController(ShareService shareService) {
        this.shareService = shareService;
    }

    @GetMapping("/{token}")
    @Operation(summary = "Get shared experiment", description = "Publicly retrieves a shared experiment state using an opaque token.")
    public ResponseEntity<SharedExperimentPublicResponse> getByToken(@PathVariable String token) {
        SharedExperimentPublicResponse response = shareService.getByToken(token);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{shareId}")
    @Operation(summary = "Revoke share link", description = "Revokes an active share link (Owner only).")
    public ResponseEntity<Map<String, String>> revokeShare(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String shareId) {
        shareService.revokeShare(principal.getId(), shareId);
        return ResponseEntity.ok(Map.of("message", "Share link revoked successfully."));
    }
}
