package com.smartcampus.backend.service.impl;

import com.smartcampus.backend.dto.request.ChangePasswordRequest;
import com.smartcampus.backend.dto.request.ForgotPasswordRequest;
import com.smartcampus.backend.dto.request.LoginRequest;
import com.smartcampus.backend.dto.request.RegisterRequest;
import com.smartcampus.backend.dto.request.ResetPasswordRequest;
import com.smartcampus.backend.dto.request.VerifyEmailRequest;
import com.smartcampus.backend.dto.response.AuthResponse;
import com.smartcampus.backend.entity.PasswordResetOtp;
import com.smartcampus.backend.entity.User;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.repository.PasswordResetOtpRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.security.JwtTokenProvider;
import com.smartcampus.backend.service.AuthService;
import com.smartcampus.backend.service.EmailService;
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
 *
 * <p>Luồng nghiệp vụ theo Normal Flow / Exception Flow trong SRS ISO/IEC/IEEE 29148:
 * <ul>
 *   <li><b>register</b> (FR-1.1): Kiểm tra email/MSSV trùng → mã hoá mật khẩu → lưu trạng thái
 *       PENDING → sinh mã xác thực → gửi email kích hoạt → trả về thông báo thành công.
 *       Nếu email/MSSV đã tồn tại hoặc email không đúng đuôi @student.edu.vn → báo lỗi.</li>
 *   <li><b>verifyEmail</b> (FR-1.1): Tìm user theo mã xác thực → kiểm tra chưa hết hạn →
 *       đổi trạng thái sang ACTIVE → xóa mã xác thực. Nếu token không hợp lệ/đã hết hạn → báo lỗi.</li>
 *   <li><b>login</b> (FR-1.2): Xác thực email/MSSV + mật khẩu qua AuthenticationManager →
 *       sinh JWT → trả về token + role + fullName. Chỉ cho phép tài khoản ACTIVE.
 *       Nếu mật khẩu sai hoặc tài khoản bị khóa → báo lỗi và từ chối truy cập.</li>
 *   <li><b>changePassword</b> (FR-1.4): Xác thực mật khẩu cũ → mã hoá mật khẩu mới →
 *       cập nhật CSDL. Nếu mật khẩu cũ không chính xác → báo lỗi.</li>
 *   <li><b>forgotPassword</b> (FR-1.4): Tìm user theo email → sinh OTP 5 phút → lưu vào
 *       password_reset_otp → gửi email OTP.</li>
 *   <li><b>resetPassword</b> (FR-1.4): Kiểm tra OTP chưa hết hạn/chưa dùng → cập nhật
 *       mật khẩu mới → đánh dấu OTP đã dùng.</li>
 * </ul>
 */
