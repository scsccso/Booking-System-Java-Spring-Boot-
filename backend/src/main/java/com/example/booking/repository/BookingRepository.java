package com.example.booking.repository;

import com.example.booking.domain.Booking;
import com.example.booking.domain.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.resource.id = :resourceId AND b.bookingDate = :date AND b.status = :status AND (b.startHour < :endHour AND b.endHour > :startHour)")
    long countOverlappingBookings(
            @Param("resourceId") Long resourceId,
            @Param("date") LocalDate date,
            @Param("status") BookingStatus status,
            @Param("startHour") int startHour,
            @Param("endHour") int endHour
    );

    @Query("SELECT COALESCE(SUM(b.endHour - b.startHour), 0) FROM Booking b " +
           "WHERE b.userId = :userId " +
           "AND b.bookingDate = :date " +
           "AND b.status = 'CONFIRMED'")
    Integer calculateTotalHoursByUserAndDate(
            @Param("userId") String userId, 
            @Param("date") LocalDate date);
            
    List<Booking> findByUserIdAndBookingDateGreaterThanEqualAndStatusOrderByBookingDateAscStartHourAsc(
            String userId, LocalDate date, com.example.booking.domain.BookingStatus status);
}
