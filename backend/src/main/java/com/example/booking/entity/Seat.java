
package com.example.booking.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "seats",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"event_id", "seat_number"}
        )
)
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id")
    private Event event;

    @Column(name = "seat_number", nullable = false)
    private String seatNumber;

    @Column(nullable = false)
    private String status = "AVAILABLE";

    @Column(name = "held_by")
    private Long heldBy;

    @Column(name = "hold_expires_at")
    private Instant holdExpiresAt;

    public Seat() {}

    public Seat(Event event, String seatNumber) {
        this.event = event;
        this.seatNumber = seatNumber;
    }

    public Long getId() { return id; }
    public Event getEvent() { return event; }
    public String getSeatNumber() { return seatNumber; }
    public String getStatus() { return status; }
    public Long getHeldBy() { return heldBy; }
    public Instant getHoldExpiresAt() { return holdExpiresAt; }

    public void setStatus(String status) {
        this.status = status;
    }

    public void clearHold() {
        this.heldBy = null;
        this.holdExpiresAt = null;
    }
}
