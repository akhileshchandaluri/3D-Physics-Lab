package com.physim.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "submissions", uniqueConstraints = {
    @UniqueConstraint(name = "uq_assignment_student", columnNames = {"assignment_id", "student_id"})
}, indexes = {
    @Index(name = "idx_submissions_student_id", columnList = "student_id")
})
public class SubmissionEntity {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "assignment_id", nullable = false)
    private AssignmentEntity assignment;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private UserEntity student;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "saved_experiment_id", nullable = false)
    private SavedExperimentEntity savedExperiment;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private Instant submittedAt;

    public SubmissionEntity() {
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.submittedAt == null) {
            this.submittedAt = Instant.now();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public AssignmentEntity getAssignment() {
        return assignment;
    }

    public void setAssignment(AssignmentEntity assignment) {
        this.assignment = assignment;
    }

    public UserEntity getStudent() {
        return student;
    }

    public void setStudent(UserEntity student) {
        this.student = student;
    }

    public SavedExperimentEntity getSavedExperiment() {
        return savedExperiment;
    }

    public void setSavedExperiment(SavedExperimentEntity savedExperiment) {
        this.savedExperiment = savedExperiment;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }
}
