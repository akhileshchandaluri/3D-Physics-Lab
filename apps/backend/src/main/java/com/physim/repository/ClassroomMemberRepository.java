package com.physim.repository;

import com.physim.entity.ClassroomMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomMemberRepository extends JpaRepository<ClassroomMemberEntity, String> {

    Optional<ClassroomMemberEntity> findByClassroomIdAndStudentId(String classroomId, String studentId);

    boolean existsByClassroomIdAndStudentId(String classroomId, String studentId);

    List<ClassroomMemberEntity> findByStudentIdOrderByJoinedAtDesc(String studentId);

    List<ClassroomMemberEntity> findByClassroomIdOrderByJoinedAtAsc(String classroomId);

    long countByClassroomId(String classroomId);
}
