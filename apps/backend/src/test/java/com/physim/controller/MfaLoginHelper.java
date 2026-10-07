package com.physim.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.dto.LoginRequest;
import com.physim.service.MfaService;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.time.SystemTimeProvider;
import jakarta.servlet.http.Cookie;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

final class MfaLoginHelper {

    private static final CodeGenerator CODE_GENERATOR = new DefaultCodeGenerator(HashingAlgorithm.SHA1);
    private static final SystemTimeProvider TIME_PROVIDER = new SystemTimeProvider();

    private MfaLoginHelper() {
    }

    static String currentTotpCode(String secret) throws Exception {
        long counter = Math.floorDiv(TIME_PROVIDER.getTime(), 30);
        return CODE_GENERATOR.generate(secret, counter);
    }

    static Cookie loginWithOptionalMfa(MockMvc mockMvc, ObjectMapper objectMapper, String email, String password)
            throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword(password);

        MvcResult loginRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(loginRes.getResponse().getContentAsString());
        if (!body.path("mfaRequired").asBoolean(false)) {
            Cookie session = loginRes.getResponse().getCookie("physim_session");
            assertNotNull(session);
            return session;
        }

        assertNull(loginRes.getResponse().getCookie("physim_session"));
        String challengeToken = body.path("mfaChallengeToken").asText();
        assertTrue(challengeToken != null && !challengeToken.isBlank());

        boolean setupRequired = body.path("mfaSetupRequired").asBoolean(false);
        boolean totpEnabled = body.path("totpEnabled").asBoolean(false);
        String secret = MfaService.DEMO_TOTP_SECRET;
        String endpoint = "/api/v1/auth/mfa/totp/verify";

        if (setupRequired || !totpEnabled) {
            MvcResult setupRes = mockMvc.perform(post("/api/v1/auth/mfa/totp/setup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of("challengeToken", challengeToken))))
                    .andExpect(status().isOk())
                    .andReturn();
            secret = objectMapper.readTree(setupRes.getResponse().getContentAsString()).path("secret").asText();
            endpoint = "/api/v1/auth/mfa/totp/confirm";
        }

        MvcResult mfaRes = mockMvc.perform(post(endpoint)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "challengeToken", challengeToken,
                                "code", currentTotpCode(secret)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        Cookie session = mfaRes.getResponse().getCookie("physim_session");
        assertNotNull(session);
        return session;
    }
}
