CREATE UNIQUE INDEX IF NOT EXISTS
    uq_confirmed_booking_per_seat
    ON bookings (seat_id)
    WHERE status = 'CONFIRMED';
