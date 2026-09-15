package com.physim.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "classroom_members",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_classroom_student", columnNames = {"classroom_id", "student_id"})
    },
    indexes = {
        @Index(name = "idx_classroom_members_student", columnList = "student_id")
    }
)
public class ClassroomMemberEntity {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "classroom_id", nullable = false)
    private ClassroomEntity classroom;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private UserEntity student;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    public ClassroomMemberEntity() {
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.joinedAt == null) {
            this.joinedAt = Instant.now();
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

    public UserEntity getStudent() {
        return student;
    }

    public void setStudent(UserEntity student) {
        this.student = student;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }
}
