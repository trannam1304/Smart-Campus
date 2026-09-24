package com.smartcampus.backend.dto.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size; 
import lombok.Data;


@Data 
public class ChangePasswordRequest {
    @NotBlank(message = "Mật khẩu hiện tại không được để trống") 
    private String oldPassword; 
    @NotBlank(message = "Mật khẩu mới không được để trống") 
    @Size(min = 8, message = "Mật khẩu mới phải có tối thiểu 8 ký tự") 
    private String newPassword; 
}