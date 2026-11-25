package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.dto.request.ChangePasswordRequest;
import com.smartcampus.backend.dto.request.LoginRequest;
import com.smartcampus.backend.dto.request.RegisterRequest;
import com.smartcampus.backend.dto.request.VerifyEmailRequest;
import com.smartcampus.backend.dto.response.AuthResponse;
import com.smartcampus.backend.entity.RefreshToken;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.RefreshTokenRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.security.JwtTokenProvider;
import com.smartcampus.backend.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Triển khai nghiệp vụ nhóm Auth. Liên quan: FR-1.1, FR-1.2, FR-1.3, FR-1.4.
 */
@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthServiceImpl(UserRepository userRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           JwtTokenProvider jwtTokenProvider,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    // ------------------------------------------------------------------
    // FR-1.1: Đăng ký tài khoản sinh viên (chỉ dùng MSSV, không sử dụng email)
    // ------------------------------------------------------------------
    @Override
    public AuthResponse register(RegisterRequest request) {
        String studentCode = request.getStudentCode() != null ? request.getStudentCode().trim() : "";
        if (studentCode.isEmpty()) {
            throw new ConflictException("Vui lòng nhập mã số sinh viên (MSSV).");
        }

        // Kiểm tra trùng MSSV
        if (userRepository.existsByStudentCode(studentCode)) {
            throw new ConflictException("Tài khoản sinh viên (MSSV) đã được đăng ký trên hệ thống.");
        }

        // Tạo định danh nội bộ đáp ứng ràng buộc cột email của CSDL (không yêu cầu người dùng nhập mail)
        String internalEmail = (request.getEmail() != null && !request.getEmail().isBlank())
                ? request.getEmail().trim().toLowerCase()
                : studentCode.toLowerCase() + "@student.local";
        if (userRepository.existsByEmail(internalEmail)) {
            throw new ConflictException("Tài khoản sinh viên (MSSV) đã được đăng ký trên hệ thống.");
        }

        // Mã hoá mật khẩu, kích hoạt ACTIVE ngay lập tức
        User user = new User();
        user.setEmail(internalEmail);
        user.setStudentCode(studentCode);
        user.setFullName(request.getFullName().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFaculty(request.getFaculty());
        user.setRole(User.Role.STUDENT);
        user.setStatus(User.AccountStatus.ACTIVE);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);

        userRepository.save(user);

        return new AuthResponse(null, user.getRole().name(), user.getFullName(), null, user.getStudentCode(), null, user.getId());
    }

    // ------------------------------------------------------------------
    // FR-1.1: Xác thực email kích hoạt tài khoản
    // ------------------------------------------------------------------
    @Override
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByVerificationToken(request.getToken())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Mã xác thực không hợp lệ hoặc đã được sử dụng."));

        if (user.getVerificationTokenExpiresAt() == null
                || user.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ConflictException("Mã xác thực đã hết hạn. Vui lòng đăng ký lại.");
        }

        if (user.getStatus() == User.AccountStatus.ACTIVE) {
            return new AuthResponse(null, user.getRole().name(), user.getFullName(), null, user.getStudentCode(), user.getEmail(), user.getId());
        }

        user.setStatus(User.AccountStatus.ACTIVE);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);
        userRepository.save(user);

        return new AuthResponse(null, user.getRole().name(), user.getFullName(), null, user.getStudentCode(), user.getEmail(), user.getId());
    }

    // ------------------------------------------------------------------
    // FR-1.2: Đăng nhập đa phương thức (hệ thống & SSO)
    // ------------------------------------------------------------------
    @Override
    public AuthResponse login(LoginRequest request) {
        // Tự động chuyển PENDING sang ACTIVE nếu tài khoản trước đó ở trạng thái PENDING (bỏ cơ chế duyệt)
        String loginId = request.getUsername() != null ? request.getUsername().trim() : "";
        User existingUser = userRepository.findByStudentCode(loginId)
                .or(() -> userRepository.findByEmail(loginId))
                .orElse(null);
        if (existingUser != null && existingUser.getStatus() == User.AccountStatus.PENDING) {
            existingUser.setStatus(User.AccountStatus.ACTIVE);
            existingUser.setVerificationToken(null);
            existingUser.setVerificationTokenExpiresAt(null);
            userRepository.save(existingUser);
        }

        // Xác thực bằng AuthenticationManager (username = email hoặc MSSV)
        org.springframework.security.core.Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(), request.getPassword()));
        } catch (org.springframework.security.authentication.LockedException ex) {
            throw new ConflictException("Tài khoản đang bị khóa. Vui lòng liên hệ Ban quản lý.");
        } catch (org.springframework.security.authentication.BadCredentialsException ex) {
            throw new ConflictException("Mật khẩu không chính xác hoặc tài khoản không tồn tại.");
        } catch (Exception ex) {
            throw new ConflictException("Mật khẩu không chính xác hoặc tài khoản không tồn tại.");
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .or(() -> userRepository.findByStudentCode(userDetails.getUsername()))
                .orElseThrow(() ->
                        new ResourceNotFoundException("Không tìm thấy tài khoản người dùng."));

        // Tài khoản chưa kích hoạt email (PENDING): Tự động kích hoạt sang ACTIVE khi đăng nhập hợp lệ
        if (user.getStatus() == User.AccountStatus.PENDING) {
            user.setStatus(User.AccountStatus.ACTIVE);
            user.setVerificationToken(null);
            user.setVerificationTokenExpiresAt(null);
            userRepository.save(user);
        }

        // Tài khoản bị khóa → không cho đăng nhập
        if (user.getStatus() == User.AccountStatus.LOCKED) {
            throw new ConflictException("Tài khoản đang bị khóa. Vui lòng liên hệ Ban quản lý.");
        }

        // Sinh Access Token (15 phút)
        String token = jwtTokenProvider.generateToken(authentication);

        // Sinh Refresh Token (7 ngày) và lưu vào bảng refresh_tokens
        String refreshTokenStr = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(user.getId());
        refreshToken.setTokenHash(refreshTokenStr);
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshToken.setIsRevoked(false);
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(token, user.getRole().name(), user.getFullName(), refreshTokenStr, user.getStudentCode(), user.getEmail(), user.getId());
    }

    // ------------------------------------------------------------------
    // FR-1.4: Đổi mật khẩu (yêu cầu đã đăng nhập)
    // ------------------------------------------------------------------
    @Override
    public AuthResponse changePassword(String identifier, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByStudentCode(identifier))
                .orElseThrow(() ->
                        new ResourceNotFoundException("Không tìm thấy tài khoản: " + identifier));

        // Xác thực mật khẩu cũ
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ConflictException("Mật khẩu hiện tại không chính xác.");
        }

        // Cập nhật mật khẩu mới (đã mã hoá)
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return new AuthResponse(null, user.getRole().name(), user.getFullName(), null, user.getStudentCode(), user.getEmail(), user.getId());
    }

    // ------------------------------------------------------------------
    // FR-1.2, NFR-03: Cấp mới Access Token bằng Refresh Token (Token Rotation)
    // ------------------------------------------------------------------
    @Override
    public AuthResponse refreshToken(String refreshTokenStr, String deviceInfo, String ipAddress) {
        if (refreshTokenStr == null || refreshTokenStr.isBlank()) {
            throw new ConflictException("Refresh Token không hợp lệ.");
        }

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(refreshTokenStr)
                .orElseThrow(() -> new ResourceNotFoundException("Refresh Token không tồn tại hoặc đã hết hạn."));

        // Token Reuse Detection: nếu token đã bị revoked mà vẫn gửi lên -> có dấu hiệu đánh cắp token
        if (Boolean.TRUE.equals(refreshToken.getIsRevoked())) {
            refreshTokenRepository.revokeAllByUserId(refreshToken.getUserId());
            throw new ConflictException("Phát hiện phiên truy cập đáng ngờ. Toàn bộ phiên đăng nhập đã bị hủy để bảo vệ tài khoản.");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ConflictException("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng."));

        if (user.getStatus() != User.AccountStatus.ACTIVE) {
            throw new ConflictException("Tài khoản chưa được kích hoạt hoặc đã bị khóa.");
        }

        // Token Rotation: thu hồi token cũ, phát hành token mới
        refreshToken.setIsRevoked(true);
        refreshTokenRepository.save(refreshToken);

        String newRefreshTokenStr = UUID.randomUUID().toString();
        RefreshToken newRefreshToken = new RefreshToken();
        newRefreshToken.setUserId(user.getId());
        newRefreshToken.setTokenHash(newRefreshTokenStr);
        newRefreshToken.setExpiresAt(LocalDateTime.now().plusDays(7));
        newRefreshToken.setIsRevoked(false);
        newRefreshToken.setDeviceInfo(deviceInfo);
        newRefreshToken.setIpAddress(ipAddress);
        refreshTokenRepository.save(newRefreshToken);

        String newAccessToken = jwtTokenProvider.generateToken(user);
        return new AuthResponse(newAccessToken, user.getRole().name(), user.getFullName(), newRefreshTokenStr, user.getStudentCode(), user.getEmail(), user.getId());
    }

    // ------------------------------------------------------------------
    // FR-1.2, NFR-03: Đăng xuất và thu hồi Refresh Token
    // ------------------------------------------------------------------
    @Override
    public void logout(String refreshTokenStr) {
        if (refreshTokenStr != null && !refreshTokenStr.isBlank()) {
            refreshTokenRepository.revokeByTokenHash(refreshTokenStr);
        }
    }
}
