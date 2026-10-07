package com.physim.repository;

import com.physim.entity.MfaChallengeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface MfaChallengeRepository extends JpaRepository<MfaChallengeEntity, String> {
    Optional<MfaChallengeEntity> findByChallengeTokenHash(String challengeTokenHash);

    void deleteByExpiresAtBefore(Instant cutoff);
}
