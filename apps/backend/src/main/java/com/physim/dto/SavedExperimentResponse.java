package com.physim.dto;

import java.time.Instant;

public class SavedExperimentResponse {

    private String id;
    private String userId;
    private String experimentId;
    private String title;
    private String notes;
    private int schemaVersion;
    private Object stateData;
    private Instant createdAt;
    private Instant updatedAt;

    public SavedExperimentResponse() {
    }

    public SavedExperimentResponse(String id, String userId, String experimentId, String title, String notes, int schemaVersion, Object stateData, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.experimentId = experimentId;
        this.title = title;
        this.notes = notes;
        this.schemaVersion = schemaVersion;
        this.stateData = stateData;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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

    public Object getState() {
        return stateData;
    }

    public void setStateData(Object stateData) {
        this.stateData = stateData;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
