package com.smartcampus.backend.config;

import com.smartcampus.backend.security.JwtAuthFilter;
import org.springframework.http.HttpMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import com.smartcampus.backend.security.CustomUserDetailsService;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * Cấu hình bảo mật chung: JWT stateless, mã hoá mật khẩu, phân quyền theo Role.
 * Liên quan: FR-1.2, FR-1.3, NFR-03.
 *
 * <p>Quy tắc phân quyền:
 * <ul>
 *   <li>/api/auth/** → cho phép tất cả (không cần đăng nhập)</li>
 *   <li>/v3/api-docs/**, /swagger-ui/**, /swagger-ui.html → cho phép tất cả</li>
 *   <li>Các endpoint khác → yêu cầu authentication</li>
 *   <li>/api/admin/** → chỉ ADMIN_STAFF</li>
 *   <li>/api/student/** → STUDENT và ADMIN_STAFF</li>
 * </ul>
 *
 * <p>Session: STATELESS (không tạo HttpSession, dùng JWT).
 * CSRF: tắt (API stateless).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            CustomUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(authProvider);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Tắt CSRF (API stateless, dùng JWT)
                .csrf(csrf -> csrf.disable())

                // CORS đơn giản: cho phép tất cả origin trong dev
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration cfg = new CorsConfiguration();
                    cfg.setAllowedOriginPatterns(List.of("*"));
                    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                    cfg.setAllowedHeaders(List.of("*"));
                    cfg.setAllowCredentials(true);
                    return cfg;
                }))

                // Session stateless: không tạo HttpSession
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Xử lý lỗi xác thực và phân quyền (401 cho chưa xác thực, 403 cho không đủ quyền)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"success\":false,\"code\":401,\"message\":\"Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.\",\"status\":401}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"success\":false,\"code\":403,\"message\":\"Bạn không có quyền thực hiện thao tác này.\",\"status\":403}");
                        })
                )

                // Phân quyền endpoint
                .authorizeHttpRequests(auth -> auth
                        // Cho phép truy cập OPTIONS (CORS preflight)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Auth public
                        .requestMatchers("/api/auth/**").permitAll()
                        // Tra cứu phòng, tòa nhà, sơ đồ tầng (Public Read)
                        .requestMatchers(HttpMethod.GET,
                                "/api/rooms", "/api/rooms/**",
                                "/api/v1/rooms", "/api/v1/rooms/**",
                                "/api/buildings", "/api/buildings/**",
                                "/api/v1/buildings", "/api/v1/buildings/**",
                                "/api/floors/**", "/api/v1/floors/**").permitAll()
                        // Swagger / OpenAPI public
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**",
                                "/swagger-ui.html", "/webjars/**").permitAll()
                        // Booking: Sinh viên & Admin
                        .requestMatchers("/api/bookings", "/api/bookings/**",
                                "/api/v1/bookings", "/api/v1/bookings/**").hasAnyRole("STUDENT", "ADMIN", "STAFF", "ADMIN_STAFF")
                        // Admin only
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "STAFF", "ADMIN_STAFF")
                        // Student & Admin
                        .requestMatchers("/api/student/**").hasAnyRole("STUDENT", "ADMIN", "STAFF", "ADMIN_STAFF")
                        // Mọi request khác cần authentication
                        .anyRequest().authenticated()
                )

                // Thêm JWT filter vào trước UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
