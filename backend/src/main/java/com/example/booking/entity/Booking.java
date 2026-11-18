
package com.example.booking.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id")
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seat_id")
    private Seat seat;

    @Column(nullable = false)
    private String status = "CONFIRMED";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Booking() {}

    public Booking(AppUser user, Event event, Seat seat) {
        this.user = user;
        this.event = event;
        this.seat = seat;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public Event getEvent() { return event; }
    public Seat getSeat() { return seat; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }

    public void cancel() {
        this.status = "CANCELLED";
    }
}
