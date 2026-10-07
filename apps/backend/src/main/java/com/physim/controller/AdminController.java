package com.physim.controller;

import com.physim.dto.*;
import com.physim.entity.UserRole;
import com.physim.security.UserPrincipal;
import com.physim.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin", description = "Platform management and administrative APIs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/users")
    @Operation(summary = "Create a user account")
    public ResponseEntity<UserDTO> createUser(
            @Valid @RequestBody AdminCreateUserRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.createUser(principal.getId(), request, servletRequest.getRemoteAddr()));
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Delete a user account")
    public ResponseEntity<Void> deleteUser(
            @PathVariable String userId,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        adminService.deleteUser(principal.getId(), userId, servletRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    @Operation(summary = "List users with optional role and search filters")
    public ResponseEntity<PageResponse<UserDTO>> listUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer size
    ) {
        int effectiveLimit = limit != null ? limit : (size != null ? size : 50);
        return ResponseEntity.ok(adminService.listUsers(role, search, page, effectiveLimit));
    }

    @PatchMapping("/users/{userId}/role")
    @Operation(summary = "Update user role (e.g. promote to TEACHER or ADMIN)")
    public ResponseEntity<UserDTO> updateUserRole(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(adminService.updateUserRole(principal.getId(), userId, request.getRole(), servletRequest.getRemoteAddr()));
    }

    @PatchMapping("/users/{userId}/status")
    @Operation(summary = "Activate or deactivate a user account")
    public ResponseEntity<UserDTO> updateUserStatus(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        return ResponseEntity.ok(adminService.updateUserStatus(principal.getId(), userId, request.isActive(), servletRequest.getRemoteAddr()));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Query administrative audit logs")
    public ResponseEntity<PageResponse<AuditLogDTO>> getAuditLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(adminService.getAuditLogs(page, limit));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get platform-wide high-level metrics")
    public ResponseEntity<PlatformStatsResponse> getPlatformStats() {
        return ResponseEntity.ok(adminService.getPlatformStats());
    }
}
