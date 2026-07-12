package com.example.booking.controller;

import com.example.booking.domain.Booking;
import com.example.booking.domain.Resource;
import com.example.booking.dto.ApiResponse;
import com.example.booking.dto.BookingRequest;
import com.example.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ApiResponse<Booking> createBooking(@Valid @RequestBody BookingRequest request) {
        Booking booking = bookingService.createBooking(request);
        return ApiResponse.success(booking);
    }
    
    @GetMapping("/my")
    public ApiResponse<List<Booking>> getMyBookings(@RequestParam(required = false, defaultValue = "user01") String userId) {
        // In a real app with JWT, userId would be extracted from SecurityContext
        List<Booking> bookings = bookingService.getUserBookings(userId);
        return ApiResponse.success(bookings);
    }
    
    @PutMapping("/{id}/cancel")
    public ApiResponse<Void> cancelMyBooking(@PathVariable Long id, @RequestParam(required = false, defaultValue = "user01") String userId) {
        bookingService.cancelMyBooking(id, userId);
        return ApiResponse.success(null);
    }
    
    @GetMapping("/resources")
    public ApiResponse<List<Resource>> getResources() {
        return ApiResponse.success(bookingService.getAllResources());
    }

    @GetMapping
    public ApiResponse<List<Booking>> getBookings(@RequestParam("date") String date) {
        LocalDate parsedDate = LocalDate.parse(date);
        return ApiResponse.success(bookingService.getBookingsByDate(parsedDate));
    }
}
