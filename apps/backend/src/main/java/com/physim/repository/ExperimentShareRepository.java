package com.physim.repository;

import com.physim.entity.ExperimentShareEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExperimentShareRepository extends JpaRepository<ExperimentShareEntity, String> {

    Optional<ExperimentShareEntity> findByTokenHash(String tokenHash);

    @Modifying
    @Query("UPDATE ExperimentShareEntity s SET s.revoked = true WHERE s.savedExperiment.id = :savedExperimentId")
    void revokeAllBySavedExperimentId(@Param("savedExperimentId") String savedExperimentId);

    long countByRevokedFalse();
}
