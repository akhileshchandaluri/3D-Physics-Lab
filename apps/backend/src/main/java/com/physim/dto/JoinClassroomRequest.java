package com.physim.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class JoinClassroomRequest {

    @NotBlank(message = "Classroom enrollment code is required")
    @Size(min = 3, max = 30, message = "Code must be between 3 and 30 characters")
    private String code;

    public JoinClassroomRequest() {
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
