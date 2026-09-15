package com.physim.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.dto.CreateSavedExperimentRequest;
import com.physim.dto.SignupRequest;
import com.physim.dto.UpdateSavedExperimentRequest;
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
class ExperimentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private Cookie user1Cookie;
    private Cookie user2Cookie;

    @BeforeEach
    void setUp() throws Exception {
        user1Cookie = createAndLoginUser("exp_user1_" + System.currentTimeMillis() + "@test.com");
        user2Cookie = createAndLoginUser("exp_user2_" + System.currentTimeMillis() + "@test.com");
    }

    private Cookie createAndLoginUser(String email) throws Exception {
        SignupRequest request = new SignupRequest();
        request.setEmail(email);
        request.setPassword("Password123!");
        request.setName("Test User");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        return result.getResponse().getCookie("physim_session");
    }

    @Test
    void testSaveExperimentLifecycle() throws Exception {
        CreateSavedExperimentRequest createReq = new CreateSavedExperimentRequest();
        createReq.setExperimentId("ohms-law");
        createReq.setTitle("Ohm's Law Trial 1");
        createReq.setNotes("Testing resistor 50 ohms");
        createReq.setStateData(Map.of("voltage", 5.0, "resistance", 50.0, "temperature", 25.0));

        // 1. Create
        MvcResult createResult = mockMvc.perform(post("/api/v1/experiments")
                        .cookie(user1Cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.experimentId").value("ohms-law"))
                .andExpect(jsonPath("$.title").value("Ohm's Law Trial 1"))
                .andExpect(jsonPath("$.stateData.voltage").value(5.0))
                .andReturn();

        String idStr = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asText();

        // 2. Retrieve
        mockMvc.perform(get("/api/v1/experiments/" + idStr)
                        .cookie(user1Cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(idStr))
                .andExpect(jsonPath("$.title").value("Ohm's Law Trial 1"));

        // 3. User 2 cannot retrieve User 1's private experiment (403 Forbidden)
        mockMvc.perform(get("/api/v1/experiments/" + idStr)
                        .cookie(user2Cookie))
                .andExpect(status().isForbidden());

        // 4. Update
        UpdateSavedExperimentRequest updateReq = new UpdateSavedExperimentRequest();
        updateReq.setTitle("Ohm's Law Updated Trial");
        updateReq.setStateData(Map.of("voltage", 10.0, "resistance", 50.0, "temperature", 30.0));

        mockMvc.perform(patch("/api/v1/experiments/" + idStr)
                        .cookie(user1Cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Ohm's Law Updated Trial"))
                .andExpect(jsonPath("$.stateData.voltage").value(10.0));

        // 5. Delete (Soft delete)
        mockMvc.perform(delete("/api/v1/experiments/" + idStr)
                        .cookie(user1Cookie))
                .andExpect(status().isNoContent());

        // 6. Subsequent retrieval is 404
        mockMvc.perform(get("/api/v1/experiments/" + idStr)
                        .cookie(user1Cookie))
                .andExpect(status().isNotFound());
    }

    @Test
    void testInvalidExperimentIdRejected() throws Exception {
        CreateSavedExperimentRequest createReq = new CreateSavedExperimentRequest();
        createReq.setExperimentId("invalid-unknown-experiment");
        createReq.setTitle("Invalid Exp");
        createReq.setStateData(Map.of("foo", "bar"));

        mockMvc.perform(post("/api/v1/experiments")
                        .cookie(user1Cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.error.message").value(containsString("Invalid experiment ID")));
    }

    @Test
    void testStateDataPayloadLimit() throws Exception {
        CreateSavedExperimentRequest createReq = new CreateSavedExperimentRequest();
        createReq.setExperimentId("ohms-law");
        createReq.setTitle("Huge Data Exp");
        // Create > 64KB string payload
        String hugeString = "x".repeat(70000);
        createReq.setStateData(Map.of("hugeKey", hugeString));

        mockMvc.perform(post("/api/v1/experiments")
                        .cookie(user1Cookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.error.code").value("PAYLOAD_TOO_LARGE"));
    }
}
