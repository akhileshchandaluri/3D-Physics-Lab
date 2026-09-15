package com.physim.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.constant.CatalogConstants;
import com.physim.dto.CreateAssignmentRequest;
import com.physim.dto.CreateClassroomRequest;
import com.physim.dto.JoinClassroomRequest;
import com.physim.dto.SubmitAssignmentRequest;
import com.physim.entity.*;
import com.physim.exception.BadRequestException;
import com.physim.exception.ConflictException;
import com.physim.exception.ForbiddenException;
import com.physim.exception.ResourceNotFoundException;
import com.physim.repository.*;
import com.physim.security.TokenUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TeacherService {

    private final ClassroomRepository classroomRepository;
    private final ClassroomMemberRepository classroomMemberRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final SavedExperimentRepository savedExperimentRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public TeacherService(
            ClassroomRepository classroomRepository,
            ClassroomMemberRepository classroomMemberRepository,
            AssignmentRepository assignmentRepository,
            SubmissionRepository submissionRepository,
            SavedExperimentRepository savedExperimentRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper) {
        this.classroomRepository = classroomRepository;
        this.classroomMemberRepository = classroomMemberRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.savedExperimentRepository = savedExperimentRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    private String generateClassCode() {
        return TokenUtils.generateRandomToken(3).toUpperCase();
    }

    @Transactional
    public ClassroomEntity createClassroom(String teacherId, CreateClassroomRequest request) {
        UserEntity teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found."));

        String code;
        if (request.getCode() != null && !request.getCode().trim().isEmpty()) {
            code = request.getCode().trim().toUpperCase();
            if (classroomRepository.existsByCodeIgnoreCase(code)) {
                throw new ConflictException("A classroom with code '" + code + "' already exists.");
            }
        } else {
            code = generateClassCode();
            int attempts = 0;
            while (classroomRepository.existsByCodeIgnoreCase(code) && attempts < 10) {
                code = generateClassCode();
                attempts++;
            }
            if (classroomRepository.existsByCodeIgnoreCase(code)) {
                code = TokenUtils.generateRandomToken(4).toUpperCase();
            }
        }

        ClassroomEntity classroom = new ClassroomEntity();
        classroom.setTeacher(teacher);
        classroom.setName(request.getName().trim());
        classroom.setCode(code);
        classroom.setDescription(request.getDescription());

        return classroomRepository.save(classroom);
    }

    @Transactional(readOnly = true)
    public List<ClassroomEntity> listTeacherClassrooms(String teacherId) {
        return classroomRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getClassroomDetails(String teacherId, String classroomId) {
        ClassroomEntity classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found."));

        UserEntity requester = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (!classroom.getTeacher().getId().equals(teacherId) && requester.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("You are not authorized to access this classroom.");
        }

        List<ClassroomMemberEntity> members = classroomMemberRepository.findByClassroomIdOrderByJoinedAtAsc(classroomId);
        List<AssignmentEntity> assignments = assignmentRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId);

        Map<String, Object> response = new HashMap<>();
        response.put("classroom", classroom);
        response.put("studentCount", members.size());
        response.put("students", members.stream().map(m -> Map.of(
                "id", m.getStudent().getId(),
                "name", m.getStudent().getName(),
                "email", m.getStudent().getEmail(),
                "joinedAt", m.getJoinedAt()
        )).toList());
        response.put("roster", members.stream().map(m -> Map.of(
                "studentId", m.getStudent().getId(),
                "studentName", m.getStudent().getName(),
                "studentEmail", m.getStudent().getEmail(),
                "joinedAt", m.getJoinedAt()
        )).toList());
        response.put("assignments", assignments);

        return response;
    }

    @Transactional
    public ClassroomMemberEntity joinClassroom(String studentId, JoinClassroomRequest request) {
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            throw new BadRequestException("Classroom enrollment code cannot be blank.");
        }

        String code = request.getCode().trim().toUpperCase();
        ClassroomEntity classroom = classroomRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new ResourceNotFoundException("No classroom found with code '" + code + "'."));

        UserEntity student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found."));

        if (student.getRole() == UserRole.TEACHER) {
            throw new ForbiddenException("Teachers cannot enroll in classrooms as students.");
        }

        if (classroom.getTeacher().getId().equals(studentId)) {
            throw new BadRequestException("Teachers cannot enroll as students in their own classrooms.");
        }

        if (classroomMemberRepository.existsByClassroomIdAndStudentId(classroom.getId(), studentId)) {
            throw new ConflictException("You are already enrolled in this classroom.");
        }

        ClassroomMemberEntity member = new ClassroomMemberEntity();
        member.setClassroom(classroom);
        member.setStudent(student);

        try {
            return classroomMemberRepository.saveAndFlush(member);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new ConflictException("You are already enrolled in this classroom.");
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listStudentClassrooms(String studentId) {
        List<ClassroomMemberEntity> memberships = classroomMemberRepository.findByStudentIdOrderByJoinedAtDesc(studentId);

        return memberships.stream().map(m -> {
            ClassroomEntity c = m.getClassroom();
            List<AssignmentEntity> assignments = assignmentRepository.findByClassroomIdOrderByCreatedAtDesc(c.getId());
            Map<String, Object> map = new HashMap<>();
            map.put("membershipId", m.getId());
            map.put("joinedAt", m.getJoinedAt());
            map.put("classroomId", c.getId());
            map.put("name", c.getName());
            map.put("code", c.getCode());
            map.put("description", c.getDescription());
            map.put("teacherName", c.getTeacher().getName());
            map.put("assignments", assignments);

            Map<String, Object> classroomMap = new HashMap<>();
            classroomMap.put("id", c.getId());
            classroomMap.put("name", c.getName());
            classroomMap.put("code", c.getCode());
            classroomMap.put("description", c.getDescription() != null ? c.getDescription() : "");
            classroomMap.put("teacherName", c.getTeacher().getName());
            classroomMap.put("createdAt", c.getCreatedAt());
            map.put("classroom", classroomMap);

            return map;
        }).toList();
    }

    @Transactional
    public AssignmentEntity createAssignment(String teacherId, String classroomId, CreateAssignmentRequest request) {
        ClassroomEntity classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found."));

        UserEntity requester = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (!classroom.getTeacher().getId().equals(teacherId) && requester.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("You are not authorized to create assignments in this classroom.");
        }

        if (!CatalogConstants.isValidExperimentId(request.getExperimentId())) {
            throw new BadRequestException("Invalid experiment ID. Must be one of the canonical 8: " + CatalogConstants.CANONICAL_EXPERIMENT_IDS);
        }

        String instructions = request.getInstructions();
        if (instructions == null && request.getDescription() != null) {
            instructions = request.getDescription();
        }

        AssignmentEntity assignment = new AssignmentEntity();
        assignment.setClassroom(classroom);
        assignment.setExperimentId(request.getExperimentId());
        assignment.setTitle(request.getTitle().trim());
        assignment.setInstructions(instructions != null ? instructions.trim() : null);
        assignment.setDueAt(request.getDueAt());

        return assignmentRepository.save(assignment);
    }

    @Transactional
    public SubmissionEntity submitAssignment(String studentId, String assignmentId, SubmitAssignmentRequest request) {
        AssignmentEntity assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found."));

        if (!classroomMemberRepository.existsByClassroomIdAndStudentId(assignment.getClassroom().getId(), studentId)) {
            throw new ForbiddenException("You must be enrolled in this classroom to submit assignments.");
        }

        SavedExperimentEntity savedExp = savedExperimentRepository.findActiveById(request.getSavedExperimentId())
                .orElseThrow(() -> new ResourceNotFoundException("Saved experiment not found."));

        if (!savedExp.getUser().getId().equals(studentId)) {
            throw new ForbiddenException("You can only submit saved experiments that you own.");
        }

        if (!savedExp.getExperimentId().equals(assignment.getExperimentId())) {
            throw new BadRequestException("This assignment requires experiment '" + assignment.getExperimentId() +
                    "', but the submitted experiment is '" + savedExp.getExperimentId() + "'.");
        }

        UserEntity student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found."));

        SubmissionEntity submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId)
                .orElse(new SubmissionEntity());

        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setSavedExperiment(savedExp);
        submission.setNotes(request.getNotes());

        return submissionRepository.save(submission);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAssignmentSubmissions(String teacherId, String assignmentId) {
        AssignmentEntity assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found."));

        UserEntity requester = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (!assignment.getClassroom().getTeacher().getId().equals(teacherId) && requester.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("You are not authorized to view submissions for this assignment.");
        }

        List<SubmissionEntity> submissions = submissionRepository.findByAssignmentIdOrderBySubmittedAtDesc(assignmentId);

        return submissions.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("submissionId", s.getId());
            map.put("studentId", s.getStudent().getId());
            map.put("studentName", s.getStudent().getName());
            map.put("studentEmail", s.getStudent().getEmail());
            map.put("notes", s.getNotes());
            map.put("submittedAt", s.getSubmittedAt());

            SavedExperimentEntity exp = s.getSavedExperiment();
            Object stateObj;
            try {
                stateObj = objectMapper.readValue(exp.getStateData(), Object.class);
            } catch (Exception e) {
                stateObj = exp.getStateData();
            }

            map.put("experimentState", stateObj);
            map.put("savedExperiment", Map.of(
                    "id", exp.getId(),
                    "title", exp.getTitle(),
                    "experimentId", exp.getExperimentId(),
                    "schemaVersion", exp.getSchemaVersion(),
                    "stateData", stateObj,
                    "updatedAt", exp.getUpdatedAt()
            ));

            return map;
        }).toList();
    }
}
