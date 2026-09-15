package com.physim.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

public class CreateAssignmentRequest {

    @NotBlank(message = "Experiment ID is required")
    private String experimentId;

    @NotBlank(message = "Title cannot be blank")
    @Size(min = 2, max = 150, message = "Title must be between 2 and 150 characters")
    private String title;

    @Size(max = 3000, message = "Instructions must not exceed 3000 characters")
    private String instructions;

    private Instant dueAt;

    public CreateAssignmentRequest() {
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

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public Instant getDueAt() {
        return dueAt;
    }

    @JsonSetter("dueAt")
    public void setDueAt(Object value) {
        this.dueAt = parseFlexibleInstant(value);
    }

    public Instant getDueDate() {
        return dueAt;
    }

    @JsonSetter("dueDate")
    public void setDueDate(Object value) {
        this.dueAt = parseFlexibleInstant(value);
    }

    public String getDescription() {
        return instructions;
    }

    public void setDescription(String description) {
        this.instructions = description;
    }

    private static Instant parseFlexibleInstant(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof Number num) {
            return Instant.ofEpochMilli(num.longValue());
        }
        String str = value.toString().trim();
        if (str.isEmpty()) {
            return null;
        }
        // Handle date-only strings like YYYY-MM-DD from HTML5 date picker
        if (str.length() == 10 && str.charAt(4) == '-' && str.charAt(7) == '-') {
            try {
                return LocalDate.parse(str).atTime(23, 59, 59).atZone(ZoneOffset.UTC).toInstant();
            } catch (Exception ignored) {
            }
        }
        try {
            return Instant.parse(str);
        } catch (Exception e1) {
            try {
                return OffsetDateTime.parse(str).toInstant();
            } catch (Exception e2) {
                try {
                    return LocalDate.parse(str).atStartOfDay(ZoneOffset.UTC).toInstant();
                } catch (Exception e3) {
                    throw new IllegalArgumentException("Invalid date format for due date: " + str);
                }
            }
        }
    }
}
