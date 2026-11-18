package com.example.booking.repository;

import com.example.booking.entity.Seat;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    // 1. Fetch seats belonging to an event
    List<Seat> findByEventIdOrderBySeatNumberAsc(Long eventId);

    // 2. Atomically hold an available or expired seat
    @Modifying
    @Query(value = """
        UPDATE seats
        SET status = 'HELD',
            held_by = :userId,
            hold_expires_at =
                clock_timestamp() + INTERVAL '2 minutes'
        WHERE id = :seatId
          AND (
              status = 'AVAILABLE'
              OR (
                  status = 'HELD'
                  AND hold_expires_at <= clock_timestamp()
              )
          )
        """, nativeQuery = true)
    int holdSeat(
            @Param("seatId") Long seatId,
            @Param("userId") Long userId
    );

    // 3. Find seats held by a specific user
    List<Seat> findByHeldByAndStatus(
            Long heldBy,
            String status
    );

    // 4. Lock a seat for booking confirmation
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Seat s WHERE s.id = :id")
    Optional<Seat> findByIdForUpdate(@Param("id") Long id);
}