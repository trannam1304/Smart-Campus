package com.smartcampus.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Cấu hình bảo mật chung: JWT stateless, mã hoá mật khẩu.
 * Liên quan: FR-1.2, FR-1.3, NFR-03
 * TODO (Security/Backend lead): gắn JwtAuthFilter, cấu hình phân quyền theo Role (STUDENT/ADMIN_STAFF).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // TODO: cấu hình chi tiết: csrf().disable(), sessionManagement STATELESS,
        // permitAll cho /api/auth/**, addFilterBefore(jwtAuthFilter, ...)
        return http.build();
    }
}