@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordResetOtpRepository otpRepository,
                           JwtTokenProvider jwtTokenProvider,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           EmailService emailService) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    // ------------------------------------------------------------------
    // FR-1.1: Đăng ký tài khoản sinh viên
    // ------------------------------------------------------------------
    @Override
    public AuthResponse register(RegisterRequest request) {
        // Kiểm tra email đúng đuôi @student.edu.vn (defense-in-depth, ngoài validation DTO)
        if (!request.getEmail().endsWith("@student.edu.vn")) {
            throw new ConflictException("Email phải là email trường có đuôi @student.edu.vn.");
        }

        // Kiểm tra trùng email / MSSV
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email hoặc MSSV đã được đăng ký trên hệ thống.");
        }
        if (userRepository.existsByStudentCode(request.getStudentCode())) {
            throw new ConflictException("Email hoặc MSSV đã được đăng ký trên hệ thống.");
        }

        // Mã hoá mật khẩu, lưu trạng thái PENDING (chưa kích hoạt email)
        User user = new User();
        user.setEmail(request.getEmail());
        user.setStudentCode(request.getStudentCode());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFaculty(request.getFaculty());
        user.setRole(User.Role.STUDENT);
        user.setStatus(User.AccountStatus.PENDING);

        // Sinh mã xác thực email, hiệu lực 24 giờ
        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));

        userRepository.save(user);

        // Gửi email xác thực (dev: chỉ ghi log)
        emailService.sendVerificationEmail(request.getEmail(), verificationToken);

        return new AuthResponse(null, user.getRole().name(), user.getFullName());
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
            return new AuthResponse(null, user.getRole().name(), user.getFullName());
        }

        user.setStatus(User.AccountStatus.ACTIVE);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);
        userRepository.save(user);

        return new AuthResponse(null, user.getRole().name(), user.getFullName());
    }

    // ------------------------------------------------------------------
    // FR-1.2: Đăng nhập đa phương thức (hệ thống & SSO)
    // ------------------------------------------------------------------
    @Override
    public AuthResponse login(LoginRequest request) {
        // Xác thực bằng AuthenticationManager (username = email hoặc MSSV)
        org.springframework.security.core.Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(), request.getPassword()));
        } catch (Exception ex) {
            throw new ConflictException("Mật khẩu không chính xác hoặc tài khoản không tồn tại.");
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Không tìm thấy tài khoản người dùng."));

        // Tài khoản chưa kích hoạt email (PENDING) → không cho đăng nhập
        if (user.getStatus() == User.AccountStatus.PENDING) {
            throw new ConflictException(
                    "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để xác thực tài khoản.");
        }

        // Tài khoản bị khóa → không cho đăng nhập
        if (user.getStatus() == User.AccountStatus.LOCKED) {
            throw new ConflictException("Tài khoản đang bị khóa. Vui lòng liên hệ Ban quản lý.");
        }

        // Sinh JWT token
        String token = jwtTokenProvider.generateToken(authentication);

        return new AuthResponse(token, user.getRole().name(), user.getFullName());
    }

    // ------------------------------------------------------------------
    // FR-1.4: Đổi mật khẩu (yêu cầu đã đăng nhập)
    // ------------------------------------------------------------------
    @Override
    public AuthResponse changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Không tìm thấy tài khoản với email: " + email));

        // Xác thực mật khẩu cũ
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ConflictException("Mật khẩu hiện tại không chính xác.");
        }

        // Cập nhật mật khẩu mới (đã mã hoá)
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return new AuthResponse(null, user.getRole().name(), user.getFullName());
    }

    // ------------------------------------------------------------------
    // FR-1.4: Gửi mã OTP khôi phục mật khẩu
    // ------------------------------------------------------------------
    @Override
    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Không tìm thấy tài khoản với email này."));

        // Sinh mã OTP 6 chữ số
        String otpCode = String.valueOf((int) (Math.random() * 900000) + 100000);

        PasswordResetOtp otp = new PasswordResetOtp();
        otp.setUserId(user.getId());
        otp.setOtpCode(otpCode);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(5)); // hiệu lực 5 phút (FR-1.4)
        otp.setIsUsed(false);
        otpRepository.save(otp);

        // Gửi email OTP (dev: chỉ ghi log)
        emailService.sendOtpEmail(request.getEmail(), otpCode);

        return "Mã OTP đã được gửi đến email của bạn. Hiệu lực trong 5 phút.";
    }

    // ------------------------------------------------------------------
    // FR-1.4: Khôi phục mật khẩu bằng OTP
    // ------------------------------------------------------------------
    @Override
    public String resetPassword(ResetPasswordRequest request) {
        PasswordResetOtp otp = otpRepository.findByOtpCode(request.getOtpCode())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Mã OTP không chính xác."));

        if (otp.getIsUsed()) {
            throw new ConflictException("Mã OTP đã được sử dụng.");
        }

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ConflictException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        User user = userRepository.findById(otp.getUserId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Không tìm thấy tài khoản người dùng."));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        otpRepository.markAsUsed(otp.getId());

        return "Mật khẩu đã được cập nhật thành công.";
    }
}
