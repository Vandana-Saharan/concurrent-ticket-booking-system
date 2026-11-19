import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function MyBookingsPage({ userId }) {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let active = true;
    setLoading(true);

    api.getBookings(userId)
      .then((data) => {
        if (active) setBookings(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  async function cancelBooking(bookingId, seatNumber) {
    if (!window.confirm(`Are you sure you want to cancel booking for Seat ${seatNumber}? The seat will be released back to inventory.`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await api.cancelBooking(bookingId, userId);
      setMessage(`Booking #${bookingId} cancelled successfully. Seat ${seatNumber} is now available.`);
      const updated = await api.getBookings(userId);
      setBookings(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function formatDateTime(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const filteredBookings = useMemo(() => {
    if (statusFilter === "ALL") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const cancelledCount = bookings.filter((b) => b.status === "CANCELLED").length;

  if (loading) {
    return (
      <main className="container">
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>Loading Booking History...</h2>
          <p>Retrieving your confirmed and past tickets.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container bookings-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tickets & Bookings</h1>
          <p className="page-subtitle">
            Manage your reserved tickets, view boarding passes, or cancel bookings in real-time.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="bookings-summary-stats">
          <div className="summary-stat-box">
            <span className="stat-num">{bookings.length}</span>
            <span className="stat-desc">Total</span>
          </div>
          <div className="summary-stat-box confirmed">
            <span className="stat-num">{confirmedCount}</span>
            <span className="stat-desc">Confirmed</span>
          </div>
          {cancelledCount > 0 && (
            <div className="summary-stat-box cancelled">
              <span className="stat-num">{cancelledCount}</span>
              <span className="stat-desc">Cancelled</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="booking-filter-bar">
        <div className="filter-pill-group">
          <button
            type="button"
            className={`filter-pill ${statusFilter === "ALL" ? "active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
          >
            All Tickets ({bookings.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${statusFilter === "CONFIRMED" ? "active" : ""}`}
            onClick={() => setStatusFilter("CONFIRMED")}
          >
            🟢 Confirmed ({confirmedCount})
          </button>
          {cancelledCount > 0 && (
            <button
              type="button"
              className={`filter-pill ${statusFilter === "CANCELLED" ? "active" : ""}`}
              onClick={() => setStatusFilter("CANCELLED")}
            >
              ⚪ Cancelled ({cancelledCount})
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="notice-banner error">
          <span className="notice-icon">⚠️</span>
          <div className="notice-text">{error}</div>
        </div>
      )}

      {message && (
        <div className="notice-banner success">
          <span className="notice-icon">✅</span>
          <div className="notice-text">{message}</div>
        </div>
      )}

      {/* Empty State */}
      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎟️</div>
          <h3>No bookings found</h3>
          <p>
            {statusFilter === "ALL"
              ? "You haven't booked any seats yet. Browse our live events and grab your tickets!"
              : `No ${statusFilter.toLowerCase()} bookings found.`}
          </p>
          <Link to="/" className="btn btn-primary">
            Browse Live Events
          </Link>
        </div>
      ) : (
        /* Ticket Pass Cards Grid */
        <div className="ticket-passes-list">
          {filteredBookings.map((booking) => {
            const isConfirmed = booking.status === "CONFIRMED";

            return (
              <div
                className={`ticket-pass-card ${isConfirmed ? "confirmed" : "cancelled"}`}
                key={booking.id}
              >
                {/* Left Ticket Section: Event & Seat Info */}
                <div className="ticket-main-section">
                  <div className="ticket-poster-wrap">
                    <img
                      src={booking.imageUrl || "/events/avengers.jpg"}
                      alt={booking.event}
                      className="ticket-poster"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80";
                      }}
                    />
                  </div>

                  <div className="ticket-details">
                    <div className="ticket-header-row">
                      <span className="ticket-type-label">ADMIT ONE PASS</span>
                      <span className={`ticket-status-pill ${isConfirmed ? "confirmed" : "cancelled"}`}>
                        {isConfirmed ? "● CONFIRMED" : "○ CANCELLED"}
                      </span>
                    </div>

                    <h2 className="ticket-event-title">{booking.event}</h2>

                    <div className="ticket-meta-grid">
                      {booking.venue && (
                        <div className="ticket-meta-cell">
                          <span className="cell-label">VENUE</span>
                          <span className="cell-value">📍 {booking.venue}</span>
                        </div>
                      )}
                      {booking.eventTime && (
                        <div className="ticket-meta-cell">
                          <span className="cell-label">DATE & TIME</span>
                          <span className="cell-value">📅 {formatDateTime(booking.eventTime)}</span>
                        </div>
                      )}
                      <div className="ticket-meta-cell">
                        <span className="cell-label">RESERVED SEAT</span>
                        <span className="cell-seat-badge">{booking.seat}</span>
                      </div>
                      {booking.ticketPrice && (
                        <div className="ticket-meta-cell">
                          <span className="cell-label">TOTAL PAID</span>
                          <span className="cell-value price">₹{booking.ticketPrice.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Perforation Divider Line */}
                <div className="ticket-perforation">
                  <div className="notch top"></div>
                  <div className="perforated-line"></div>
                  <div className="notch bottom"></div>
                </div>

                {/* Right Ticket Section: Stub & Action */}
                <div className="ticket-stub-section">
                  <div className="stub-header">
                    <span className="stub-label">BOOKING ID</span>
                    <span className="stub-ref">#BKG-{String(booking.id).padStart(4, "0")}</span>
                  </div>

                  {/* Simulated Barcode */}
                  <div className="stub-barcode-container">
                    <div className="barcode-bars">
                      <div className="bar thin"></div>
                      <div className="bar thick"></div>
                      <div className="bar thin"></div>
                      <div className="bar medium"></div>
                      <div className="bar thick"></div>
                      <div className="bar thin"></div>
                      <div className="bar thick"></div>
                      <div className="bar thin"></div>
                      <div className="bar medium"></div>
                      <div className="bar thick"></div>
                      <div className="bar thin"></div>
                      <div className="bar thin"></div>
                      <div className="bar thick"></div>
                    </div>
                    <span className="barcode-number">TKT-{booking.id}-{booking.seat}</span>
                  </div>

                  {/* Action */}
                  {isConfirmed ? (
                    <button
                      type="button"
                      className="btn btn-cancel-ticket"
                      disabled={busy}
                      onClick={() => cancelBooking(booking.id, booking.seat)}
                    >
                      {busy ? "Processing..." : "Cancel Ticket"}
                    </button>
                  ) : (
                    <div className="cancelled-label">
                      Ticket Inactive
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
