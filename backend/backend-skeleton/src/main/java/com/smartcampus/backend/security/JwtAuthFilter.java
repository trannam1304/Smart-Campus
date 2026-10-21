package com.smartcampus.backend.security;

import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter kiểm tra JWT Token trong header Authorization cho mỗi request.
 * Nếu token hợp lệ: nạp UserDetailsImpl, set SecurityContext, cho phép request đi tiếp.
 * Nếu token không hợp lệ hoặc thiếu: bỏ qua (request không có authentication, SecurityConfig sẽ xử lý).
 * Liên quan: FR-1.2, FR-1.3, NFR-03.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtTokenProvider jwtTokenProvider, UserRepository userRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // Không có header Authorization hoặc không bắt đầu bằng "Bearer " → bỏ qua filter
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        // Token rỗng sau "Bearer "
        if (jwt.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (jwtTokenProvider.validateToken(jwt)) {
                userEmail = jwtTokenProvider.getUsernameFromToken(jwt);

                // Chỉ set authentication nếu SecurityContext chưa có authentication
                if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    User user = userRepository.findByEmail(userEmail)
                            .orElse(null);

                    if (user != null) {
                        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
                        if (jwtTokenProvider.validateToken(jwt, userDetails)) {
                            UsernamePasswordAuthenticationToken authToken =
                                    new UsernamePasswordAuthenticationToken(
                                            userDetails, null, userDetails.getAuthorities());
                            authToken.setDetails(
                                    new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authToken);
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Token lỗi (hết hạn, chữ ký sai, v.v.): không set authentication,
            // clear SecurityContext để tránh rò rỉ thông tin phiên cũ.
            logger.warn("JWT token không hợp lệ: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private static final org.slf4j.Logger logger =
            org.slf4j.LoggerFactory.getLogger(JwtAuthFilter.class);
}
