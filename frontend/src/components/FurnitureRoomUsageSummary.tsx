
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

function FurnitureRoomUsageSummary({ furniture }: Props) {
  const assignments = useMemo(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return {};

      const parsed = JSON.parse(saved);

      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.assignments &&
        typeof parsed.assignments === "object"
      ) {
        return parsed.assignments as Record<string, string>;
      }

      return {};
    } catch {
      return {};
    }
  }, []);

  const rooms = useMemo(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return DEFAULT_ROOMS;

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed?.rooms)) {
        return Array.from(
          new Set([
            ...DEFAULT_ROOMS,
            ...parsed.rooms.filter(
              (room: unknown): room is string =>
                typeof room === "string" && room.trim().length > 0
            ),
          ])
        );
      }

      return DEFAULT_ROOMS;
    } catch {
      return DEFAULT_ROOMS;
    }
  }, []);

  const roomCounts = rooms.map((room) => ({
    room,
    items: furniture.filter(
      (item) => assignments[String(item.id)] === room
    ),
  }));

  const assignedCount = furniture.filter(
    (item) => {
      const room = assignments[String(item.id)];
      return typeof room === "string" && room.trim() !== "";
    }
  ).length;

  const unassignedCount = furniture.length - assignedCount;

  const percentage = (count: number) =>
    furniture.length === 0
      ? 0
      : Math.round((count / furniture.length) * 100);

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
        Furniture Room Usage Summary
      </h2>

      <p style={{ color: "#6b7280" }}>
        Overview of how your furniture is distributed across rooms.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <SummaryCard
          title="Total Furniture"
          value={furniture.length}
          color="#2563eb"
        />

        <SummaryCard
          title="Assigned"
          value={assignedCount}
          color="#16a34a"
        />

        <SummaryCard
          title="Unassigned"
          value={unassignedCount}
          color="#d97706"
        />

        <SummaryCard
          title="Rooms"
          value={rooms.length}
          color="#7c3aed"
        />
      </div>

      <h3>Room Distribution</h3>

      {roomCounts.map(({ room, items }) => {
        const roomPercentage = percentage(items.length);

        return (
          <div
            key={room}
            style={{
              padding: "14px",
              marginBottom: "12px",
              background: "#f9fafb",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <strong>{room}</strong>

              <span style={{ color: "#6b7280" }}>
                {items.length} items ({roomPercentage}%)
              </span>
            </div>

            <div
              style={{
                height: "10px",
                background: "#e5e7eb",
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${roomPercentage}%`,
                  height: "100%",
                  background: "#2563eb",
                  borderRadius: "20px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            {items.length > 0 && (
              <p
                style={{
                  marginBottom: 0,
                  marginTop: "10px",
                  color: "#4b5563",
                  fontSize: "13px",
                }}
              >
                {items
                  .map((item) => item.name)
                  .join(", ")}
              </p>
            )}

            {items.length === 0 && (
              <p
                style={{
                  marginBottom: 0,
                  marginTop: "10px",
                  color: "#9ca3af",
                  fontSize: "13px",
                }}
              >
                No furniture assigned yet.
              </p>
            )}
          </div>
        );
      })}

      <div
        style={{
          marginTop: "18px",
          padding: "14px",
          background: "#eff6ff",
          borderRadius: "10px",
        }}
      >
        <strong>Assignment Progress</strong>

        <p style={{ marginBottom: "8px" }}>
          {percentage(assignedCount)}% of your furniture has been assigned.
        </p>

        <div
          style={{
            height: "12px",
            background: "#dbeafe",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percentage(assignedCount)}%`,
              height: "100%",
              background: "#16a34a",
              borderRadius: "20px",
            }}
          />
        </div>
      </div>
    </section>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  color: string;
}

function SummaryCard({
  title,
  value,
  color,
}: SummaryCardProps) {
  return (
    <div
      style={{
        padding: "18px",
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#6b7280",
          fontSize: "13px",
        }}
      >
        {title}
      </p>

      <h2
        style={{
          margin: "8px 0 0",
          color,
          fontSize: "28px",
        }}
      >
        {value}
      </h2>
    </div>
  );
}

export default FurnitureRoomUsageSummary;
