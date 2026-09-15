package com.physim.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assignments", indexes = {
    @Index(name = "idx_assignments_classroom_id", columnList = "classroom_id")
})
public class AssignmentEntity {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "classroom_id", nullable = false)
    private ClassroomEntity classroom;

    @Column(name = "experiment_id", length = 100, nullable = false)
    private String experimentId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public AssignmentEntity() {
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public ClassroomEntity getClassroom() {
        return classroom;
    }

    public void setClassroom(ClassroomEntity classroom) {
        this.classroom = classroom;
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

    public void setDueAt(Instant dueAt) {
        this.dueAt = dueAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
