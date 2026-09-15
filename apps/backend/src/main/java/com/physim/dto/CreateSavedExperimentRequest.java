package com.physim.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateSavedExperimentRequest {

    @NotBlank(message = "Experiment ID is required")
    private String experimentId;

    @NotBlank(message = "Title cannot be blank")
    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    private String notes;

    private int schemaVersion = 1;

    @NotNull(message = "State data is required")
    @JsonAlias({"state", "stateData"})
    private Object stateData;

    public CreateSavedExperimentRequest() {
    }

    public String getExperimentId() {
        return experimentId;
    }

    public void setExperimentId(String experimentId) {
        this.experimentId = experimentId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public int getSchemaVersion() {
        return schemaVersion;
    }

    public void setSchemaVersion(int schemaVersion) {
        this.schemaVersion = schemaVersion;
    }

    public Object getStateData() {
        return stateData;
    }

    public void setStateData(Object stateData) {
        this.stateData = stateData;
    }
}
