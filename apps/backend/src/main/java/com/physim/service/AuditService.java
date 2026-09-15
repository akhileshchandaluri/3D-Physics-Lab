package com.physim.service;

import com.physim.entity.AuditLogEntity;
import com.physim.entity.UserEntity;
import com.physim.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(UserEntity actor, String action, String entityType, String entityId, String metadata, String ipAddress) {
        try {
            AuditLogEntity auditLog = new AuditLogEntity();
            auditLog.setActor(actor);
            auditLog.setAction(action);
            auditLog.setEntityType(entityType);
            auditLog.setEntityId(entityId);
            auditLog.setMetadata(metadata);
            auditLog.setIpAddress(ipAddress);
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.warn("Failed to record audit log: {}", e.getMessage());
        }
    }
}
