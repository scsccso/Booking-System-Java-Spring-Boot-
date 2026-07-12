package com.example.booking.event;

import com.example.booking.domain.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class BookingChangeEvent {
    private Long id;
    private Long resourceId;
    private LocalDate bookingDate;
    private int startHour;
    private int endHour;
    private BookingStatus status;
}
