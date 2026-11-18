import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import SeatGrid from "../components/SeatGrid";

export default function SeatsPage({ userId }) {
  const { eventId } = useParams();

  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [heldSeat, setHeldSeat] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadSeats = useCallback(async () => {
    const data = await api.getSeats(eventId);
    setSeats(data);
  }, [eventId]);

  // Initial seat load.
  
useEffect(() => {
  let active = true;

  async function loadInitialData() {
    try {
      const [seatData, holds] = await Promise.all([
        api.getSeats(eventId),
        api.getActiveHolds(userId),
      ]);

      if (!active) return;

      setSeats(seatData);

      // Find the active hold for this event.
      const activeHold = holds.find((hold) =>
        seatData.some((seat) => seat.id === hold.id)
      );

      if (activeHold) {
        setHeldSeat({
          ...activeHold,
          userId,
        });

        setSelectedSeat(activeHold);
      } else {
        setHeldSeat(null);
        setSelectedSeat(null);
      }
    } catch (err) {
      if (active) setError(err.message);
    }
  }

  loadInitialData();

  return () => {
    active = false;
  };
}, [eventId, userId]);


  // Refresh seat availability every 5 seconds.
  useEffect(() => {
    const interval = setInterval(() => {
      loadSeats().catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [loadSeats]);

  // Tick the clock every second, only while a seat is held.
  useEffect(() => {
    if (!heldSeat) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, [heldSeat]);

  // Remaining hold time, derived during render (no extra state).
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

      // Read the real expiry from the backend.
      const updatedSeats = await api.getSeats(eventId);
      setSeats(updatedSeats);

      const updated = updatedSeats.find(
        (seat) => seat.id === selectedSeat.id
      );

      if (updated?.status === "HELD") {
        setNow(Date.now());
        setHeldSeat({
          ...updated,
          userId,
        });
        setMessage("Seat held successfully!");
      }
    } catch (err) {
      setError(err.message);
      await loadSeats().catch(() => {});
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

      setMessage(`Booking #${booking.id} confirmed successfully!`);
      setHeldSeat(null);
      setSelectedSeat(null);
      await loadSeats();
    } catch (err) {
      setError(err.message);
      await loadSeats().catch(() => {});
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
      setMessage("Seat hold released.");
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

  return (
    <main className="container">
      <h1>Select Your Seat</h1>
      <p className="subtitle">
        Event #{eventId} · Choose an available seat.
      </p>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <SeatGrid
        seats={seats}
        selectedSeat={selectedSeat}
        onSelect={setSelectedSeat}
      />

      <div className="booking-panel">
        {heldSeat ? (
          <>
            <h2>Seat {heldSeat.seatNumber} is held</h2>
            <p>Confirm before your hold expires.</p>

            <div className="timer">{formatTime(remaining)}</div>

            {remaining === 0 && (
              <p className="error">Your hold has expired.</p>
            )}

            <div className="actions">
              <button
                className="btn"
                disabled={busy || remaining === 0}
                onClick={confirmBooking}
              >
                Confirm Booking
              </button>

              <button
                className="btn btn-outline"
                disabled={busy}
                onClick={releaseHold}
              >
                Release Seat
              </button>

              {remaining === 0 && (
                <button
                  className="btn btn-outline"
                  onClick={chooseAnotherSeat}
                >
                  Choose Another Seat
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <h2>
              {selectedSeat
                ? `Selected: ${selectedSeat.seatNumber}`
                : "No seat selected"}
            </h2>

            <p>Your seat will be held for 2 minutes.</p>

            <button
              className="btn"
              disabled={!selectedSeat || busy}
              onClick={holdSeat}
            >
              Hold Seat
            </button>
          </>
        )}
      </div>
    </main>
  );
}