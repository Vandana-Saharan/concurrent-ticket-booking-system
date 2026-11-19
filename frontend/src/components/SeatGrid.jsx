import { useMemo } from "react";

export default function SeatGrid({
  seats,
  selectedSeat,
  onSelect,
}) {
  // Group seats by their row letter (e.g. 'A', 'B', 'C', 'D')
  const rows = useMemo(() => {
    const map = new Map();

    seats.forEach((seat) => {
      // First character is row letter
      const rowLetter = seat.seatNumber.charAt(0);
      if (!map.has(rowLetter)) {
        map.set(rowLetter, []);
      }
      map.get(rowLetter).push(seat);
    });

    // Sort row letters alphabetically and seats by seat number
    const sortedRows = Array.from(map.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    return sortedRows.map(([rowLetter, seatList]) => {
      seatList.sort((a, b) => {
        const numA = parseInt(a.seatNumber.slice(1), 10) || 0;
        const numB = parseInt(b.seatNumber.slice(1), 10) || 0;
        return numA - numB;
      });

      return {
        rowLetter,
        seats: seatList,
      };
    });
  }, [seats]);

  return (
    <div className="seat-section">
      {/* Screen / Stage Visual Representation */}
      <div className="stage-container">
        <div className="stage-glow"></div>
        <div className="stage-bar">
          <span className="stage-icon">🎬</span>
          <span className="stage-text">SCREEN / STAGE THIS WAY</span>
        </div>
        <div className="stage-shadow"></div>
      </div>

      {/* Seats Matrix grouped by Rows */}
      <div className="theater-seating-matrix">
        {rows.map(({ rowLetter, seats: rowSeats }) => {
          // Split into two halves to create a central aisle if > 3 seats
          const midpoint = Math.ceil(rowSeats.length / 2);
          const leftBlock = rowSeats.slice(0, midpoint);
          const rightBlock = rowSeats.slice(midpoint);

          return (
            <div className="seating-row" key={rowLetter}>
              <div className="row-label left">{rowLetter}</div>

              <div className="row-block">
                <div className="seat-cluster">
                  {leftBlock.map((seat) => {
                    const isSelected = selectedSeat?.id === seat.id;
                    const isAvailable = seat.status === "AVAILABLE";
                    const isHeld = seat.status === "HELD";
                    const isBooked = seat.status === "BOOKED";

                    let statusClass = "available";
                    let statusLabel = "Available";
                    if (isHeld) {
                      statusClass = "held";
                      statusLabel = "Held by another user";
                    } else if (isBooked) {
                      statusClass = "booked";
                      statusLabel = "Booked";
                    }

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => onSelect(seat)}
                        className={`theater-seat ${statusClass} ${
                          isSelected ? "selected" : ""
                        }`}
                        title={`Seat ${seat.seatNumber} • ${
                          isSelected ? "Selected" : statusLabel
                        }`}
                        aria-label={`Seat ${seat.seatNumber}, ${statusLabel}`}
                      >
                        <div className="seat-cushion">
                          <span className="seat-indicator">
                            {isSelected ? "✓" : isHeld ? "🔒" : isBooked ? "✕" : "▣"}
                          </span>
                          <span className="seat-num">{seat.seatNumber}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Central Aisle */}
                <div className="center-aisle" aria-hidden="true">
                  <span className="aisle-guide">AISLE</span>
                </div>

                <div className="seat-cluster">
                  {rightBlock.map((seat) => {
                    const isSelected = selectedSeat?.id === seat.id;
                    const isAvailable = seat.status === "AVAILABLE";
                    const isHeld = seat.status === "HELD";
                    const isBooked = seat.status === "BOOKED";

                    let statusClass = "available";
                    let statusLabel = "Available";
                    if (isHeld) {
                      statusClass = "held";
                      statusLabel = "Held by another user";
                    } else if (isBooked) {
                      statusClass = "booked";
                      statusLabel = "Booked";
                    }

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => onSelect(seat)}
                        className={`theater-seat ${statusClass} ${
                          isSelected ? "selected" : ""
                        }`}
                        title={`Seat ${seat.seatNumber} • ${
                          isSelected ? "Selected" : statusLabel
                        }`}
                        aria-label={`Seat ${seat.seatNumber}, ${statusLabel}`}
                      >
                        <div className="seat-cushion">
                          <span className="seat-indicator">
                            {isSelected ? "✓" : isHeld ? "🔒" : isBooked ? "✕" : "▣"}
                          </span>
                          <span className="seat-num">{seat.seatNumber}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="row-label right">{rowLetter}</div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="seat-legend-card">
        <div className="legend-item">
          <span className="legend-swatch available"></span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch selected"></span>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch held"></span>
          <span>Held (2-Min Lock)</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch booked"></span>
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
}
