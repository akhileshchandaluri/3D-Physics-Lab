package com.physim.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Size;

public class UpdateSavedExperimentRequest {

    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @Size(max = 2000, message = "Notes must not exceed 2000 characters")
    private String notes;

    private Integer schemaVersion;

    @JsonAlias({"state", "stateData"})
    private Object stateData;

    public UpdateSavedExperimentRequest() {
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

    public Integer getSchemaVersion() {
        return schemaVersion;
    }

    public void setSchemaVersion(Integer schemaVersion) {
        this.schemaVersion = schemaVersion;
    }

    public Object getStateData() {
        return stateData;
    }

    public void setStateData(Object stateData) {
        this.stateData = stateData;
    }
}
