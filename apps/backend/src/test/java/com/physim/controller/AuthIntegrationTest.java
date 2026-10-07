package com.physim.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.dto.AdminCreateUserRequest;
import com.physim.dto.LoginRequest;
import com.physim.entity.UserRole;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void publicSignupIsDisabled() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Anyone","email":"anyone@example.com","password":"Password123!"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCreatedUserCanLoginAndLogout() throws Exception {
        String uniqueEmail = "student_" + System.currentTimeMillis() + "@example.com";
        Cookie adminCookie = MfaLoginHelper.loginWithOptionalMfa(
                mockMvc, objectMapper, "admin@physim.edu", "AdminPassword123!");

        AdminCreateUserRequest createRequest = new AdminCreateUserRequest();
        createRequest.setEmail(uniqueEmail);
        createRequest.setPassword("SecretPass123!");
        createRequest.setName("John Student");
        createRequest.setRole(UserRole.STUDENT);

        mockMvc.perform(post("/api/v1/admin/users")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(uniqueEmail))
                .andExpect(jsonPath("$.role").value("STUDENT"));

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(uniqueEmail);
        loginRequest.setPassword("SecretPass123!");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(uniqueEmail))
                .andExpect(cookie().exists("physim_session"))
                .andReturn();

        Cookie sessionCookie = loginResult.getResponse().getCookie("physim_session");
        assertNotNull(sessionCookie);

        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(uniqueEmail))
                .andExpect(jsonPath("$.user.name").value("John Student"))
                .andExpect(jsonPath("$.user.role").value("STUDENT"));

        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully."));

        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(sessionCookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testInvalidLoginCredentials() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("nonexistent@example.com");
        loginRequest.setPassword("WrongPassword123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.error.message").value("Email or password is incorrect."));
    }

    @Test
    void duplicateAdminCreateReturnsConflict() throws Exception {
        Cookie adminCookie = MfaLoginHelper.loginWithOptionalMfa(
                mockMvc, objectMapper, "admin@physim.edu", "AdminPassword123!");
        String email = "duplicate_" + System.currentTimeMillis() + "@example.com";

        AdminCreateUserRequest request = new AdminCreateUserRequest();
        request.setEmail(email);
        request.setPassword("Password123!");
        request.setName("Duplicate User");
        request.setRole(UserRole.STUDENT);

        mockMvc.perform(post("/api/v1/admin/users")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/admin/users")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }

    @Test
    void adminCreateUserValidation() throws Exception {
        Cookie adminCookie = MfaLoginHelper.loginWithOptionalMfa(
                mockMvc, objectMapper, "admin@physim.edu", "AdminPassword123!");

        mockMvc.perform(post("/api/v1/admin/users")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Test User",
                                "email", "validuser@example.com",
                                "password", "short",
                                "role", "STUDENT"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.details.password").value("Password must be at least 8 characters."));

        mockMvc.perform(post("/api/v1/admin/users")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Test User",
                                "email", "notanemail",
                                "password", "ValidPassword123!",
                                "role", "STUDENT"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.details.email").value("Enter a valid email address."));
    }

    @Test
    void newTeacherLoginRequiresMfaSetupAndSkipOpensSession() throws Exception {
        Cookie adminCookie = MfaLoginHelper.loginWithOptionalMfa(
                mockMvc, objectMapper, "admin@physim.edu", "AdminPassword123!");

        String teacherEmail = "teacher_setup_" + System.currentTimeMillis() + "@physim.edu";
        String teacherPassword = "TeacherSetup123!";
        AdminCreateUserRequest createRequest = new AdminCreateUserRequest();
        createRequest.setName("New Teacher");
        createRequest.setEmail(teacherEmail);
        createRequest.setPassword(teacherPassword);
        createRequest.setRole(UserRole.TEACHER);

        mockMvc.perform(post("/api/v1/admin/users")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("TEACHER"));

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(teacherEmail);
        loginRequest.setPassword(teacherPassword);

        MvcResult loginRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mfaRequired").value(true))
                .andExpect(jsonPath("$.mfaSetupRequired").value(true))
                .andExpect(jsonPath("$.totpEnabled").value(false))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andReturn();

        org.junit.jupiter.api.Assertions.assertNull(loginRes.getResponse().getCookie("physim_session"));
        String challengeToken = objectMapper.readTree(loginRes.getResponse().getContentAsString())
                .path("mfaChallengeToken").asText();
        assertNotNull(challengeToken);

        MvcResult skipRes = mockMvc.perform(post("/api/v1/auth/mfa/skip")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("challengeToken", challengeToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(cookie().exists("physim_session"))
                .andReturn();

        Cookie session = skipRes.getResponse().getCookie("physim_session");
        assertNotNull(session);

        mockMvc.perform(get("/api/v1/auth/me").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(teacherEmail))
                .andExpect(jsonPath("$.user.role").value("TEACHER"));
    }
}
