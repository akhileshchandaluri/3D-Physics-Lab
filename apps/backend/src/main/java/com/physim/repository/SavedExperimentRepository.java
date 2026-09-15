package com.physim.repository;

import com.physim.entity.SavedExperimentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavedExperimentRepository extends JpaRepository<SavedExperimentEntity, String> {

    @Query("SELECT s FROM SavedExperimentEntity s WHERE s.id = :id AND s.deleted = false")
    Optional<SavedExperimentEntity> findActiveById(@Param("id") String id);

    @Query("SELECT s FROM SavedExperimentEntity s WHERE s.user.id = :userId AND s.deleted = false " +
           "AND (:experimentId IS NULL OR s.experimentId = :experimentId) ORDER BY s.updatedAt DESC")
    Page<SavedExperimentEntity> findActiveByUserId(
        @Param("userId") String userId,
        @Param("experimentId") String experimentId,
        Pageable pageable
    );

    long countByDeletedFalse();
}
