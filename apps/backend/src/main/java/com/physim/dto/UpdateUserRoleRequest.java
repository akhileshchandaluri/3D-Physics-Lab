package com.physim.dto;

import com.physim.entity.UserRole;
import jakarta.validation.constraints.NotNull;

public class UpdateUserRoleRequest {

    @NotNull(message = "Role is required")
    private UserRole role;

    public UpdateUserRoleRequest() {
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }
}
