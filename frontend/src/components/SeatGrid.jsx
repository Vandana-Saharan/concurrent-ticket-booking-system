
export default function SeatGrid({
  seats,
  selectedSeat,
  onSelect,
}) {
  return (
    <div className="seat-section">
      <div className="screen">SCREEN / STAGE</div>

      <div className="seat-grid">
        {seats.map((seat) => {
          const selected = selectedSeat?.id === seat.id;
          const available = seat.status === "AVAILABLE";

          return (
            <button
              key={seat.id}
              disabled={!available}
              onClick={() => onSelect(seat)}
              className={[
                "seat",
                seat.status.toLowerCase(),
                selected ? "selected" : "",
              ].join(" ")}
              title={`${seat.seatNumber}: ${seat.status}`}
            >
              <span>▣</span>
              <small>{seat.seatNumber}</small>
            </button>
          );
        })}
      </div>

      <div className="legend">
        <span>🟢 Available</span>
        <span>🟡 Held</span>
        <span>🔴 Booked</span>
        <span>🔵 Selected</span>
      </div>
    </div>
  );
}
