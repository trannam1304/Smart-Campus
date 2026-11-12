package com.smartcampus.backend.security;

import com.smartcampus.backend.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

/**
 * Sinh và xác thực JWT Token. Liên quan: FR-1.2, FR-1.3, NFR-03.
 *
 * <p>Token chứa claims:
 * <ul>
 *   <li>subject (sub): email của người dùng</li>
 *   <li>role: vai trò (STUDENT / ADMIN_STAFF)</li>
 *   <li>iat: thời điểm phát hành</li>
 *   <li>exp: thời điểm hết hạn (mặc định 24h từ application.yml)</li>
 * </ul>
 *
 * <p>Sử dụng thư viện io.jsonwebtoken (jjwt) phiên bản 0.12.6.
 */
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:c21hcnQtY2FtcHVzLXNlY3JldC1rZXktZm9yLWp3dC1hdXRoZW50aWNhdGlvbi0yMDI2}") String secret,
            @Value("${app.jwt.access-token-expiration-ms:${app.jwt.expiration-ms:900000}}") long accessTokenExpirationMs,
            @Value("${app.jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs) {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (Exception e) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public long getAccessTokenExpirationMs() {
        return accessTokenExpirationMs;
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    /**
     * Sinh JWT token từ Authentication đã xác thực (Access Token).
     */
    public String generateToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        String role = authentication.getAuthorities().stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse("ROLE_STUDENT");

        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpirationMs);

        var builder = Jwts.builder()
                .subject(userPrincipal.getUsername())
                .claim("role", role)
                .claim("fullName", userPrincipal.getFullName())
                .claim("userId", userPrincipal.getId())
                .issuedAt(now)
                .expiration(expiry);

        if (userPrincipal.getStudentCode() != null) {
            builder.claim("studentCode", userPrincipal.getStudentCode());
        }

        return builder
                .signWith(key, io.jsonwebtoken.SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Sinh JWT token trực tiếp từ đối tượng User (Access Token).
     */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpirationMs);

        var builder = Jwts.builder()
                .subject(user.getEmail())
                .claim("role", "ROLE_" + user.getRole().name())
                .claim("fullName", user.getFullName())
                .claim("userId", user.getId())
                .issuedAt(now)
                .expiration(expiry);

        if (user.getStudentCode() != null) {
            builder.claim("studentCode", user.getStudentCode());
        }

        return builder
                .signWith(key, io.jsonwebtoken.SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Lấy email (subject) từ token.
     */
    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    /**
     * Lấy vai trò từ token.
     */
    public String getRoleFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.get("role", String.class);
    }

    /**
     * Kiểm tra token có hợp lệ (chữ ký đúng, chưa hết hạn) và khớp với userDetails.
     */
    public boolean validateToken(String token, UserDetailsImpl userDetails) {
        final String username = getUsernameFromToken(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    /**
     * Kiểm tra token có hợp lệ (chữ ký đúng, chưa hết hạn) mà không cần userDetails.
     */
    public boolean validateToken(String token) {
        try {
            getAllClaimsFromToken(token);
            return !isTokenExpired(token);
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean isTokenExpired(String token) {
        final Date expiration = getClaimFromToken(token, Claims::getExpiration);
        return expiration.before(new Date());
    }
}
