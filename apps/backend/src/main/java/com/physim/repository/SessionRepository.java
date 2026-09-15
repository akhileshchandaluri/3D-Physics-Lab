package com.physim.repository;

import com.physim.entity.SessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<SessionEntity, String> {

    Optional<SessionEntity> findBySessionTokenHash(String sessionTokenHash);

    @Modifying
    @Query("DELETE FROM SessionEntity s WHERE s.sessionTokenHash = :hash")
    void deleteBySessionTokenHash(@Param("hash") String hash);

    @Modifying
    @Query("DELETE FROM SessionEntity s WHERE s.user.id = :userId")
    void deleteAllByUserId(@Param("userId") String userId);

    @Modifying
    @Query("DELETE FROM SessionEntity s WHERE s.expiresAt < :now")
    void deleteExpiredSessions(@Param("now") Instant now);
}
