
import { useMemo } from "react";
import type { FurnitureItem } from "../types/Project";

interface Props {
  furniture: FurnitureItem[];
}

const STORAGE_KEY = "interior-ai-room-assignments";

const DEFAULT_ROOMS = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Dining Room",
  "Office",
];

function FurnitureRoomAnalytics({ furniture }: Props) {
  const roomData = useMemo(() => {
    let rooms = [...DEFAULT_ROOMS];
    let assignments: Record<string, string> = {};

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed.rooms)) {
          rooms = Array.from(
            new Set([
              ...DEFAULT_ROOMS,
              ...parsed.rooms.filter(
                (room: unknown): room is string =>
                  typeof room === "string" && room.trim() !== ""
              ),
            ])
          );
        }

        if (
          parsed.assignments &&
          typeof parsed.assignments === "object" &&
          !Array.isArray(parsed.assignments)
        ) {
          assignments = parsed.assignments;
        }
      }
    } catch {
      // Use default rooms if saved data cannot be read.
    }

    const distribution = rooms.map((room) => ({
      room,
      count: furniture.filter(
        (item) => assignments[String(item.id)] === room
      ).length,
    }));

    const assignedItems = furniture.filter((item) => {
      const room = assignments[String(item.id)];
      return typeof room === "string" && room.trim() !== "";
    });

    const categoryCounts: Record<string, number> = {};

    furniture.forEach((item) => {
      const category =
        typeof item.category === "string" && item.category.trim()
          ? item.category
          : "Other";

      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const sortedRooms = [...distribution].sort(
      (a, b) => b.count - a.count
    );

    const mostUsedRoom =
      sortedRooms.find((room) => room.count > 0)?.room || "None";

    const leastUsedRoom =
      [...distribution]
        .filter((room) => room.count > 0)
        .sort((a, b) => a.count - b.count)[0]?.room || "None";

    return {
      distribution,
      assignedCount: assignedItems.length,
      unassignedCount: furniture.length - assignedItems.length,
      categoryCounts,
      mostUsedRoom,
      leastUsedRoom,
    };
  }, [furniture]);

  const total = furniture.length;

  const getPercentage = (count: number) =>
    total === 0 ? 0 : Math.round((count / total) * 100);

  const cardStyle: React.CSSProperties = {
    padding: "18px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
  };

  const progressStyle: React.CSSProperties = {
    height: "10px",
    background: "#e5e7eb",
    borderRadius: "20px",
    overflow: "hidden",
    marginTop: "8px",
  };

  return (
    <section
      style={{
        padding: "24px",
        margin: "20px 0",
        background: "#ffffff",
        color: "#1f2937",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        Furniture Room Analytics Dashboard
      </h2>

      <p style={{ color: "#6b7280" }}>
        Understand how your furniture is distributed throughout your home.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          margin: "20px 0",
        }}
      >
        <div style={cardStyle}>
          <span style={{ color: "#6b7280", fontSize: "13px" }}>
            Total Furniture
          </span>
          <h2 style={{ color: "#2563eb", marginBottom: 0 }}>
            {total}
          </h2>
        </div>

        <div style={cardStyle}>
          <span style={{ color: "#6b7280", fontSize: "13px" }}>
            Assigned
          </span>
          <h2 style={{ color: "#16a34a", marginBottom: 0 }}>
            {roomData.assignedCount}
          </h2>
        </div>

        <div style={cardStyle}>
          <span style={{ color: "#6b7280", fontSize: "13px" }}>
            Unassigned
          </span>
          <h2 style={{ color: "#d97706", marginBottom: 0 }}>
            {roomData.unassignedCount}
          </h2>
        </div>

        <div style={cardStyle}>
          <span style={{ color: "#6b7280", fontSize: "13px" }}>
            Assignment Rate
          </span>
          <h2 style={{ color: "#7c3aed", marginBottom: 0 }}>
            {getPercentage(roomData.assignedCount)}%
          </h2>
        </div>
      </div>

      <h3>Room Distribution</h3>

      {roomData.distribution.map(({ room, count }) => (
        <div key={room} style={{ marginBottom: "18px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <strong>{room}</strong>
            <span style={{ color: "#6b7280" }}>
              {count} items · {getPercentage(count)}%
            </span>
          </div>

          <div style={progressStyle}>
            <div
              style={{
                width: `${getPercentage(count)}%`,
                height: "100%",
                background: "#2563eb",
                borderRadius: "20px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      ))}

      <h3 style={{ marginTop: "28px" }}>
        Furniture Category Breakdown
      </h3>

      {Object.entries(roomData.categoryCounts).length === 0 && (
        <p style={{ color: "#9ca3af" }}>
          No furniture categories available yet.
        </p>
      )}

      {Object.entries(roomData.categoryCounts).map(
        ([category, count]) => (
          <div
            key={category}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px",
              marginBottom: "8px",
              background: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <span>{category}</span>
            <strong>{count}</strong>
          </div>
        )
      )}

      <h3 style={{ marginTop: "28px" }}>
        Room Insights
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        <div
          style={{
            ...cardStyle,
            background: "#f0fdf4",
          }}
        >
          <p style={{ color: "#6b7280", marginTop: 0 }}>
            Most Used Room
          </p>
          <h3 style={{ color: "#15803d", marginBottom: 0 }}>
            {roomData.mostUsedRoom}
          </h3>
        </div>

        <div
          style={{
            ...cardStyle,
            background: "#eff6ff",
          }}
        >
          <p style={{ color: "#6b7280", marginTop: 0 }}>
            Least Used Room
          </p>
          <h3 style={{ color: "#1d4ed8", marginBottom: 0 }}>
            {roomData.leastUsedRoom}
          </h3>
        </div>
      </div>

      {total === 0 && (
        <p
          style={{
            marginTop: "20px",
            padding: "14px",
            background: "#fffbeb",
            borderRadius: "8px",
            color: "#92400e",
          }}
        >
          Add furniture to your project to see room analytics.
        </p>
      )}
    </section>
  );
}

export default FurnitureRoomAnalytics;
