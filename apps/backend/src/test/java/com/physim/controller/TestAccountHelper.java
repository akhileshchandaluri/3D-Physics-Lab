package com.physim.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.dto.AdminCreateUserRequest;
import com.physim.entity.UserRole;
import jakarta.servlet.http.Cookie;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

final class TestAccountHelper {

    private TestAccountHelper() {
    }

    static String createUser(
            MockMvc mockMvc,
            ObjectMapper objectMapper,
            Cookie adminCookie,
            String name,
            String email,
            String password,
            UserRole role) throws Exception {
        AdminCreateUserRequest request = new AdminCreateUserRequest();
        request.setName(name);
        request.setEmail(email);
        request.setPassword(password);
        request.setRole(role);

        MvcResult result = mockMvc.perform(post("/api/v1/admin/users")
                        .cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        String id = body.path("id").asText(null);
        assertNotNull(id);
        return id;
    }

    static Cookie createStudentAndLogin(
            MockMvc mockMvc,
            ObjectMapper objectMapper,
            String name,
            String email,
            String password) throws Exception {
        Cookie adminCookie = MfaLoginHelper.loginWithOptionalMfa(
                mockMvc, objectMapper, "admin@physim.edu", "AdminPassword123!");
        createUser(mockMvc, objectMapper, adminCookie, name, email, password, UserRole.STUDENT);
        return MfaLoginHelper.loginWithOptionalMfa(mockMvc, objectMapper, email, password);
    }
}
