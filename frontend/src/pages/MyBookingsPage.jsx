
import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function MyBookingsPage({ userId }) {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    api.getBookings(userId)
      .then((data) => {
        if (active) setBookings(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  async function cancelBooking(bookingId) {
    if (!window.confirm("Cancel this booking?")) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await api.cancelBooking(bookingId, userId);

      setMessage("Booking cancelled successfully!");
      const updated = await api.getBookings(userId);
      setBookings(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container">
      <h1>My Bookings</h1>
      <p className="subtitle">
        View your booking history and cancel tickets.
      </p>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      {bookings.length === 0 && (
        <p>You have no bookings yet.</p>
      )}

      <div className="booking-list">
        {bookings.map((booking) => (
          <div className="card" key={booking.id}>
            <h2>{booking.event}</h2>
            <p>Booking ID: {booking.id}</p>
            <p>Seat: {booking.seat}</p>

            <span
              className={
                booking.status === "CONFIRMED"
                  ? "status confirmed"
                  : "status cancelled"
              }
            >
              {booking.status}
            </span>

            {booking.status === "CONFIRMED" && (
              <button
                className="btn btn-danger"
                disabled={busy}
                onClick={() => cancelBooking(booking.id)}
              >
                Cancel Booking
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
