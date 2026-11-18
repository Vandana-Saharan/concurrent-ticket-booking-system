
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
    return <p className="error">Error: {error}</p>;
  }

  if (!userId) {
    return <p>Loading users...</p>;
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
