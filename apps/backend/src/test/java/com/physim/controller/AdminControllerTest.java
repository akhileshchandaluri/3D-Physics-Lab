package com.physim.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.dto.*;
import com.physim.entity.UserRole;
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

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private Cookie adminCookie;
    private Cookie studentCookie;
    private String studentEmail;
    private String studentId;

    @BeforeEach
    void setUp() throws Exception {
        adminCookie = MfaLoginHelper.loginWithOptionalMfa(
                mockMvc, objectMapper, "admin@physim.edu", "AdminPassword123!");

        studentEmail = "student_admin_test_" + System.currentTimeMillis() + "@test.com";
        studentId = TestAccountHelper.createUser(
                mockMvc, objectMapper, adminCookie, "Bob Student", studentEmail, "StudentPass123!", UserRole.STUDENT);
        studentCookie = MfaLoginHelper.loginWithOptionalMfa(
                mockMvc, objectMapper, studentEmail, "StudentPass123!");
    }

    @Test
    void testAdminEndpointsAndRolePromotion() throws Exception {
        // 1. Student cannot access admin endpoints (403)
        mockMvc.perform(get("/api/v1/admin/stats")
                        .cookie(studentCookie))
                .andExpect(status().isForbidden());

        // 2. Admin can access platform stats
        mockMvc.perform(get("/api/v1/admin/stats")
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users.total").isNumber())
                .andExpect(jsonPath("$.experiments.totalSaved").isNumber());

        // 3. Admin can list users - add pagination to ensure we get recent users
        MvcResult usersRes = mockMvc.perform(get("/api/v1/admin/users")
                        .param("page", "1")
                        .param("size", "50")
                        .param("search", studentEmail)
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", not(empty())))
                .andReturn();

        // Find student ID specifically
        JsonNode root = objectMapper.readTree(usersRes.getResponse().getContentAsString());
        String targetUserId = null;
        for (JsonNode item : root.get("items")) {
            if (item.get("email").asText().equalsIgnoreCase(studentEmail)) {
                targetUserId = item.get("id").asText();
                break;
            }
        }
        if (targetUserId == null) {
            targetUserId = studentId;
        }
        assertNotNull(targetUserId, "Must find student user ID");

        // 4. Admin updates user role to TEACHER
        UpdateUserRoleRequest roleReq = new UpdateUserRoleRequest();
        roleReq.setRole(UserRole.TEACHER);

        mockMvc.perform(patch("/api/v1/admin/users/" + targetUserId + "/role")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("TEACHER"));

        // 5. Admin queries audit logs
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", not(empty())));

        // 6. Admin can delete the student account
        mockMvc.perform(delete("/api/v1/admin/users/" + targetUserId)
                        .cookie(adminCookie))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/admin/users")
                        .param("search", studentEmail)
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", empty()));
    }
}
