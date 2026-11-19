
const BASE_URL = "/api";

async function request(path, options = {}) {
  const response = await fetch(BASE_URL + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const error = await response.json();
      message = error.message || message;
    } catch {
      // Use the default message
    }

    throw new Error(message);
  }

  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  getUsers: () => request("/users"),

  getEvents: () => request("/events"),

  getEvent: (eventId) => request(`/events/${eventId}`),

  getSeats: (eventId) =>
    request(`/events/${eventId}/seats`),

  holdSeat: (seatId, userId) =>
    request(`/seats/${seatId}/hold`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  confirmBooking: (seatId, userId) =>
    request(`/seats/${seatId}/confirm`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  releaseHold: (seatId, userId) =>
    request(`/seats/${seatId}/hold?userId=${userId}`, {
      method: "DELETE",
    }),

getActiveHolds: (userId) =>
  request(`/users/${userId}/holds`),


  getBookings: (userId) =>
    request(`/users/${userId}/bookings`),

  cancelBooking: (bookingId, userId) =>
    request(`/bookings/${bookingId}?userId=${userId}`, {
      method: "DELETE",
    }),
};
