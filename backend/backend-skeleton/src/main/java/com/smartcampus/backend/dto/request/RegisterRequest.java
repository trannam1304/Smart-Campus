package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

// FR-1.1
@Getter @Setter
public class RegisterRequest {
    @NotBlank(message="Họ và tên không được để trống") private String fullName;
    @NotBlank(message="Mã số sinh viên không được để trống") private String studentCode;
    @NotBlank(message = "Email không được để trống") 
    @Email(message = "Định dạng email không hợp lệ") 
    @Pattern( 
        regexp = "^[A-Za-z0-9._%+-]+@student\\.tdtu\\.edu\\.vn$", 
        message = "Email bắt buộc phải có đuôi @student.tdtu.edu.vn" 
    )    
    private String email;    
    @NotBlank(message="Vui lòng nhập mật khẩu") 
    @Size(min = 8, message = "Mật khẩu phải có tối thiểu 8 ký tự")
    private String password;
    private String faculty;


}
