package com.physim.config;

import com.physim.entity.AssignmentEntity;
import com.physim.entity.ClassroomEntity;
import com.physim.entity.UserEntity;
import com.physim.entity.UserRole;
import com.physim.repository.AssignmentRepository;
import com.physim.repository.ClassroomRepository;
import com.physim.repository.UserRepository;
import com.physim.service.MfaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;
    private final AssignmentRepository assignmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.initial-email:admin@physim.edu}")
    private String adminEmail;

    @Value("${app.admin.initial-password:AdminPassword123!}")
    private String adminPassword;

    @Value("${app.admin.initial-name:System Administrator}")
    private String adminName;

    public DataInitializer(
            UserRepository userRepository,
            ClassroomRepository classroomRepository,
            AssignmentRepository assignmentRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.classroomRepository = classroomRepository;
        this.assignmentRepository = assignmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // 1. Provision initial administrator if not present
        if (!userRepository.existsByEmail(adminEmail)) {
            UserEntity admin = new UserEntity();
            admin.setEmail(adminEmail);
            admin.setName(adminName);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setRole(UserRole.ADMIN);
            admin.setActive(true);
            admin.setTotpSecret(MfaService.DEMO_TOTP_SECRET);
            admin.setTotpEnabled(true);
            userRepository.save(admin);
            log.info("Initialized default administrator account: {}", adminEmail);
        } else {
            userRepository.findByEmail(adminEmail).ifPresent(admin -> {
                if (!admin.isTotpEnabled()) {
                    admin.setTotpSecret(MfaService.DEMO_TOTP_SECRET);
                    admin.setTotpEnabled(true);
                    userRepository.save(admin);
                }
            });
        }

        // 2. Provision demo teacher if not present
        String teacherEmail = "teacher@physim.edu";
        if (!userRepository.existsByEmail(teacherEmail)) {
            UserEntity teacher = new UserEntity();
            teacher.setEmail(teacherEmail);
            teacher.setName("Prof. Sharma");
            teacher.setPasswordHash(passwordEncoder.encode("TeacherPassword123!"));
            teacher.setRole(UserRole.TEACHER);
            teacher.setActive(true);
            teacher.setTotpSecret(MfaService.DEMO_TOTP_SECRET);
            teacher.setTotpEnabled(true);
            UserEntity savedTeacher = userRepository.save(teacher);
            log.info("Initialized default teacher account: {}", teacherEmail);

            // 3. Provision demo classroom and assignment
            if (!classroomRepository.existsByCode("PHY101")) {
                ClassroomEntity classroom = new ClassroomEntity();
                classroom.setTeacher(savedTeacher);
                classroom.setName("Applied Physics Laboratory I");
                classroom.setCode("PHY101");
                classroom.setDescription("First year engineering physics lab sessions and simulation assignments.");
                ClassroomEntity savedClassroom = classroomRepository.save(classroom);

                AssignmentEntity assignment = new AssignmentEntity();
                assignment.setClassroom(savedClassroom);
                assignment.setExperimentId("ohms-law");
                assignment.setTitle("Ohm's Law Verification at 75°C");
                assignment.setInstructions("Record the current and power at 12V with 100Ω and 200Ω nominal resistance at 75°C.");
                assignment.setDueAt(Instant.now().plus(14, ChronoUnit.DAYS));
                assignmentRepository.save(assignment);
                log.info("Initialized default classroom [PHY101] with assignment.");
            }
        } else {
            userRepository.findByEmail(teacherEmail).ifPresent(teacher -> {
                if (!teacher.isTotpEnabled()) {
                    teacher.setTotpSecret(MfaService.DEMO_TOTP_SECRET);
                    teacher.setTotpEnabled(true);
                    userRepository.save(teacher);
                }
            });
        }
    }
}
