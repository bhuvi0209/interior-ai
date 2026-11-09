
import { useEffect, useMemo, useState } from "react";
import type { FurnitureItem } from "../types/Project";

interface Props {
  furniture: FurnitureItem[];
}

interface Activity {
  id: string;
  furnitureId: string;
  furnitureName: string;
  category: string;
  previousRoom: string;
  newRoom: string;
  date: string;
}

const HISTORY_KEY = "interior-ai-room-activity-history";
const ASSIGNMENT_KEY = "interior-ai-room-assignments";

function FurnitureRoomActivityHistory({ furniture }: Props) {
  const [history, setHistory] = useState<Activity[]>([]);
  const [search, setSearch] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("All");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      setMessage("Unable to save activity history.");
    }
  }, [history]);

  const readAssignments = (): Record<string, string> => {
    try {
      const saved = localStorage.getItem(ASSIGNMENT_KEY);

      if (!saved) return {};

      const parsed = JSON.parse(saved);

      if (
        parsed &&
        typeof parsed.assignments === "object" &&
        parsed.assignments !== null &&
        !Array.isArray(parsed.assignments)
      ) {
        return parsed.assignments;
      }

      return {};
    } catch {
      return {};
    }
  };

  const recordActivity = (item: FurnitureItem) => {
    const assignments = readAssignments();
    const newRoom = assignments[String(item.id)];

    if (typeof newRoom !== "string" || !newRoom.trim()) {
      setMessage("Assign this furniture to a room before recording activity.");
      return;
    }

    const previousActivity = history.find(
      (activity) => activity.furnitureId === String(item.id)
    );

    const previousRoom = previousActivity?.newRoom || "Unassigned";

    if (previousRoom === newRoom) {
      setMessage("This furniture is already recorded in that room.");
      return;
    }

    const activity: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      furnitureId: String(item.id),
      furnitureName: String(item.name || "Unnamed Furniture"),
      category: String(item.category || "Other"),
      previousRoom,
      newRoom,
      date: new Date().toISOString(),
    };

    setHistory((current) => [activity, ...current]);
    setMessage("Activity recorded successfully.");
  };

  const filteredHistory = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return history.filter((activity) => {
      const matchesSearch =
        activity.furnitureName.toLowerCase().includes(searchText) ||
        activity.category.toLowerCase().includes(searchText) ||
        activity.previousRoom.toLowerCase().includes(searchText) ||
        activity.newRoom.toLowerCase().includes(searchText);

      const matchesRoom =
        selectedRoom === "All" ||
        activity.newRoom === selectedRoom ||
        activity.previousRoom === selectedRoom;

      return matchesSearch && matchesRoom;
    });
  }, [history, search, selectedRoom]);

  const rooms = useMemo(() => {
    return Array.from(
      new Set(
        history.flatMap((activity) => [
          activity.previousRoom,
          activity.newRoom,
        ])
      )
    );
  }, [history]);

  const deleteActivity = (id: string) => {
    setHistory((current) =>
      current.filter((activity) => activity.id !== id)
    );
    setMessage("Activity deleted.");
  };

  const clearHistory = () => {
    if (!window.confirm("Are you sure you want to clear all activity history?")) {
      return;
    }

    setHistory([]);
    setMessage("All activity history cleared.");
  };

  const exportCSV = () => {
    if (history.length === 0) {
      setMessage("There is no activity history to export.");
      return;
    }

    const headers = [
      "Furniture Name",
      "Category",
      "Previous Room",
      "New Room",
      "Date",
    ];

    const rows = history.map((activity) => [
      activity.furnitureName,
      activity.category,
      activity.previousRoom,
      activity.newRoom,
      new Date(activity.date).toLocaleString(),
    ]);

    const escapeCSV = (value: string) =>
      `"${value.replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-room-activity-history.csv";
    link.click();

    URL.revokeObjectURL(url);
    setMessage("Activity history exported.");
  };

  const buttonStyle: React.CSSProperties = {
    padding: "9px 14px",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: 600,
  };

  return (
    <section
      style={{
        padding: "24px",
        margin: "20px 0",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        color: "#1f2937",
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        Furniture Room Activity History
      </h2>

      <p style={{ color: "#6b7280" }}>
        Record and review furniture room assignment activities.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          margin: "20px 0",
        }}
      >
        <div style={{ padding: "16px", background: "#eff6ff", borderRadius: "9px" }}>
          <span style={{ color: "#6b7280", fontSize: "13px" }}>
            Total Activities
          </span>
          <h2 style={{ color: "#2563eb", marginBottom: 0 }}>
            {history.length}
          </h2>
        </div>

        <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: "9px" }}>
          <span style={{ color: "#6b7280", fontSize: "13px" }}>
            Furniture Items
          </span>
          <h2 style={{ color: "#16a34a", marginBottom: 0 }}>
            {furniture.length}
          </h2>
        </div>
      </div>

      <h3>Record a Room Assignment</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {furniture.map((item) => (
          <div
            key={String(item.id)}
            style={{
              padding: "12px",
              border: "1px solid #e5e7eb",
              borderRadius: "9px",
            }}
          >
            <strong>{item.name}</strong>

            <p style={{ color: "#6b7280", fontSize: "13px" }}>
              {item.category}
            </p>

            <button
              type="button"
              onClick={() => recordActivity(item)}
              style={{
                ...buttonStyle,
                background: "#2563eb",
                color: "#ffffff",
              }}
            >
              Record Activity
            </button>
          </div>
        ))}
      </div>

      <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e5e7eb" }} />

      <h3>Activity History</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "10px",
          marginBottom: "18px",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search furniture or room..."
          style={{
            padding: "11px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            minWidth: 0,
          }}
        />

        <select
          value={selectedRoom}
          onChange={(event) => setSelectedRoom(event.target.value)}
          style={{
            padding: "11px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
          }}
        >
          <option value="All">All Rooms</option>
          {rooms.map((room) => (
            <option key={room} value={room}>
              {room}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "18px" }}>
        <button
          type="button"
          onClick={exportCSV}
          style={{ ...buttonStyle, background: "#16a34a", color: "#ffffff" }}
        >
          Export CSV
        </button>

        <button
          type="button"
          onClick={clearHistory}
          style={{ ...buttonStyle, background: "#dc2626", color: "#ffffff" }}
        >
          Clear History
        </button>
      </div>

      {message && (
        <p
          role="status"
          style={{
            padding: "10px",
            background: "#eff6ff",
            borderRadius: "7px",
            color: "#1d4ed8",
          }}
        >
          {message}
        </p>
      )}

      {filteredHistory.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>
          No matching activities found. Record an activity above after assigning furniture to a room.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {filteredHistory.map((activity) => (
            <div
              key={activity.id}
              style={{
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                background: "#f9fafb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>{activity.furnitureName}</strong>

                  <p style={{ margin: "6px 0", color: "#6b7280" }}>
                    {activity.category}
                  </p>

                  <p style={{ margin: "6px 0" }}>
                    {activity.previousRoom} → {activity.newRoom}
                  </p>

                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {new Date(activity.date).toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => deleteActivity(activity.id)}
                  style={{
                    ...buttonStyle,
                    background: "#fee2e2",
                    color: "#b91c1c",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default FurnitureRoomActivityHistory;
