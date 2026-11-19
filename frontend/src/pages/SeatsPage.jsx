import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import SeatGrid from "../components/SeatGrid";

export default function SeatsPage({ userId }) {
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [heldSeat, setHeldSeat] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [restoredNotice, setRestoredNotice] = useState(false);

  const loadSeats = useCallback(async () => {
    try {
      const data = await api.getSeats(eventId);
      setSeats(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [eventId]);

  // Initial load: Fetch event details, seats, and active holds for this user
  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      setLoading(true);
      setError("");

      try {
        const [eventData, seatData, holds] = await Promise.all([
          api.getEvent(eventId).catch(() => null),
          api.getSeats(eventId),
          api.getActiveHolds(userId),
        ]);

        if (!active) return;

        setEvent(eventData);
        setSeats(seatData);

        // Find if this user already has an active hold on this event
        const activeHold = holds.find((hold) =>
          seatData.some((seat) => seat.id === hold.id)
        );

        if (activeHold) {
          setHeldSeat({
            ...activeHold,
            userId,
          });
          setSelectedSeat(activeHold);
          setRestoredNotice(true);
        } else {
          setHeldSeat(null);
          setSelectedSeat(null);
          setRestoredNotice(false);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, [eventId, userId]);

  // Background polling: Refresh seat availability every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadSeats().catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [loadSeats]);

  // Tick the clock every second only while a hold is active
  useEffect(() => {
    if (!heldSeat) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, [heldSeat]);

  // Remaining hold time in seconds
  const remaining = heldSeat
    ? Math.max(
        0,
        Math.ceil(
          (new Date(heldSeat.holdExpiresAt).getTime() - now) / 1000
        )
      )
    : 0;

  async function holdSeat() {
    if (!selectedSeat || busy || heldSeat) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await api.holdSeat(selectedSeat.id, userId);

      // Re-fetch seats to read real DB timestamp
      const updatedSeats = await loadSeats();
      const updated = updatedSeats.find((seat) => seat.id === selectedSeat.id);

      if (updated?.status === "HELD") {
        setNow(Date.now());
        setHeldSeat({
          ...updated,
          userId,
        });
        setMessage(`Success! Seat ${updated.seatNumber} is reserved for 2 minutes.`);
        setRestoredNotice(false);
      }
    } catch (err) {
      setError(
        err.message.includes("409") || err.message.toLowerCase().includes("conflict")
          ? `Seat ${selectedSeat.seatNumber} was claimed by another user! Please select an available seat.`
          : err.message
      );
      await loadSeats();
    } finally {
      setBusy(false);
    }
  }

  async function confirmBooking() {
    if (!heldSeat || busy || remaining === 0) return;

    setBusy(true);
    setError("");

    try {
      const booking = await api.confirmBooking(
        heldSeat.id,
        heldSeat.userId
      );

      setMessage(
        `🎉 Booking #${booking.id} confirmed for Seat ${heldSeat.seatNumber}! Check "My Bookings" to view ticket.`
      );
      setHeldSeat(null);
      setSelectedSeat(null);
      await loadSeats();
    } catch (err) {
      setError(err.message);
      await loadSeats();
    } finally {
      setBusy(false);
    }
  }

  async function releaseHold() {
    if (!heldSeat || busy) return;

    setBusy(true);
    setError("");

    try {
      await api.releaseHold(heldSeat.id, heldSeat.userId);
      setMessage(`Seat ${heldSeat.seatNumber} hold released and made available to others.`);
      setHeldSeat(null);
      setSelectedSeat(null);
      await loadSeats();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function chooseAnotherSeat() {
    setHeldSeat(null);
    setSelectedSeat(null);
    loadSeats().catch((err) => setError(err.message));
  }

  function formatTime(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function formatEventDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="container">
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>Loading Seating Chart...</h2>
          <p>Connecting to PostgreSQL for live seat availability.</p>
        </div>
      </main>
    );
  }

  const isExpiringSoon = remaining > 0 && remaining <= 30;

  return (
    <main className="container seat-selection-page">
      {/* Breadcrumb Back Button */}
      <div className="page-breadcrumb">
        <Link to="/" className="back-link">
          <span className="back-arrow">←</span>
          <span>Back to All Events</span>
        </Link>
      </div>

      {/* Event Header Banner Card */}
      {event && (
        <section className="event-summary-banner">
          <div className="summary-poster-wrap">
            <img
              src={event.imageUrl || "/events/avengers.jpg"}
              alt={event.title}
              className="summary-poster"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80";
              }}
            />
          </div>

          <div className="summary-info">
            <div className="summary-tags">
              <span className="summary-category-badge">
                {event.category || "Event"}
              </span>
              {event.rating && (
                <span className="summary-rating-badge">
                  ⭐ {Number(event.rating).toFixed(1)}
                </span>
              )}
            </div>

            <h1 className="summary-title">{event.title}</h1>

            <div className="summary-meta-grid">
              <div className="summary-meta-item">
                <span className="meta-icon">📍</span>
                <span>{event.venue}</span>
              </div>
              <div className="summary-meta-item">
                <span className="meta-icon">📅</span>
                <span>{formatEventDate(event.eventTime)}</span>
              </div>
              <div className="summary-meta-item">
                <span className="meta-icon">💰</span>
                <span>₹{event.ticketPrice?.toLocaleString("en-IN")} per seat</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Notification Banners */}
      {restoredNotice && heldSeat && (
        <div className="notice-banner restored">
          <span className="notice-icon">🔄</span>
          <div className="notice-text">
            <strong>Active Hold Restored:</strong> You have an active hold on Seat{" "}
            <strong>{heldSeat.seatNumber}</strong>. Complete your booking before the timer expires!
          </div>
        </div>
      )}

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

      {/* Layout Split: Seats Chart on Left, Booking Panel on Right */}
      <div className="seat-booking-layout">
        <div className="seat-chart-column">
          <SeatGrid
            seats={seats}
            selectedSeat={selectedSeat}
            onSelect={(seat) => {
              if (heldSeat) return; // Cannot switch while hold is active
              setSelectedSeat(seat);
              setError("");
              setMessage("");
            }}
          />
        </div>

        {/* Floating / Sticky Booking Action Panel */}
        <aside className="booking-sidebar-column">
          <div className="checkout-card">
            <div className="checkout-card-header">
              <h3>Reservation Summary</h3>
              <span className="lock-tag">🔒 Real-Time Lock</span>
            </div>

            <div className="checkout-card-body">
              {heldSeat ? (
                /* HELD SEAT STATE */
                <div className="held-state-view">
                  <div className="held-badge">
                    <span className="held-dot"></span>
                    <span>Seat Reserved for You</span>
                  </div>

                  <div className="held-seat-display">
                    <span className="held-seat-label">Seat Number</span>
                    <span className="held-seat-code">{heldSeat.seatNumber}</span>
                  </div>

                  {/* High-Impact Digital Timer */}
                  <div className={`countdown-box ${isExpiringSoon ? "urgent" : ""}`}>
                    <span className="timer-title">Time Remaining to Confirm</span>
                    <div className="timer-clock">{formatTime(remaining)}</div>
                    <div className="timer-progress-track">
                      <div
                        className="timer-progress-fill"
                        style={{ width: `${Math.min(100, (remaining / 120) * 100)}%` }}
                      ></div>
                    </div>
                    {isExpiringSoon && (
                      <span className="urgent-warning">
                        ⚠️ Expiring soon! Complete booking now.
                      </span>
                    )}
                  </div>

                  {remaining === 0 && (
                    <div className="expired-callout">
                      <strong>Hold Expired:</strong> This seat has been automatically released back to inventory.
                    </div>
                  )}

                  {/* Pricing Breakdown */}
                  {event && (
                    <div className="price-breakdown">
                      <div className="breakdown-row">
                        <span>Ticket (Seat {heldSeat.seatNumber})</span>
                        <span>₹{event.ticketPrice?.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="breakdown-row">
                        <span>Convenience Fee</span>
                        <span className="free-tag">₹0 (Free)</span>
                      </div>
                      <div className="breakdown-row total">
                        <span>Total Payable</span>
                        <span>₹{event.ticketPrice?.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="checkout-actions">
                    <button
                      type="button"
                      className="btn btn-confirm-booking"
                      disabled={busy || remaining === 0}
                      onClick={confirmBooking}
                    >
                      {busy ? "Processing..." : `✓ Confirm Booking (₹${event?.ticketPrice || 0})`}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-release"
                      disabled={busy}
                      onClick={releaseHold}
                    >
                      ✕ Release Seat Hold
                    </button>

                    {remaining === 0 && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={chooseAnotherSeat}
                      >
                        Choose Another Seat
                      </button>
                    )}
                  </div>
                </div>
              ) : selectedSeat ? (
                /* SELECTED SEAT STATE (Ready to Hold) */
                <div className="selected-state-view">
                  <div className="seat-preview-box">
                    <div className="preview-icon">💺</div>
                    <div>
                      <span className="preview-label">Selected Seat</span>
                      <h4 className="preview-number">Seat {selectedSeat.seatNumber}</h4>
                    </div>
                    <span className="preview-status available">Available</span>
                  </div>

                  <p className="seat-hold-explainer">
                    Click <strong>"Hold Seat"</strong> to lock this seat exclusively for <strong>2 minutes</strong>.
                    No other user can book or hold it while locked.
                  </p>

                  {event && (
                    <div className="price-breakdown">
                      <div className="breakdown-row">
                        <span>Seat {selectedSeat.seatNumber} Price</span>
                        <span>₹{event.ticketPrice?.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="breakdown-row total">
                        <span>Estimated Total</span>
                        <span>₹{event.ticketPrice?.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary btn-hold"
                    disabled={busy}
                    onClick={holdSeat}
                  >
                    {busy ? "Locking seat..." : "🔒 Hold Seat for 2 Minutes"}
                  </button>
                </div>
              ) : (
                /* NO SEAT SELECTED STATE */
                <div className="empty-selection-view">
                  <div className="prompt-icon">👆</div>
                  <h4>No Seat Selected</h4>
                  <p>
                    Please click on any green seat from the chart to view details and start reservation.
                  </p>
                  <div className="tip-box">
                    <span>💡 Tip:</span> Open another browser or tab with User B to test concurrent collision prevention!
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
