package com.smartcampus.backend.service;

import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.repository.NotificationRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.impl.EmailServiceImpl;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EmailServiceImpl emailService;

    private MimeMessage mimeMessage;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "mailFrom", "test@smartcampus.edu.vn");
        ReflectionTestUtils.setField(emailService, "senderName", "Smart Campus Test");
        ReflectionTestUtils.setField(emailService, "mailEnabled", true);

        mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        lenient().when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    @Test
    void sendBookingConfirmationEmailSendsMimeMessageWithAttachment() {
        User user = new User();
        user.setEmail("student@smartcampus.edu.vn");
        when(userRepository.findByEmail("student@smartcampus.edu.vn")).thenReturn(Optional.of(user));

        byte[] qrBytes = new byte[]{1, 2, 3, 4};
        emailService.sendBookingConfirmationEmail(
                "student@smartcampus.edu.vn",
                "Nguyễn Văn A",
                101L,
                "A3.01",
                LocalDateTime.now().plusHours(1),
                LocalDateTime.now().plusHours(3),
                4,
                "Học nhóm",
                qrBytes,
                "BK-20261105-0101_SEC_TEST"
        );

        verify(mailSender, times(1)).send(any(MimeMessage.class));
        verify(notificationRepository, times(1)).save(any());
    }

    @Test
    void sendBookingReminderEmailSendsMimeMessage() {
        emailService.sendBookingReminderEmail(
                "student@smartcampus.edu.vn",
                "Nguyễn Văn A",
                101L,
                "A3.01",
                LocalDateTime.now().plusMinutes(15),
                LocalDateTime.now().plusMinutes(135),
                null
        );

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void sendAutoCancelEmailSendsWarningMimeMessage() {
        emailService.sendAutoCancelEmail(
                "student@smartcampus.edu.vn",
                "Nguyễn Văn A",
                101L,
                "A3.01",
                LocalDateTime.now().minusMinutes(20),
                15,
                1,
                false
        );

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void sendEmailHandlesMailExceptionGracefully() {
        doThrow(new MailSendException("SMTP server connection refused"))
                .when(mailSender).send(any(MimeMessage.class));

        assertDoesNotThrow(() -> {
            emailService.sendBookingReminderEmail(
                    "student@smartcampus.edu.vn",
                    "Nguyễn Văn A",
                    101L,
                    "A3.01",
                    LocalDateTime.now().plusMinutes(15),
                    LocalDateTime.now().plusMinutes(135),
                    null
            );
        });
    }
}

