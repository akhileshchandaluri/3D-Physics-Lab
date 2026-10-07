package com.physim.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.dto.CreateSavedExperimentRequest;
import com.physim.dto.CreateShareRequest;
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

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ShareControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private Cookie userCookie;
    private String experimentId;

    @BeforeEach
    void setUp() throws Exception {
        userCookie = TestAccountHelper.createStudentAndLogin(
                mockMvc,
                objectMapper,
                "Share Author",
                "share_user_" + System.currentTimeMillis() + "@test.com",
                "Password123!");

        CreateSavedExperimentRequest expReq = new CreateSavedExperimentRequest();
        expReq.setExperimentId("ohms-law");
        expReq.setTitle("Shared Experiment Trial");
        expReq.setStateData(Map.of("voltage", 12.0, "resistance", 100.0, "temperature", 25.0));

        MvcResult expResult = mockMvc.perform(post("/api/v1/experiments")
                        .cookie(userCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(expReq)))
                .andExpect(status().isCreated())
                .andReturn();

        experimentId = objectMapper.readTree(expResult.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void testShareLifecycleAndPublicAccess() throws Exception {
        CreateShareRequest shareReq = new CreateShareRequest();
        shareReq.setExpiresInDays(30);

        // 1. Create share link
        MvcResult shareResult = mockMvc.perform(post("/api/v1/experiments/" + experimentId + "/share")
                        .cookie(userCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shareReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shareToken").isNotEmpty())
                .andExpect(jsonPath("$.shareId").isNotEmpty())
                .andReturn();

        String rawToken = objectMapper.readTree(shareResult.getResponse().getContentAsString()).get("shareToken").asText();
        String shareId = objectMapper.readTree(shareResult.getResponse().getContentAsString()).get("shareId").asText();

        // 2. Access shared experiment publicly without auth
        mockMvc.perform(get("/api/v1/share/" + rawToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.experimentId").value("ohms-law"))
                .andExpect(jsonPath("$.title").value("Shared Experiment Trial"))
                .andExpect(jsonPath("$.stateData.voltage").value(12.0))
                .andExpect(jsonPath("$.authorName").value("Share Author"))
                .andExpect(jsonPath("$.authorEmail").doesNotExist()); // Private email must not leak

        // 3. Revoke share link
        mockMvc.perform(delete("/api/v1/share/" + shareId)
                        .cookie(userCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Share link revoked successfully."));

        // 4. Accessing revoked share returns 404 (consistent not-found behavior)
        mockMvc.perform(get("/api/v1/share/" + rawToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));

        // 5. Non-existent token returns 404
        mockMvc.perform(get("/api/v1/share/nonexistenttoken1234567890"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }
}
