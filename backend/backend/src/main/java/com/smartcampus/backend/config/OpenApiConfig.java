package com.smartcampus.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Cấu hình Swagger/OpenAPI để các nhóm tự test API khi phát triển song song
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI smartCampusOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("Smart Campus Facility & Study Room Reservation API")
                .description("API cho hệ thống đặt phòng tự học - chuẩn ISO/IEC/IEEE 29148")
                .version("v0.0.1"));
    }
}
