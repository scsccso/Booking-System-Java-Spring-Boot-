package com.example.booking.controller;

import com.example.booking.domain.Booking;
import com.example.booking.domain.Resource;
import com.example.booking.dto.ApiResponse;
import com.example.booking.service.BookingService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final BookingService bookingService;

    @GetMapping("/dashboard")
    public ApiResponse<DashboardStats> getDashboardStats(@RequestParam(value = "date", required = false) String dateStr) {
        LocalDate date = (dateStr != null) ? LocalDate.parse(dateStr) : LocalDate.now();
        List<Booking> bookings = bookingService.getBookingsByDate(date);
        List<Resource> resources = bookingService.getAllResources();

        int totalBookings = bookings.size();
        Map<Long, ResourceStat> occupancyRates = new HashMap<>();
        for (Resource r : resources) {
            long bookedHours = bookings.stream()
                    .filter(b -> b.getResource().getId().equals(r.getId()))
                    .mapToInt(b -> b.getEndHour() - b.getStartHour())
                    .sum();
            double rate = (bookedHours / 9.0) * 100;
            occupancyRates.put(r.getId(), new ResourceStat(r.getName(), rate));
        }

        DashboardStats stats = new DashboardStats(totalBookings, occupancyRates);
        return ApiResponse.success(stats);
    }

    @DeleteMapping("/bookings/{id}")
    public ApiResponse<Void> cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
        return ApiResponse.success(null);
    }

    @PutMapping("/resources/{id}/status")
    public ApiResponse<Void> updateResourceStatus(
            @PathVariable Long id,
            @RequestBody com.example.booking.dto.ResourceStatusUpdateRequest request) {
        bookingService.updateResourceStatus(id, request.getStatus());
        return ApiResponse.success(null);
    }

    @Data
    public static class DashboardStats {
        private final int totalBookings;
        private final Map<Long, ResourceStat> occupancyRates;
    }
    
    @Data
    public static class ResourceStat {
        private final String name;
        private final double rate;
    }
}
