package com.physim.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.dto.LoginRequest;
import com.physim.dto.SignupRequest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

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
    void testSignupLoginAndSessionRestoreFlow() throws Exception {
        String uniqueEmail = "student_" + System.currentTimeMillis() + "@example.com";
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setEmail(uniqueEmail);
        signupRequest.setPassword("SecretPass123!");
        signupRequest.setName("John Student");

        // 1. Signup
        MvcResult signupResult = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.email").value(uniqueEmail))
                .andExpect(jsonPath("$.user.role").value("STUDENT"))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(cookie().exists("physim_session"))
                .andReturn();

        Cookie sessionCookie = signupResult.getResponse().getCookie("physim_session");
        assertNotNull(sessionCookie);

        // 2. Get current user profile with session cookie
        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(uniqueEmail))
                .andExpect(jsonPath("$.user.name").value("John Student"))
                .andExpect(jsonPath("$.user.role").value("STUDENT"));

        // 3. Login with credentials
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

        Cookie newCookie = loginResult.getResponse().getCookie("physim_session");

        // 4. Logout
        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(newCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully."));

        // 5. Subsequent access with old session cookie should be 401
        mockMvc.perform(get("/api/v1/auth/me")
                        .cookie(newCookie))
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
    void testDuplicateSignupReturnsConflict() throws Exception {
        String email = "duplicate_" + System.currentTimeMillis() + "@example.com";
        SignupRequest request = new SignupRequest();
        request.setEmail(email);
        request.setPassword("Password123!");
        request.setName("Duplicate User");

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("CONFLICT"))
                .andExpect(jsonPath("$.error.message").value("An account with this email already exists. Log in or use another email."));
    }

    @Test
    void testPasswordShorterThan8CharsValidation() throws Exception {
        SignupRequest request = new SignupRequest();
        request.setName("Test User");
        request.setEmail("validuser@example.com");
        request.setPassword("short");

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.details.password").value("Password must be at least 8 characters."));
    }

    @Test
    void testInvalidEmailValidation() throws Exception {
        SignupRequest request = new SignupRequest();
        request.setName("Test User");
        request.setEmail("notanemail");
        request.setPassword("ValidPassword123!");

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.details.email").value("Enter a valid email address."));
    }

    @Test
    void testMissingRequiredFieldsValidation() throws Exception {
        SignupRequest request = new SignupRequest();

        mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.details.name").value("Full name is required"))
                .andExpect(jsonPath("$.error.details.email").value("Email is required"))
                .andExpect(jsonPath("$.error.details.password").value("Password is required"));
    }
}
