
package com.example.booking.controller;

import com.example.booking.entity.AppUser;
import com.example.booking.repository.AppUserRepository;
import com.example.booking.service.BookingService;
import com.example.booking.service.BookingService.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class BookingController {

    private final BookingService service;
    private final AppUserRepository users;

    public BookingController(
            BookingService service,
            AppUserRepository users) {
        this.service = service;
        this.users = users;
    }

    public record UserRequest(@NotNull Long userId) {}

    @GetMapping("/users")
    public List<AppUser> getUsers() {
        return users.findAll();
    }

    @GetMapping("/events/{eventId}/seats")
    public List<SeatView> getSeats(
            @PathVariable Long eventId) {
        return service.getSeats(eventId);
    }

    @GetMapping("/users/{userId}/holds")
    public List<SeatView> getActiveHolds(
            @PathVariable Long userId) {

        return service.getActiveHolds(userId);
    }

    @PostMapping("/seats/{seatId}/hold")
    public String hold(
            @PathVariable Long seatId,
            @Valid @RequestBody UserRequest request) {
        service.holdSeat(seatId, request.userId());
        return "Seat held for 2 minutes";
    }

    @PostMapping("/seats/{seatId}/confirm")
    public BookingView confirm(
            @PathVariable Long seatId,
            @Valid @RequestBody UserRequest request) {
        return service.confirm(seatId, request.userId());
    }

    @DeleteMapping("/seats/{seatId}/hold")
    public String release(
            @PathVariable Long seatId,
            @RequestParam Long userId) {
        service.releaseHold(seatId, userId);
        return "Seat hold released";
    }

    @GetMapping("/users/{userId}/bookings")
    public List<BookingView> bookings(
            @PathVariable Long userId) {
        return service.getBookings(userId);
    }

    @DeleteMapping("/bookings/{bookingId}")
    public String cancel(
            @PathVariable Long bookingId,
            @RequestParam Long userId) {
        service.cancel(bookingId, userId);
        return "Booking cancelled";
    }
}
