
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import EventsPage from "./pages/EventsPage";
import SeatsPage from "./pages/SeatsPage";
import MyBookingsPage from "./pages/MyBookingsPage";

import { api } from "./services/api";

export default function App() {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getUsers()
      .then((data) => {
        setUsers(data);
        if (data.length > 0) {
          setUserId(data[0].id);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <main className="container">
        <div className="notice-banner error">
          <span className="notice-icon">⚠️</span>
          <div>
            <h3>Error connecting to server</h3>
            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="container">
        <div className="loading-state">
          <div className="spinner"></div>
          <h2>Initializing TicketPulse...</h2>
          <p>Connecting to demo users and backend services.</p>
        </div>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <Navbar
        userId={userId}
        users={users}
        onUserChange={setUserId}
      />

      <Routes>
        <Route path="/" element={<EventsPage />} />

        <Route
          path="/events/:eventId/seats"
          element={<SeatsPage key={userId} userId={userId} />}
        />

        <Route
          path="/bookings"
          element={<MyBookingsPage userId={userId} />}
        />
      </Routes>
    </BrowserRouter>
  );
}
