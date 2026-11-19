import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE_ASC");

  useEffect(() => {
    api.getEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Compute categories from data
  const categories = useMemo(() => {
    const cats = new Set(events.map((e) => e.category).filter(Boolean));
    return ["ALL", ...Array.from(cats)];
  }, [events]);

  // Filtered & sorted events
  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        const matchesCategory =
          selectedCategory === "ALL" || event.category === selectedCategory;
        const matchesSearch =
          searchQuery.trim() === "" ||
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (event.description &&
            event.description.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "PRICE_ASC") return a.ticketPrice - b.ticketPrice;
        if (sortBy === "PRICE_DESC") return b.ticketPrice - a.ticketPrice;
        if (sortBy === "RATING_DESC") return (b.rating || 0) - (a.rating || 0);
        return new Date(a.eventTime) - new Date(b.eventTime);
      });
  }, [events, selectedCategory, searchQuery, sortBy]);

  function formatEventDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getCategoryIcon(cat) {
    switch (cat?.toUpperCase()) {
      case "MOVIE":
        return "🎬";
      case "CONCERT":
        return "🎸";
      case "COMEDY":
        return "🎤";
      case "THEATRE":
        return "🎭";
      case "CONFERENCE":
        return "💡";
      default:
        return "🎟️";
    }
  }

  if (loading) {
    return (
      <main className="container">
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>Loading Upcoming Events...</h2>
          <p>Fetching real-time event inventory and schedule.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container">
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <div>
            <h3>Failed to load events</h3>
            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      {/* Hero Section */}
      <section className="hero-banner">
        <div className="hero-badge">
          <span className="pulse-dot"></span>
          <span>Concurrency-Protected Live Ticketing</span>
        </div>
        <h1 className="hero-title">
          Book Premier Shows, <br />
          <span className="gradient-text">Zero Double-Booking Worries</span>
        </h1>
        <p className="hero-subtitle">
          Experience ultra-safe concurrent seat selection. When you hold a seat,
          PostgreSQL locks it atomically for 2 minutes — no conflicts, no surprise losses.
        </p>

        {/* Feature Highlights */}
        <div className="hero-stats">
          <div className="stat-pill">
            <span className="stat-icon">⚡</span>
            <span><strong>2-Min</strong> Atomic Hold</span>
          </div>
          <div className="stat-pill">
            <span className="stat-icon">🛡️</span>
            <span><strong>PostgreSQL</strong> Row Lock</span>
          </div>
          <div className="stat-pill">
            <span className="stat-icon">🎪</span>
            <span><strong>{events.length}</strong> Live Events</span>
          </div>
          <div className="stat-pill">
            <span className="stat-icon">👥</span>
            <span>Multi-User Demo Ready</span>
          </div>
        </div>
      </section>

      {/* Search and Filters Bar */}
      <section className="controls-card">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by event title, venue, or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="controls-row">
          {/* Category Tabs */}
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                <span>{cat === "ALL" ? "✨ All" : `${getCategoryIcon(cat)} ${cat}`}</span>
                {cat === "ALL" && (
                  <span className="count-tag">{events.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="sort-box">
            <label htmlFor="sortBy">Sort by:</label>
            <select
              id="sortBy"
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="DATE_ASC">📅 Earliest Date</option>
              <option value="PRICE_ASC">💰 Price: Low to High</option>
              <option value="PRICE_DESC">💎 Price: High to Low</option>
              <option value="RATING_DESC">⭐ Top Rated</option>
            </select>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="events-section">
        <div className="section-header">
          <h2>Featured Events ({filteredEvents.length})</h2>
          <span className="section-subtext">Click any event to inspect seat map and hold your seat</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎭</div>
            <h3>No events found</h3>
            <p>We couldn't find any events matching "{searchQuery}" in this category.</p>
            <button
              className="btn btn-outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="event-grid">
            {filteredEvents.map((event) => (
              <article className="event-card" key={event.id}>
                {/* Poster Image Container */}
                <div className="event-poster-wrap">
                  <img
                    src={event.imageUrl || "/events/avengers.jpg"}
                    alt={event.title}
                    className="event-poster"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80";
                    }}
                  />
                  <div className="poster-overlay"></div>

                  {/* Badges on Poster */}
                  <div className="poster-top-bar">
                    <span className="category-badge">
                      {getCategoryIcon(event.category)} {event.category || "Event"}
                    </span>
                    {event.rating && (
                      <span className="rating-badge">
                        ⭐ {Number(event.rating).toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="poster-bottom-bar">
                    <span className="price-tag-overlay">
                      ₹{event.ticketPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Event Body Details */}
                <div className="event-card-body">
                  <h3 className="event-title" title={event.title}>
                    {event.title}
                  </h3>

                  <div className="event-meta-list">
                    <div className="meta-item">
                      <span className="meta-icon">📍</span>
                      <span className="meta-text">{event.venue}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">📅</span>
                      <span className="meta-text">{formatEventDate(event.eventTime)}</span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}

                  {/* Action Footer */}
                  <div className="event-card-footer">
                    <div className="price-block">
                      <span className="price-label">Starts at</span>
                      <span className="price-value">₹{event.ticketPrice.toLocaleString("en-IN")}</span>
                    </div>

                    <Link
                      to={`/events/${event.id}/seats`}
                      className="btn btn-primary btn-book"
                    >
                      <span>Select Seats</span>
                      <span className="arrow-icon">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
