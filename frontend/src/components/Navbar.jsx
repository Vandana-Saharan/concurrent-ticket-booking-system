
import { NavLink } from "react-router-dom";

export default function Navbar({ userId, users, onUserChange }) {
  return (
    <header className="navbar">
      <NavLink to="/" className="brand">
        🎟️ Ticket Booking
      </NavLink>

      <nav className="nav-links">
        <NavLink to="/">Events</NavLink>
        <NavLink to="/bookings">My Bookings</NavLink>
      </nav>

      <select
        value={userId}
        onChange={(e) => onUserChange(Number(e.target.value))}
        aria-label="Select demo user"
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </header>
  );
}
