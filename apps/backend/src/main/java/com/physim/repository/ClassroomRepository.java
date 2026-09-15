package com.physim.repository;

import com.physim.entity.ClassroomEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomRepository extends JpaRepository<ClassroomEntity, String> {

    Optional<ClassroomEntity> findByCode(String code);

    Optional<ClassroomEntity> findByCodeIgnoreCase(String code);

    List<ClassroomEntity> findByTeacherIdOrderByCreatedAtDesc(String teacherId);

    boolean existsByCode(String code);

    boolean existsByCodeIgnoreCase(String code);
}
