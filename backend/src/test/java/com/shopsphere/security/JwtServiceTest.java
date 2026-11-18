package com.shopsphere.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    private static final String SECRET = "pvVx3ADeAs6wQgZhSqFzcfpjTBc9x+qNIbOR9T1P2Pucw78PvUVbT0b43yeSUi16";
    private static final String OTHER_SECRET = "YS1jb21wbGV0ZWx5LWRpZmZlcmVudC1zZWNyZXQta2V5LTAxMjM0NTY3ODk=";

    @Test
    void tokenRoundTripReturnsSubject() {
        JwtService jwt = new JwtService(SECRET, 60_000);
        String token = jwt.generateToken("buyer@example.com");
        assertEquals("buyer@example.com", jwt.extractUsername(token));
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        String forged = new JwtService(OTHER_SECRET, 60_000).generateToken("buyer@example.com");
        JwtService jwt = new JwtService(SECRET, 60_000);
        assertThrows(JwtException.class, () -> jwt.extractUsername(forged));
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService jwt = new JwtService(SECRET, -1_000);
        String token = jwt.generateToken("buyer@example.com");
        assertThrows(JwtException.class, () -> jwt.extractUsername(token));
    }
}
