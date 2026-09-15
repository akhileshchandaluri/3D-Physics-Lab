package com.physim.controller;

import com.physim.dto.CreateAssignmentRequest;
import com.physim.dto.CreateClassroomRequest;
import com.physim.dto.JoinClassroomRequest;
import com.physim.dto.SubmitAssignmentRequest;
import com.physim.entity.AssignmentEntity;
import com.physim.entity.ClassroomEntity;
import com.physim.entity.ClassroomMemberEntity;
import com.physim.entity.SubmissionEntity;
import com.physim.security.UserPrincipal;
import com.physim.service.TeacherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/teacher")
@Tag(name = "Teacher", description = "Classroom workflows, student assignments, and experiment submissions")
public class TeacherController {

    private final TeacherService teacherService;

    public TeacherController(TeacherService teacherService) {
        this.teacherService = teacherService;
    }

    // --- Teacher Classroom Management ---

    @PostMapping("/classrooms")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Create classroom", description = "Creates a new classroom with a unique enrollment code.")
    public ResponseEntity<ClassroomEntity> createClassroom(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateClassroomRequest request) {
        ClassroomEntity classroom = teacherService.createClassroom(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(classroom);
    }

    @GetMapping("/classrooms")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "List teacher classrooms", description = "Lists classrooms managed by the authenticated teacher.")
    public ResponseEntity<Map<String, Object>> listTeacherClassrooms(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ClassroomEntity> classrooms = teacherService.listTeacherClassrooms(principal.getId());
        return ResponseEntity.ok(Map.of("classrooms", classrooms));
    }

    @GetMapping("/classrooms/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Get classroom details", description = "Retrieves classroom roster, student count, and assignments.")
    public ResponseEntity<Map<String, Object>> getClassroomDetails(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id) {
        Map<String, Object> details = teacherService.getClassroomDetails(principal.getId(), id);
        return ResponseEntity.ok(details);
    }

    @PostMapping("/classrooms/{id}/assignments")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Create assignment", description = "Creates a new experiment assignment for a classroom.")
    public ResponseEntity<AssignmentEntity> createAssignment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody CreateAssignmentRequest request) {
        AssignmentEntity assignment = teacherService.createAssignment(principal.getId(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(assignment);
    }

    @GetMapping("/assignments/{assignmentId}/submissions")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @Operation(summary = "Get assignment submissions", description = "Lists student submissions and experiment states for an assignment.")
    public ResponseEntity<Map<String, Object>> getAssignmentSubmissions(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String assignmentId) {
        List<Map<String, Object>> submissions = teacherService.getAssignmentSubmissions(principal.getId(), assignmentId);
        return ResponseEntity.ok(Map.of("submissions", submissions));
    }

    // --- Student Enrollment and Submissions ---

    @PostMapping("/classrooms/join")
    @Operation(summary = "Join classroom", description = "Enrolls a student into a classroom using an alphanumeric code.")
    public ResponseEntity<Map<String, Object>> joinClassroom(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody JoinClassroomRequest request) {
        ClassroomMemberEntity member = teacherService.joinClassroom(principal.getId(), request);
        return ResponseEntity.ok(Map.of(
                "message", "Successfully enrolled in classroom.",
                "membership", member
        ));
    }

    @GetMapping("/classrooms/enrolled")
    @Operation(summary = "List enrolled classrooms", description = "Lists classrooms that the current student is enrolled in.")
    public ResponseEntity<Map<String, Object>> listStudentClassrooms(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Map<String, Object>> classrooms = teacherService.listStudentClassrooms(principal.getId());
        return ResponseEntity.ok(Map.of("classrooms", classrooms));
    }

    @PostMapping("/assignments/{assignmentId}/submit")
    @Operation(summary = "Submit assignment", description = "Submits a saved experiment to an assignment.")
    public ResponseEntity<Map<String, Object>> submitAssignment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String assignmentId,
            @Valid @RequestBody SubmitAssignmentRequest request) {
        SubmissionEntity submission = teacherService.submitAssignment(principal.getId(), assignmentId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Assignment submitted successfully.",
                "submission", submission
        ));
    }
}
