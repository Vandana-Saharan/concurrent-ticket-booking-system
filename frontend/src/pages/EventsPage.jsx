
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading events...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <main className="container">
      <h1>Available Events</h1>
      <p className="subtitle">
        Choose an event to view and book seats.
      </p>

      <div className="event-grid">
        {events.map((event) => (
          <div className="card" key={event.id}>
            <div className="event-art">🎫</div>

            <h2>{event.title}</h2>
            <p>📍 {event.venue}</p>
            <p>
              📅 {new Date(event.eventTime).toLocaleString()}
            </p>

            <h3>₹{event.ticketPrice}</h3>

            <Link
              className="btn"
              to={`/events/${event.id}/seats`}
            >
              View Seats
            </Link>
          </div>
        ))}
      </div>

      {events.length === 0 && <p>No events available.</p>}
    </main>
  );
}
