package com.chat;

import com.chat.auth.dto.AuthResponse;
import com.chat.auth.dto.LoginRequest;
import com.chat.auth.dto.RegisterRequest;
import com.chat.auth.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ChatApplicationTests {

    @Autowired
    private AuthService authService;

    @Test
    void contextLoads() {
    }

    @Test
    void testRegisterAndLoginFlow() {
        RegisterRequest registerReq = new RegisterRequest(
            "+1000000001",
            "alice@test.com",
            "alice_test",
            "securepassword123",
            "Alice In Wonderland"
        );

        AuthResponse regResponse = authService.register(registerReq);
        assertNotNull(regResponse);
        assertNotNull(regResponse.tokens().accessToken());
        assertEquals("alice_test", regResponse.user().username());

        LoginRequest loginReq = new LoginRequest("alice_test", "securepassword123");
        AuthResponse loginResponse = authService.login(loginReq);
        assertNotNull(loginResponse);
        assertNotNull(loginResponse.tokens().accessToken());
        assertEquals(regResponse.user().id(), loginResponse.user().id());
    }
}
