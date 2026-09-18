package com.smartcampus.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// FR-1.1
@Getter @Setter
public class RegisterRequest {
    @NotBlank private String fullName;
    @NotBlank private String studentCode;
    @NotBlank @Email private String email; // @student.edu.vn
    @NotBlank private String password;
    private String faculty;
}
