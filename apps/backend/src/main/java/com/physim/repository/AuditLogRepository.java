package com.physim.repository;

import com.physim.entity.AuditLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntity, String> {

    Page<AuditLogEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<AuditLogEntity> findByActorIdOrderByCreatedAtDesc(String actorId);
}
