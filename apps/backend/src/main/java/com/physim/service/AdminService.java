package com.physim.service;

import com.physim.dto.AdminCreateUserRequest;
import com.physim.dto.AuditLogDTO;
import com.physim.dto.PageResponse;
import com.physim.dto.PlatformStatsResponse;
import com.physim.dto.UserDTO;
import com.physim.entity.AuditLogEntity;
import com.physim.entity.UserEntity;
import com.physim.entity.UserRole;
import com.physim.exception.BadRequestException;
import com.physim.exception.ConflictException;
import com.physim.exception.ResourceNotFoundException;
import com.physim.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final SavedExperimentRepository savedExperimentRepository;
    private final ExperimentShareRepository experimentShareRepository;
    private final ClassroomRepository classroomRepository;
    private final SubmissionRepository submissionRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    public AdminService(
            UserRepository userRepository,
            SessionRepository sessionRepository,
            SavedExperimentRepository savedExperimentRepository,
            ExperimentShareRepository experimentShareRepository,
            ClassroomRepository classroomRepository,
            SubmissionRepository submissionRepository,
            AuditLogRepository auditLogRepository,
            AuditService auditService,
            AuthService authService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.savedExperimentRepository = savedExperimentRepository;
        this.experimentShareRepository = experimentShareRepository;
        this.classroomRepository = classroomRepository;
        this.submissionRepository = submissionRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditService = auditService;
        this.authService = authService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserDTO createUser(String adminActorId, AdminCreateUserRequest request, String ipAddress) {
        UserEntity adminActor = userRepository.findById(adminActorId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found."));

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists.");
        }

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setName(request.getName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(true);

        UserEntity saved = userRepository.save(user);
        auditService.logEvent(
                adminActor,
                "CREATE_USER",
                "User",
                saved.getId(),
                String.format("{\"email\":\"%s\",\"role\":\"%s\"}", saved.getEmail(), saved.getRole()),
                ipAddress
        );
        return authService.toDTO(saved);
    }

    @Transactional
    public void deleteUser(String adminActorId, String targetUserId, String ipAddress) {
        UserEntity adminActor = userRepository.findById(adminActorId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found."));

        UserEntity target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (target.getId().equals(adminActor.getId())) {
            throw new BadRequestException("Administrators cannot delete their own account.");
        }

        sessionRepository.deleteAllByUserId(targetUserId);
        auditService.logEvent(
                adminActor,
                "DELETE_USER",
                "User",
                targetUserId,
                String.format("{\"email\":\"%s\",\"role\":\"%s\"}", target.getEmail(), target.getRole()),
                ipAddress
        );
        userRepository.delete(target);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserDTO> listUsers(UserRole role, String search, int page, int limit) {
        int pageIndex = Math.max(0, page - 1);
        int pageSize = Math.min(Math.max(1, limit), 100);

        Page<UserEntity> userPage = userRepository.searchUsers(
                role,
                search != null && !search.isBlank() ? search.trim() : null,
                PageRequest.of(pageIndex, pageSize)
        );

        List<UserDTO> items = userPage.getContent().stream()
                .map(authService::toDTO)
                .toList();

        return new PageResponse<>(items, userPage.getTotalElements(), page, pageSize);
    }

    @Transactional
    public UserDTO updateUserRole(String adminActorId, String targetUserId, UserRole newRole, String ipAddress) {
        UserEntity adminActor = userRepository.findById(adminActorId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found."));

        UserEntity target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (target.getId().equals(adminActor.getId()) && newRole != UserRole.ADMIN) {
            throw new BadRequestException("Administrators cannot demote themselves from the ADMIN role.");
        }

        UserRole oldRole = target.getRole();
        target.setRole(newRole);
        UserEntity saved = userRepository.save(target);

        auditService.logEvent(
                adminActor,
                "UPDATE_USER_ROLE",
                "User",
                targetUserId,
                String.format("{\"previousRole\":\"%s\",\"newRole\":\"%s\"}", oldRole, newRole),
                ipAddress
        );

        return authService.toDTO(saved);
    }

    @Transactional
    public UserDTO updateUserStatus(String adminActorId, String targetUserId, boolean active, String ipAddress) {
        UserEntity adminActor = userRepository.findById(adminActorId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found."));

        UserEntity target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (target.getId().equals(adminActor.getId()) && !active) {
            throw new BadRequestException("Administrators cannot deactivate their own account.");
        }

        target.setActive(active);
        UserEntity saved = userRepository.save(target);

        if (!active) {
            sessionRepository.deleteAllByUserId(targetUserId);
        }

        auditService.logEvent(
                adminActor,
                "UPDATE_USER_STATUS",
                "User",
                targetUserId,
                String.format("{\"isActive\":%b}", active),
                ipAddress
        );

        return authService.toDTO(saved);
    }

    @Transactional(readOnly = true)
    public PlatformStatsResponse getPlatformStats() {
        long totalUsers = userRepository.count();
        long students = userRepository.countByRole(UserRole.STUDENT);
        long teachers = userRepository.countByRole(UserRole.TEACHER);
        long admins = userRepository.countByRole(UserRole.ADMIN);

        long savedExperiments = savedExperimentRepository.countByDeletedFalse();
        long activeShares = experimentShareRepository.countByRevokedFalse();

        long classrooms = classroomRepository.count();
        long submissions = submissionRepository.count();

        return new PlatformStatsResponse(
                new PlatformStatsResponse.UserStats(totalUsers, students, teachers, admins),
                new PlatformStatsResponse.ExperimentStats(savedExperiments, activeShares),
                new PlatformStatsResponse.AcademicStats(classrooms, submissions)
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogDTO> getAuditLogs(int page, int limit) {
        int pageIndex = Math.max(0, page - 1);
        int pageSize = Math.min(Math.max(1, limit), 100);

        Page<AuditLogEntity> logPage = auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(pageIndex, pageSize));

        List<AuditLogDTO> items = logPage.getContent().stream().map(l -> new AuditLogDTO(
                l.getId(),
                l.getActor() != null ? l.getActor().getId() : null,
                l.getActor() != null ? l.getActor().getName() : "System",
                l.getActor() != null ? l.getActor().getEmail() : null,
                l.getAction(),
                l.getEntityType(),
                l.getEntityId(),
                l.getMetadata(),
                l.getIpAddress(),
                l.getCreatedAt()
        )).toList();

        return new PageResponse<>(items, logPage.getTotalElements(), page, pageSize);
    }
}
