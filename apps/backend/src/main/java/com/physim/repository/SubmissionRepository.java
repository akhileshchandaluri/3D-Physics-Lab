package com.physim.repository;

import com.physim.entity.SubmissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<SubmissionEntity, String> {

    Optional<SubmissionEntity> findByAssignmentIdAndStudentId(String assignmentId, String studentId);

    List<SubmissionEntity> findByAssignmentIdOrderBySubmittedAtDesc(String assignmentId);

    List<SubmissionEntity> findByStudentIdOrderBySubmittedAtDesc(String studentId);
}
