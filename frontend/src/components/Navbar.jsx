import { NavLink } from "react-router-dom";

export default function Navbar({ userId, users, onUserChange }) {
  const currentUser = users.find((u) => u.id === userId) || users[0];
  const otherUser = users.find((u) => u.id !== userId);

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <NavLink to="/" className="brand">
            <span className="brand-logo-badge">🎟️</span>
            <div className="brand-text">
              <span className="brand-title">TicketPulse</span>
              <span className="brand-tagline">Concurrent Safe Booking</span>
            </div>
          </NavLink>

          <nav className="nav-links">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">🎪</span>
              <span>All Events</span>
            </NavLink>
            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">🧾</span>
              <span>My Bookings</span>
            </NavLink>
          </nav>
        </div>

        <div className="navbar-right">
          <div className="demo-badge">
            <span className="demo-dot"></span>
            <span>Zero-Conflict Engine</span>
          </div>

          <div className="user-profile-widget">
            <div className="user-avatar" title={`Logged in as ${currentUser?.name || "User"}`}>
              {currentUser?.name ? currentUser.name.split(" ").map(n => n[0]).join("") : "U"}
            </div>
            <div className="user-info">
              <span className="user-role-label">Active User</span>
              <span className="user-name-display">{currentUser?.name || "User A"}</span>
            </div>

            <select
              className="user-select-dropdown"
              value={userId || ""}
              onChange={(e) => onUserChange(Number(e.target.value))}
              aria-label="Select demo user"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            {otherUser && (
              <button
                type="button"
                className="switch-user-btn"
                onClick={() => onUserChange(otherUser.id)}
                title={`Quick switch to ${otherUser.name}`}
              >
                ⇄ Switch to {otherUser.name}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
