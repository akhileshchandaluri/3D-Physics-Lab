package com.physim.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.dto.*;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TeacherWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private Cookie teacherCookie;
    private Cookie studentCookie;

    @BeforeEach
    void setUp() throws Exception {
        // Login default seeded teacher
        LoginRequest teacherLogin = new LoginRequest();
        teacherLogin.setEmail("teacher@physim.edu");
        teacherLogin.setPassword("TeacherPassword123!");

        MvcResult teacherRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(teacherLogin)))
                .andExpect(status().isOk())
                .andReturn();

        teacherCookie = teacherRes.getResponse().getCookie("physim_session");

        // Create a new student
        SignupRequest studentSignup = new SignupRequest();
        studentSignup.setEmail("student_workflow_" + System.currentTimeMillis() + "@test.com");
        studentSignup.setPassword("StudentPass123!");
        studentSignup.setName("Alice Student");

        MvcResult studentRes = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(studentSignup)))
                .andExpect(status().isCreated())
                .andReturn();

        studentCookie = studentRes.getResponse().getCookie("physim_session");
    }

    @Test
    void testCompleteTeacherStudentWorkflow() throws Exception {
        // 1. Teacher creates classroom
        CreateClassroomRequest classReq = new CreateClassroomRequest();
        classReq.setName("Physics 101 - Spring");
        classReq.setDescription("Introductory physics laboratory");

        MvcResult classRes = mockMvc.perform(post("/api/v1/teacher/classrooms")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Physics 101 - Spring"))
                .andExpect(jsonPath("$.code").isNotEmpty())
                .andReturn();

        String classId = objectMapper.readTree(classRes.getResponse().getContentAsString()).get("id").asText();
        String joinCode = objectMapper.readTree(classRes.getResponse().getContentAsString()).get("code").asText();

        // 2. Student joins classroom
        JoinClassroomRequest joinReq = new JoinClassroomRequest();
        joinReq.setCode(joinCode);

        mockMvc.perform(post("/api/v1/teacher/classrooms/join")
                        .cookie(studentCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(joinReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.membership.classroom.id").value(classId));

        // 3. Teacher creates assignment
        CreateAssignmentRequest assignReq = new CreateAssignmentRequest();
        assignReq.setExperimentId("ohms-law");
        assignReq.setTitle("Ohm's Law Verification Lab");
        assignReq.setInstructions("Verify V = IR with at least 5 data points");
        assignReq.setDueAt(Instant.now().plus(7, ChronoUnit.DAYS));

        MvcResult assignRes = mockMvc.perform(post("/api/v1/teacher/classrooms/" + classId + "/assignments")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Ohm's Law Verification Lab"))
                .andReturn();

        String assignmentId = objectMapper.readTree(assignRes.getResponse().getContentAsString()).get("id").asText();

        // 4. Student creates a saved experiment
        CreateSavedExperimentRequest expReq = new CreateSavedExperimentRequest();
        expReq.setExperimentId("ohms-law");
        expReq.setTitle("Student Lab Work");
        expReq.setStateData(Map.of("voltage", 10.0, "resistance", 100.0, "temperature", 25.0));

        MvcResult expRes = mockMvc.perform(post("/api/v1/experiments")
                        .cookie(studentCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(expReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String savedExpId = objectMapper.readTree(expRes.getResponse().getContentAsString()).get("id").asText();

        // 5. Student submits assignment
        SubmitAssignmentRequest submitReq = new SubmitAssignmentRequest();
        submitReq.setSavedExperimentId(savedExpId);
        submitReq.setNotes("Completed with verified measurements");

        mockMvc.perform(post("/api/v1/teacher/assignments/" + assignmentId + "/submit")
                        .cookie(studentCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.submission.notes").value("Completed with verified measurements"));

        // 6. Teacher views submissions
        mockMvc.perform(get("/api/v1/teacher/assignments/" + assignmentId + "/submissions")
                        .cookie(teacherCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submissions", hasSize(1)));
    }

    @Test
    void testStudentCannotCreateClassroom() throws Exception {
        CreateClassroomRequest classReq = new CreateClassroomRequest();
        classReq.setName("Unauthorized Classroom");

        mockMvc.perform(post("/api/v1/teacher/classrooms")
                        .cookie(studentCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testStudentCannotAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .cookie(studentCookie))
                .andExpect(status().isForbidden());
    }

    @Test
    void testTeacherCannotAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .cookie(teacherCookie))
                .andExpect(status().isForbidden());
    }

    @Test
    void testSignupIgnoresRoleAndAlwaysCreatesStudent() throws Exception {
        String payload = "{\"name\":\"Hacker\",\"email\":\"hacker_" + System.currentTimeMillis() + "@test.com\",\"password\":\"HackerPass123!\",\"role\":\"TEACHER\"}";

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("STUDENT"));
    }

    @Test
    void testCreateClassroomReturnsUsableJoinCodeAndAppearsInTeacherList() throws Exception {
        CreateClassroomRequest classReq = new CreateClassroomRequest();
        classReq.setName("Electromagnetism 201");
        classReq.setDescription("Advanced electromagnetism physics lab");

        MvcResult createRes = mockMvc.perform(post("/api/v1/teacher/classrooms")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.code").isNotEmpty())
                .andReturn();

        String classId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("id").asText();

        // Verify it appears in teacher's classroom list
        mockMvc.perform(get("/api/v1/teacher/classrooms")
                        .cookie(teacherCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.classrooms[*].id", hasItem(classId)));
    }

    @Test
    void testStudentJoinWithWhitespaceAndCaseVariation() throws Exception {
        // Teacher creates classroom with code
        String customCode = "PHY" + (System.currentTimeMillis() % 10000);
        CreateClassroomRequest classReq = new CreateClassroomRequest();
        classReq.setName("Mechanics 101");
        classReq.setCode(customCode);

        mockMvc.perform(post("/api/v1/teacher/classrooms")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classReq)))
                .andExpect(status().isCreated());

        // Student joins using lowercase and surrounding whitespace
        JoinClassroomRequest joinReq = new JoinClassroomRequest();
        joinReq.setCode("  " + customCode.toLowerCase() + "  ");

        mockMvc.perform(post("/api/v1/teacher/classrooms/join")
                        .cookie(studentCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(joinReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.membership.classroom.code").value(customCode.toUpperCase()));

        // Verify enrolled classes returns classroom and nested structure expected by frontend
        mockMvc.perform(get("/api/v1/teacher/classrooms/enrolled")
                        .cookie(studentCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.classrooms", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.classrooms[0].classroom.id").isNotEmpty())
                .andExpect(jsonPath("$.classrooms[0].classroom.name").value("Mechanics 101"))
                .andExpect(jsonPath("$.classrooms[0].classroom.code").value(customCode.toUpperCase()));
    }

    @Test
    void testJoinWithInvalidCodeReturnsNotFound() throws Exception {
        JoinClassroomRequest joinReq = new JoinClassroomRequest();
        joinReq.setCode("NONEXISTENT123");

        mockMvc.perform(post("/api/v1/teacher/classrooms/join")
                        .cookie(studentCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(joinReq)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void testDuplicateJoinReturnsConflict() throws Exception {
        CreateClassroomRequest classReq = new CreateClassroomRequest();
        classReq.setName("Optics 301");

        MvcResult createRes = mockMvc.perform(post("/api/v1/teacher/classrooms")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String code = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("code").asText();

        JoinClassroomRequest joinReq = new JoinClassroomRequest();
        joinReq.setCode(code);

        // First join succeeds
        mockMvc.perform(post("/api/v1/teacher/classrooms/join")
                        .cookie(studentCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(joinReq)))
                .andExpect(status().isOk());

        // Second join returns conflict
        mockMvc.perform(post("/api/v1/teacher/classrooms/join")
                        .cookie(studentCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(joinReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }

    @Test
    void testConcurrentJoinSafeFromDuplicateMembershipAndServerErrors() throws Exception {
        CreateClassroomRequest classReq = new CreateClassroomRequest();
        classReq.setName("Quantum Computing 401");

        MvcResult createRes = mockMvc.perform(post("/api/v1/teacher/classrooms")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String code = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("code").asText();

        JoinClassroomRequest joinReq = new JoinClassroomRequest();
        joinReq.setCode(code);
        String payload = objectMapper.writeValueAsString(joinReq);

        // Execute two rapid/concurrent join attempts
        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(2);
        java.util.concurrent.Callable<Integer> joinTask = () -> {
            MvcResult res = mockMvc.perform(post("/api/v1/teacher/classrooms/join")
                            .cookie(studentCookie)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andReturn();
            return res.getResponse().getStatus();
        };

        java.util.List<java.util.concurrent.Future<Integer>> futures = executor.invokeAll(java.util.List.of(joinTask, joinTask));
        java.util.List<Integer> statuses = new java.util.ArrayList<>();
        for (var f : futures) {
            statuses.add(f.get());
        }
        executor.shutdown();

        // One must succeed (200) and the other must either succeed or return conflict (409).
        // Crucially, NEITHER should return a 500 internal server error.
        org.junit.jupiter.api.Assertions.assertTrue(statuses.contains(200), "At least one request should succeed with 200");
        for (int status : statuses) {
            org.junit.jupiter.api.Assertions.assertTrue(status == 200 || status == 409,
                    "Expected 200 or 409 status, but got: " + status);
        }
    }

    @Test
    void testTeacherCannotEnrollInClassroomAsStudent() throws Exception {
        CreateClassroomRequest classReq = new CreateClassroomRequest();
        classReq.setName("Teacher Lab");

        MvcResult createRes = mockMvc.perform(post("/api/v1/teacher/classrooms")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String code = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("code").asText();

        JoinClassroomRequest joinReq = new JoinClassroomRequest();
        joinReq.setCode(code);

        // Teacher attempting to join as student is forbidden
        mockMvc.perform(post("/api/v1/teacher/classrooms/join")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(joinReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUnauthenticatedRequestsRejected() throws Exception {
        JoinClassroomRequest joinReq = new JoinClassroomRequest();
        joinReq.setCode("ANYCODE123");

        mockMvc.perform(post("/api/v1/teacher/classrooms/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(joinReq)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/teacher/classrooms/enrolled"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testStudentCannotAccessTeacherClassroomDetails() throws Exception {
        CreateClassroomRequest classReq = new CreateClassroomRequest();
        classReq.setName("Private Teacher Class");

        MvcResult createRes = mockMvc.perform(post("/api/v1/teacher/classrooms")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String classId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("id").asText();

        // Student cannot access teacher's details endpoint
        mockMvc.perform(get("/api/v1/teacher/classrooms/" + classId)
                        .cookie(studentCookie))
                .andExpect(status().isForbidden());
    }

    @Test
    void testJoinIgnoresTamperedStudentIdInBody() throws Exception {
        CreateClassroomRequest classReq = new CreateClassroomRequest();
        classReq.setName("Tamper Proof Class");

        MvcResult createRes = mockMvc.perform(post("/api/v1/teacher/classrooms")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String code = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("code").asText();

        // Tamper attempt with a fake studentId in body
        String tamperedPayload = "{\"code\":\"" + code + "\",\"studentId\":\"fake-student-id-9999\"}";

        mockMvc.perform(post("/api/v1/teacher/classrooms/join")
                        .cookie(studentCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tamperedPayload))
                .andExpect(status().isOk())
                // Verify the membership is created for the authenticated student, not the fake one
                .andExpect(jsonPath("$.membership.student.id").isNotEmpty())
                .andExpect(jsonPath("$.membership.student.id").value(not("fake-student-id-9999")));
    }

    @Test
    void testCreateAssignmentWithDateOnlyString() throws Exception {
        // Teacher creates classroom
        CreateClassroomRequest classReq = new CreateClassroomRequest();
        classReq.setName("Assignment Date Test Class");

        MvcResult classRes = mockMvc.perform(post("/api/v1/teacher/classrooms")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String classId = objectMapper.readTree(classRes.getResponse().getContentAsString()).get("id").asText();

        // Create assignment with YYYY-MM-DD date string (as sent by HTML5 date input)
        String payload = "{\"title\":\"Ohm's Law Lab\",\"description\":\"Complete all 5 sessions\",\"experimentId\":\"ohms-law\",\"dueDate\":\"2026-11-20\"}";

        MvcResult assignRes = mockMvc.perform(post("/api/v1/teacher/classrooms/" + classId + "/assignments")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Ohm's Law Lab"))
                .andExpect(jsonPath("$.instructions").value("Complete all 5 sessions"))
                .andExpect(jsonPath("$.experimentId").value("ohms-law"))
                .andExpect(jsonPath("$.dueAt").isNotEmpty())
                .andReturn();

        // Verify assignment appears in classroom details
        mockMvc.perform(get("/api/v1/teacher/classrooms/" + classId)
                        .cookie(teacherCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignments", hasSize(1)))
                .andExpect(jsonPath("$.assignments[0].title").value("Ohm's Law Lab"));
    }

    @Test
    void testCreateAssignmentValidationErrors() throws Exception {
        // Teacher creates classroom
        CreateClassroomRequest classReq = new CreateClassroomRequest();
        classReq.setName("Validation Class");

        MvcResult classRes = mockMvc.perform(post("/api/v1/teacher/classrooms")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String classId = objectMapper.readTree(classRes.getResponse().getContentAsString()).get("id").asText();

        // Blank title should fail with 400
        String missingTitle = "{\"title\":\"\",\"experimentId\":\"ohms-law\"}";
        mockMvc.perform(post("/api/v1/teacher/classrooms/" + classId + "/assignments")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(missingTitle))
                .andExpect(status().isBadRequest());

        // Invalid experiment ID should fail with 400
        String badExp = "{\"title\":\"Bad Exp Lab\",\"experimentId\":\"invalid-exp-id\"}";
        mockMvc.perform(post("/api/v1/teacher/classrooms/" + classId + "/assignments")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badExp))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testTeacherCannotCreateAssignmentInAnotherTeachersClassroom() throws Exception {
        // 1. Create a second teacher
        SignupRequest secondTeacherSignup = new SignupRequest();
        secondTeacherSignup.setName("Prof. Second");
        secondTeacherSignup.setEmail("teacher2_" + System.currentTimeMillis() + "@physim.edu");
        secondTeacherSignup.setPassword("Teacher2Password123!");

        MvcResult signupRes = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondTeacherSignup)))
                .andExpect(status().isCreated())
                .andReturn();

        // Promote second user to TEACHER via admin
        LoginRequest adminLogin = new LoginRequest();
        adminLogin.setEmail("admin@physim.edu");
        adminLogin.setPassword("AdminPassword123!");

        MvcResult adminRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie adminCookie = adminRes.getResponse().getCookie("physim_session");
        String secondUserId = objectMapper.readTree(signupRes.getResponse().getContentAsString()).get("user").get("id").asText();

        mockMvc.perform(patch("/api/v1/admin/users/" + secondUserId + "/role")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"TEACHER\"}"))
                .andExpect(status().isOk());

        // Login as second teacher
        LoginRequest teacher2Login = new LoginRequest();
        teacher2Login.setEmail(secondTeacherSignup.getEmail());
        teacher2Login.setPassword(secondTeacherSignup.getPassword());

        MvcResult teacher2Res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(teacher2Login)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie teacher2Cookie = teacher2Res.getResponse().getCookie("physim_session");

        // Teacher 1 creates a classroom
        CreateClassroomRequest classReq = new CreateClassroomRequest();
        classReq.setName("Teacher 1 Exclusive Class");

        MvcResult classRes = mockMvc.perform(post("/api/v1/teacher/classrooms")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String classId = objectMapper.readTree(classRes.getResponse().getContentAsString()).get("id").asText();

        // Teacher 2 attempts to create an assignment in Teacher 1's classroom -> 403 FORBIDDEN
        String payload = "{\"title\":\"Intruder Lab\",\"experimentId\":\"ohms-law\"}";
        mockMvc.perform(post("/api/v1/teacher/classrooms/" + classId + "/assignments")
                        .cookie(teacher2Cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden());
    }

    @Test
    void testStudentCannotCreateAssignment() throws Exception {
        CreateClassroomRequest classReq = new CreateClassroomRequest();
        classReq.setName("Teacher Lab For Student Test");

        MvcResult classRes = mockMvc.perform(post("/api/v1/teacher/classrooms")
                        .cookie(teacherCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(classReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String classId = objectMapper.readTree(classRes.getResponse().getContentAsString()).get("id").asText();

        String payload = "{\"title\":\"Student Created Lab\",\"experimentId\":\"ohms-law\"}";
        mockMvc.perform(post("/api/v1/teacher/classrooms/" + classId + "/assignments")
                        .cookie(studentCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden());
    }
}
