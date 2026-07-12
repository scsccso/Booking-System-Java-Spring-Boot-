package com.example.booking.service;

import com.example.booking.domain.Booking;
import com.example.booking.domain.BookingStatus;
import com.example.booking.domain.Resource;
import com.example.booking.dto.BookingRequest;
import com.example.booking.exception.ResourceConflictException;
import com.example.booking.repository.BookingRepository;
import com.example.booking.repository.ResourceRepository;
import org.springframework.context.ApplicationEventPublisher;
import com.example.booking.event.BookingChangeEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.SERIALIZABLE)
    public Booking createBooking(BookingRequest request) {
        if (request.getStartHour() >= request.getEndHour()) {
            throw new IllegalArgumentException("Start hour must be less than end hour");
        }

        // 1. Pessimistic Write Lock on Resource to prevent concurrent bookings for the same resource
        Resource resource = resourceRepository.findByIdWithPessimisticWriteLock(request.getResourceId())
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));

        // 2. Check for overlapping bookings
        long overlappingCount = bookingRepository.countOverlappingBookings(
                resource.getId(),
                request.getBookingDate(),
                BookingStatus.CONFIRMED,
                request.getStartHour(),
                request.getEndHour()
        );

        if (overlappingCount > 0) {
            throw new ResourceConflictException("The resource is already booked for the specified time slot.");
        }

        int requestedHours = request.getEndHour() - request.getStartHour();
        int currentBookedHours = bookingRepository.calculateTotalHoursByUserAndDate(request.getUserId(), request.getBookingDate());
        if (currentBookedHours + requestedHours > 4) {
            throw new IllegalArgumentException("Daily booking limit of 4 hours exceeded. You have " + (4 - currentBookedHours) + " hours remaining today.");
        }

        // 3. Create and save booking
        Booking booking = new Booking();
        booking.setResource(resource);
        booking.setUserId(request.getUserId());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartHour(request.getStartHour());
        booking.setEndHour(request.getEndHour());
        booking.setStatus(BookingStatus.CONFIRMED);

        Booking savedBooking = bookingRepository.save(booking);

        eventPublisher.publishEvent(new BookingChangeEvent(
                savedBooking.getId(),
                savedBooking.getResource().getId(),
                savedBooking.getBookingDate(),
                savedBooking.getStartHour(),
                savedBooking.getEndHour(),
                savedBooking.getStatus()
        ));

        return savedBooking;
    }

    @Transactional(readOnly = true)
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<Booking> getBookingsByDate(LocalDate date) {
        return bookingRepository.findAll().stream()
                .filter(b -> b.getBookingDate().equals(date))
                .toList();
    }

    @Transactional
    public void cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        eventPublisher.publishEvent(new BookingChangeEvent(
                booking.getId(),
                booking.getResource().getId(),
                booking.getBookingDate(),
                booking.getStartHour(),
                booking.getEndHour(),
                booking.getStatus()
        ));
    }

    @Transactional
    public void updateResourceStatus(Long resourceId, com.example.booking.domain.ResourceStatus status) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));
        resource.setStatus(status);
        resourceRepository.save(resource);
        
        // Broadcast the change so connected UI can update
        eventPublisher.publishEvent(new BookingChangeEvent(
                -1L, // Indicates it's a resource update, not a specific booking
                resource.getId(),
                LocalDate.now(),
                0,
                0,
                status == com.example.booking.domain.ResourceStatus.MAINTENANCE ? BookingStatus.CANCELLED : BookingStatus.CONFIRMED
        ));
    }
    
    public List<Booking> getUserBookings(String userId) {
        return bookingRepository.findByUserIdAndBookingDateGreaterThanEqualAndStatusOrderByBookingDateAscStartHourAsc(userId, LocalDate.now(), BookingStatus.CONFIRMED);
    }
    
    @Transactional
    public void cancelMyBooking(Long bookingId, String userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        
        if (!booking.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You are not authorized to cancel this booking.");
        }
        
        if (booking.getBookingDate().isEqual(LocalDate.now()) && java.time.LocalTime.now().getHour() >= booking.getStartHour()) {
            throw new IllegalArgumentException("Booking is locked and cannot be cancelled.");
        }
        
        if (booking.getBookingDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Cannot cancel past bookings.");
        }
        
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        eventPublisher.publishEvent(new BookingChangeEvent(
                booking.getId(),
                booking.getResource().getId(),
                booking.getBookingDate(),
                booking.getStartHour(),
                booking.getEndHour(),
                booking.getStatus()
        ));
    }
}
