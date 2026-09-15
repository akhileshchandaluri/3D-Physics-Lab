package com.physim.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SubmitAssignmentRequest {

    @NotBlank(message = "Saved experiment ID is required")
    private String savedExperimentId;

    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;

    public SubmitAssignmentRequest() {
    }

    public String getSavedExperimentId() {
        return savedExperimentId;
    }

    public void setSavedExperimentId(String savedExperimentId) {
        this.savedExperimentId = savedExperimentId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
