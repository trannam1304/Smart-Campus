package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.dto.request.ChangePasswordRequest;
import com.smartcampus.backend.dto.request.LoginRequest;
import com.smartcampus.backend.dto.request.RegisterRequest;
import com.smartcampus.backend.dto.response.AuthResponse;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.security.JwtTokenProvider;
import com.smartcampus.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Triển khai nghiệp vụ nhóm Auth. Liên quan: FR-1.1, FR-1.2, FR-1.3, FR-1.4
 * TODO: implement theo Normal Flow / Exception Flow trong SRS.
 */
@Service
public class AuthServiceImpl implements AuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Override
    public void register(RegisterRequest request){
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }
        if (userRepository.existsByStudentCode(request.getStudentCode())) {
            throw new IllegalArgumentException("Mã số sinh viên đã tồn tại");
        }

        User user = new User();
        user.setStudentCode(request.getStudentCode());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFaculty(request.getFaculty());
        user.setRole(User.Role.STUDENT);
        user.setStatus(User.AccountStatus.ACTIVE);

        userRepository.save(user);
    }

    @Override
    public AuthResponse login(LoginRequest request){
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        String token = jwtTokenProvider.generateToken(authentication);
        User user = userRepository.findByEmail(request.getUsername())
                .orElseThrow(()->new RuntimeException("Không tìm thấy người dùng"));

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getJwtExpirationMs())
                .user(AuthResponse.UserInfoDto.builder()
                        .id(user.getId())
                        .studentCode(user.getStudentCode())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .role(String.valueOf(user.getRole()))
                        .libraryTrained(user.isLibraryTrained())
                        .isLocked(user.isLocked())
                        .noShowCount(user.getNoShowCount())
                        .build())
                .build();
    }

    @Override
    public void changePassword(String email, ChangePasswordRequest request){
        User user = userRepository.findByEmail(email)
                .orElseThrow(()->new RuntimeException("Không tìm thấy người dùng"));
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
