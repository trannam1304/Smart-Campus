package com.smartcampus.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutResponse {
    private String bookingId;
    private String status;
    private String actualCheckoutTime;
}
