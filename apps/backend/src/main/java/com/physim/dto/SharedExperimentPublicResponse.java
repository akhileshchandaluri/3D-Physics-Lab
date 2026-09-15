package com.physim.dto;

import java.time.Instant;

public class SharedExperimentPublicResponse {

    private String id;
    private String experimentId;
    private String title;
    private int schemaVersion;
    private Object stateData;
    private String authorName;
    private Instant createdAt;
    private Instant expiresAt;

    public SharedExperimentPublicResponse() {
    }

    public SharedExperimentPublicResponse(String id, String experimentId, String title, int schemaVersion, Object stateData, String authorName, Instant createdAt, Instant expiresAt) {
        this.id = id;
        this.experimentId = experimentId;
        this.title = title;
        this.schemaVersion = schemaVersion;
        this.stateData = stateData;
        this.authorName = authorName;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}
