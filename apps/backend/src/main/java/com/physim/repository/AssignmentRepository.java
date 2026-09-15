package com.physim.repository;

import com.physim.entity.AssignmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<AssignmentEntity, String> {

    List<AssignmentEntity> findByClassroomIdOrderByCreatedAtDesc(String classroomId);

    long countByClassroomId(String classroomId);
}
