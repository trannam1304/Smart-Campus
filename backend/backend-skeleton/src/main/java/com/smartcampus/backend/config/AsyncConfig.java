package com.smartcampus.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Cấu hình xử lý bất đồng bộ (@Async) cho hệ thống gửi Email và Notification.
 * Nghiệp vụ liên quan: FR-6.1, FR-6.2, FR-6.3, NFR-01 (Hiệu năng & Không nghẽn Main Thread)
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "mailTaskExecutor")
    public Executor mailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("MailAsync-");
        executor.initialize();
        return executor;
    }
}

