package com.physim.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.physim.dto.*;
import com.physim.entity.UserEntity;
import com.physim.entity.UserRole;
import com.physim.repository.UserRepository;
import com.physim.service.GoogleOAuthClient;
import com.physim.service.GoogleTokenVerifier;
import com.physim.service.OAuthStateStore;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GoogleOAuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OAuthStateStore stateStore;

    @MockBean
    private GoogleOAuthClient googleOAuthClient;

    @MockBean
    private GoogleTokenVerifier googleTokenVerifier;

    @BeforeEach
    void setUp() {
        // default mock responses
        when(googleOAuthClient.exchangeCode(anyString(), any(), anyString()))
                .thenReturn(new GoogleTokenResponse("mock-id-token", "mock-access-token", "Bearer", 3600L));
    }

    @Test
    void testGetAuthorizationUrl() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/auth/oauth/google/authorize"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authUrl").isNotEmpty())
                .andExpect(jsonPath("$.state").isNotEmpty())
                .andReturn();

        String responseStr = result.getResponse().getContentAsString();
        GoogleAuthUrlResponse authResponse = objectMapper.readValue(responseStr, GoogleAuthUrlResponse.class);

        assertTrue(authResponse.authUrl().contains("accounts.google.com"));
        assertTrue(authResponse.authUrl().contains("client_id="));
        assertTrue(authResponse.authUrl().contains("code_challenge="));
        assertTrue(authResponse.authUrl().contains("code_challenge_method=S256"));
        assertTrue(authResponse.authUrl().contains("state=" + authResponse.state()));
    }

    @Test
    void testGetAuthorizationUrlWithInvalidRedirectUriRejected() throws Exception {
        mockMvc.perform(get("/api/v1/auth/oauth/google/authorize")
                        .param("redirectUri", "https://evil-site.com/callback"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCallbackWithInvalidStateRejected() throws Exception {
        GoogleOAuthCallbackRequest request = new GoogleOAuthCallbackRequest("valid-code", "non-existent-state", null);

        mockMvc.perform(post("/api/v1/auth/oauth/google/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUnknownGoogleUserIsRejected() throws Exception {
        MvcResult authResult = mockMvc.perform(get("/api/v1/auth/oauth/google/authorize"))
                .andExpect(status().isOk())
                .andReturn();
        GoogleAuthUrlResponse authResponse = objectMapper.readValue(
                authResult.getResponse().getContentAsString(),
                GoogleAuthUrlResponse.class
        );

        String googleSub = "g-sub-" + System.currentTimeMillis();
        String googleEmail = "newgoogleuser_" + System.currentTimeMillis() + "@gmail.com";

        when(googleTokenVerifier.verifyToken(eq("mock-id-token"), any()))
                .thenReturn(new GoogleIdTokenClaims(googleSub, googleEmail, true, "Google Explorer", "https://photo.url"));

        GoogleOAuthCallbackRequest callbackRequest = new GoogleOAuthCallbackRequest("auth-code-123", authResponse.state(), null);

        mockMvc.perform(post("/api/v1/auth/oauth/google/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(callbackRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));

        assertTrue(userRepository.findByEmail(googleEmail).isEmpty());
    }

    @Test
    void testReturningGoogleUserLogin() throws Exception {
        String googleSub = "g-returning-" + System.currentTimeMillis();
        String googleEmail = "returning_" + System.currentTimeMillis() + "@gmail.com";

        UserEntity user = new UserEntity();
        user.setEmail(googleEmail);
        user.setName("Returning User");
        user.setAuthProvider("GOOGLE");
        user.setProviderId(googleSub);
        user.setRole(UserRole.STUDENT);
        user.setActive(true);
        userRepository.save(user);

        MvcResult authResult = mockMvc.perform(get("/api/v1/auth/oauth/google/authorize"))
                .andExpect(status().isOk())
                .andReturn();
        GoogleAuthUrlResponse authResponse = objectMapper.readValue(
                authResult.getResponse().getContentAsString(),
                GoogleAuthUrlResponse.class
        );

        when(googleTokenVerifier.verifyToken(eq("mock-id-token"), any()))
                .thenReturn(new GoogleIdTokenClaims(googleSub, googleEmail, true, "Returning User", null));

        GoogleOAuthCallbackRequest callbackRequest = new GoogleOAuthCallbackRequest("code-abc", authResponse.state(), null);

        mockMvc.perform(post("/api/v1/auth/oauth/google/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(callbackRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(googleEmail))
                .andExpect(cookie().exists("physim_session"));
    }

    @Test
    void testAccountLinkingRequiredWhenEmailAlreadyExistsLocally() throws Exception {
        String localEmail = "existing_local_" + System.currentTimeMillis() + "@example.com";

        // Create an existing local password account
        UserEntity localUser = new UserEntity();
        localUser.setEmail(localEmail);
        localUser.setName("Local Account Owner");
        localUser.setPasswordHash(passwordEncoder.encode("LocalSecret123!"));
        localUser.setAuthProvider("LOCAL");
        localUser.setRole(UserRole.TEACHER); // Notice TEACHER role
        localUser.setActive(true);
        userRepository.save(localUser);

        MvcResult authResult = mockMvc.perform(get("/api/v1/auth/oauth/google/authorize"))
                .andExpect(status().isOk())
                .andReturn();
        GoogleAuthUrlResponse authResponse = objectMapper.readValue(
                authResult.getResponse().getContentAsString(),
                GoogleAuthUrlResponse.class
        );

        String newGoogleSub = "g-new-sub-" + System.currentTimeMillis();
        when(googleTokenVerifier.verifyToken(eq("mock-id-token"), any()))
                .thenReturn(new GoogleIdTokenClaims(newGoogleSub, localEmail, true, "Google Name", null));

        GoogleOAuthCallbackRequest callbackRequest = new GoogleOAuthCallbackRequest("code-456", authResponse.state(), null);

        // Expect 409 Conflict with ACCOUNT_LINKING_REQUIRED
        MvcResult conflictResult = mockMvc.perform(post("/api/v1/auth/oauth/google/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(callbackRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("ACCOUNT_LINKING_REQUIRED"))
                .andExpect(jsonPath("$.email").value(localEmail))
                .andExpect(jsonPath("$.linkToken").isNotEmpty())
                .andReturn();

        String linkToken = objectMapper.readTree(conflictResult.getResponse().getContentAsString()).get("linkToken").asText();

        // 1. Attempt linking with WRONG password -> 401 Unauthorized
        GoogleOAuthLinkRequest badLinkRequest = new GoogleOAuthLinkRequest(linkToken, "WrongPassword!");
        mockMvc.perform(post("/api/v1/auth/oauth/google/link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLinkRequest)))
                .andExpect(status().isUnauthorized());

        // 2. Re-create link token since bad attempt consumed it or let's save a new one to test success
        stateStore.saveLinkToken(linkToken, localEmail, newGoogleSub, 10);

        // 3. Attempt linking with CORRECT password -> 200 OK
        GoogleOAuthLinkRequest goodLinkRequest = new GoogleOAuthLinkRequest(linkToken, "LocalSecret123!");
        MvcResult linkSuccessResult = mockMvc.perform(post("/api/v1/auth/oauth/google/link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goodLinkRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(localEmail))
                .andExpect(jsonPath("$.user.role").value("TEACHER")) // Preserves existing role
                .andExpect(cookie().exists("physim_session"))
                .andReturn();

        // Verify account in database now has provider Google & providerId set
        UserEntity linkedUser = userRepository.findByEmail(localEmail).orElseThrow();
        assertEquals("GOOGLE", linkedUser.getAuthProvider());
        assertEquals(newGoogleSub, linkedUser.getProviderId());
    }

    @Test
    void testDeactivatedUserCannotSignInWithGoogle() throws Exception {
        String deactivatedEmail = "deactivated_" + System.currentTimeMillis() + "@gmail.com";
        String googleSub = "sub-deact-" + System.currentTimeMillis();

        UserEntity user = new UserEntity();
        user.setEmail(deactivatedEmail);
        user.setName("Inactive User");
        user.setAuthProvider("GOOGLE");
        user.setProviderId(googleSub);
        user.setRole(UserRole.STUDENT);
        user.setActive(false); // Inactive
        userRepository.save(user);

        MvcResult authResult = mockMvc.perform(get("/api/v1/auth/oauth/google/authorize"))
                .andExpect(status().isOk())
                .andReturn();
        GoogleAuthUrlResponse authResponse = objectMapper.readValue(
                authResult.getResponse().getContentAsString(),
                GoogleAuthUrlResponse.class
        );

        when(googleTokenVerifier.verifyToken(eq("mock-id-token"), any()))
                .thenReturn(new GoogleIdTokenClaims(googleSub, deactivatedEmail, true, "Inactive User", null));

        GoogleOAuthCallbackRequest callbackRequest = new GoogleOAuthCallbackRequest("code-789", authResponse.state(), null);

        mockMvc.perform(post("/api/v1/auth/oauth/google/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(callbackRequest)))
                .andExpect(status().isForbidden());
    }
}
