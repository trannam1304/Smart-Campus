package com.smartcampus.backend.config;

import com.smartcampus.backend.security.JwtAuthFilter;
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

                // Phân quyền endpoint
                .authorizeHttpRequests(auth -> auth
                        // Auth public
                        .requestMatchers("/api/auth/**").permitAll()
                        // Swagger / OpenAPI public
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**",
                                "/swagger-ui.html", "/webjars/**").permitAll()
                        // Admin only
                        .requestMatchers("/api/admin/**").hasRole("ADMIN_STAFF")
                        // Student & Admin
                        .requestMatchers("/api/student/**").hasAnyRole("STUDENT", "ADMIN_STAFF")
                        // Mọi request khác cần authentication
                        .anyRequest().authenticated()
                )

                // Thêm JWT filter vào trước UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
