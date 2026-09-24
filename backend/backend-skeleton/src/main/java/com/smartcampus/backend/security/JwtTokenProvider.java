package com.smartcampus.backend.security;

import io.jsonwebtoken.*; 
import io.jsonwebtoken.security.Keys; 
import org.springframework.beans.factory.annotation.Value; 
import org.springframework.security.core.Authentication; 
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
/**
 * Sinh và xác thực JWT Token. Liên quan: FR-1.2, FR-1.3, NFR-03.
 * TODO (Security lead): implement generateToken(), validateToken(), getUsernameFromToken()
 * dùng thư viện io.jsonwebtoken (đã khai báo trong pom.xml).
 */
@Component
public class JwtTokenProvider {
    @Value("${app.jwtSecret:SmartCampusSecretKeyForJWTTokenGeneration2026123456789}") 
    private String jwtSecret;

    @Value("${app.jwtExpirationMs:1800000}") // 30 phút
    private int jwtExpirationMs;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }
    
    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) getSigningKey())
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // Log the exception or handle it as needed
            return false;
        }
    }

    public long getJwtExpirationMs() {
        return jwtExpirationMs/1000; // return in seconds
    }
}
