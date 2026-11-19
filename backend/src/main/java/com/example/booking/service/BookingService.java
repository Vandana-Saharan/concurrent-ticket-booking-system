
package com.example.booking.service;

import com.example.booking.entity.*;
import com.example.booking.repository.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
public class BookingService {

    private final SeatRepository seats;
    private final BookingRepository bookings;
    private final AppUserRepository users;
    private final EventRepository events;
    private final EntityManager entityManager;

    public BookingService(
            SeatRepository seats,
            BookingRepository bookings,
            AppUserRepository users,
            EventRepository events,
            EntityManager entityManager) {
        this.seats = seats;
        this.bookings = bookings;
        this.users = users;
        this.events = events;
        this.entityManager = entityManager;
    }

    public record SeatView(
            Long id,
            String seatNumber,
            String status,
            Instant holdExpiresAt) {}

    public record BookingView(
            Long id,
            String event,
            String seat,
            String status,
            java.time.LocalDateTime eventTime,
            String venue,
            double ticketPrice,
            String imageUrl) {}

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(
                HttpStatus.CONFLICT, message);
    }


    private Instant databaseNow() {
        Object result = entityManager
                .createNativeQuery("SELECT clock_timestamp()")
                .getSingleResult();

        if (result instanceof java.sql.Timestamp timestamp) {
            return timestamp.toInstant();
        }

        if (result instanceof Instant instant) {
            return instant;
        }

        if (result instanceof java.time.OffsetDateTime offsetDateTime) {
            return offsetDateTime.toInstant();
        }

        throw new IllegalStateException(
                "Unexpected database timestamp type: " +
                        (result == null ? "null" : result.getClass().getName())
        );
    }



    // 1. VIEW SEATS
    @Transactional(readOnly = true)
    public List<SeatView> getSeats(Long eventId) {

        if (!events.existsById(eventId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Event not found");
        }

        Instant now = databaseNow();

        return seats.findByEventIdOrderBySeatNumberAsc(eventId)
                .stream()
                .map(s -> {
                    boolean expired =
                            s.getStatus().equals("HELD")
                                    && s.getHoldExpiresAt() != null
                                    && !s.getHoldExpiresAt().isAfter(now);

                    return new SeatView(
                            s.getId(),
                            s.getSeatNumber(),
                            expired ? "AVAILABLE" : s.getStatus(),
                            expired ? null : s.getHoldExpiresAt()
                    );
                })
                .toList();
    }

    // 2. HOLD A SEAT
    @Transactional
    public void holdSeat(Long seatId, Long userId) {

        if (!users.existsById(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "User not found");
        }

        int updated = seats.holdSeat(seatId, userId);

        if (updated == 0) {
            throw conflict("Seat is currently unavailable");
        }
    }

    // 3. CONFIRM A BOOKING
    @Transactional
    public BookingView confirm(Long seatId, Long userId) {

        Seat seat = seats.findByIdForUpdate(seatId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "Seat not found"));

        Instant now = databaseNow();

        boolean valid =
                seat.getStatus().equals("HELD")
                        && Objects.equals(seat.getHeldBy(), userId)
                        && seat.getHoldExpiresAt() != null
                        && seat.getHoldExpiresAt().isAfter(now);

        if (!valid) {
            throw conflict("No valid seat hold for this user");
        }

        AppUser user = users.findById(userId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "User not found"));

        seat.setStatus("BOOKED");
        seat.clearHold();

        Booking booking = bookings.saveAndFlush(
                new Booking(user, seat.getEvent(), seat)
        );

        return toView(booking);
    }

    // 4. RELEASE A HOLD
    @Transactional
    public void releaseHold(Long seatId, Long userId) {

        Seat seat = seats.findByIdForUpdate(seatId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "Seat not found"));

        if (!seat.getStatus().equals("HELD")
                || !Objects.equals(seat.getHeldBy(), userId)) {
            throw conflict("This user does not hold the seat");
        }

        seat.setStatus("AVAILABLE");
        seat.clearHold();
    }

    // 5. BOOKING HISTORY
    @Transactional(readOnly = true)
    public List<BookingView> getBookings(Long userId) {

        if (!users.existsById(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "User not found");
        }

        return bookings.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toView)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SeatView> getActiveHolds(Long userId) {

        if (!users.existsById(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "User not found"
            );
        }

        Instant now = databaseNow();

        return seats.findByHeldByAndStatus(userId, "HELD")
                .stream()
                .filter(seat ->
                        seat.getHoldExpiresAt() != null
                                && seat.getHoldExpiresAt().isAfter(now)
                )
                .map(seat -> new SeatView(
                        seat.getId(),
                        seat.getSeatNumber(),
                        seat.getStatus(),
                        seat.getHoldExpiresAt()
                ))
                .toList();
    }


    // 6. CANCEL BOOKING
    @Transactional
    public void cancel(Long bookingId, Long userId) {

        Booking booking = bookings.findByIdForUpdate(bookingId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Not your booking");
        }

        if (!booking.getStatus().equals("CONFIRMED")) {
            throw conflict("Booking already cancelled");
        }

        Seat seat = seats.findByIdForUpdate(
                booking.getSeat().getId()
        ).orElseThrow();

        booking.cancel();
        seat.setStatus("AVAILABLE");
        seat.clearHold();
    }

    private BookingView toView(Booking booking) {
        return new BookingView(
                booking.getId(),
                booking.getEvent().getTitle(),
                booking.getSeat().getSeatNumber(),
                booking.getStatus(),
                booking.getEvent().getEventTime(),
                booking.getEvent().getVenue(),
                booking.getEvent().getTicketPrice(),
                booking.getEvent().getImageUrl()
        );
    }
}
