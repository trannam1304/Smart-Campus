package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.request.BookingRequest;
import com.smartcampus.backend.dto.response.BookingResponse;


public interface BookingService {
    public BookingResponse createBooking(String userEmail, BookingRequest request);
}
