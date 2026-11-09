
import { useEffect, useMemo, useState } from "react";
import type { FurnitureItem } from "../types/Project";

interface Props {
  furniture: FurnitureItem[];
}

interface Reminder {
  id: string;
  resolved: boolean;
}

const STORAGE_KEY = "interior-ai-room-assignments";
const REMINDER_KEY = "interior-ai-room-notifications";

function FurnitureRoomNotifications({ furniture }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [message, setMessage] = useState("");

  const [assignments, setAssignments] = useState<Record<string, string>>(
    {}
  );

  // Load room assignments and saved reminders.
  useEffect(() => {
    try {
      const savedAssignments = localStorage.getItem(STORAGE_KEY);

      if (savedAssignments) {
        const parsed = JSON.parse(savedAssignments);

        if (
          parsed &&
          parsed.assignments &&
          typeof parsed.assignments === "object" &&
          !Array.isArray(parsed.assignments)
        ) {
          setAssignments(parsed.assignments);
        }
      }
    } catch {
      setAssignments({});
    }

    try {
      const savedReminders = localStorage.getItem(REMINDER_KEY);

      if (savedReminders) {
        const parsed = JSON.parse(savedReminders);

        if (Array.isArray(parsed)) {
          setReminders(
            parsed.filter(
              (item): item is Reminder =>
                item &&
                typeof item.id === "string" &&
                typeof item.resolved === "boolean"
            )
          );
        }
      }
    } catch {
      setReminders([]);
    }
  }, []);

  // Save reminder status.
  useEffect(() => {
    try {
      localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
    } catch {
      setMessage("Unable to save notification status.");
    }
  }, [reminders]);

  const unassignedFurniture = useMemo(() => {
    return furniture.filter((item) => {
      const room = assignments[String(item.id)];

      return typeof room !== "string" || room.trim() === "";
    });
  }, [furniture, assignments]);

  const assignedCount = furniture.length - unassignedFurniture.length;

  const completionPercentage =
    furniture.length === 0
      ? 0
      : Math.round((assignedCount / furniture.length) * 100);

  const filteredFurniture = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return furniture.filter((item) => {
      const name = String(item.name || "");
      const category = String(item.category || "");
      const room = assignments[String(item.id)];
      const isAssigned =
        typeof room === "string" && room.trim() !== "";

      const matchesSearch =
        name.toLowerCase().includes(searchText) ||
        category.toLowerCase().includes(searchText);

      const matchesFilter =
        filter === "All" ||
        (filter === "Assigned" && isAssigned) ||
        (filter === "Unassigned" && !isAssigned);

      return matchesSearch && matchesFilter;
    });
  }, [furniture, assignments, search, filter]);

  const getReminder = (id: string) =>
    reminders.find((item) => item.id === id);

  const toggleReminder = (id: string) => {
    setReminders((current) => {
      const existing = current.find((item) => item.id === id);

      if (existing) {
        return current.map((item) =>
          item.id === id
            ? { ...item, resolved: !item.resolved }
            : item
        );
      }

      return [...current, { id, resolved: true }];
    });

    setMessage("Reminder status updated.");
  };

  const pendingReminders = reminders.filter(
    (item) => !item.resolved
  ).length;

  const createReminders = () => {
    setReminders((current) => {
      const updated = [...current];

      unassignedFurniture.forEach((item) => {
        const id = String(item.id);
        const existing = updated.find((reminder) => reminder.id === id);

        if (!existing) {
          updated.push({
            id,
            resolved: false,
          });
        }
      });

      return updated;
    });

    setMessage("Reminders created for unassigned furniture.");
  };

  const cardStyle: React.CSSProperties = {
    padding: "18px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "9px 13px",
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
        Furniture Room Assignment Notifications
      </h2>

      <p style={{ color: "#6b7280" }}>
        Keep track of furniture that still needs a room assignment.
      </p>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          margin: "20px 0",
        }}
      >
        <div style={cardStyle}>
          <span style={{ color: "#6b7280", fontSize: "13px" }}>
            Total Furniture
          </span>
          <h2 style={{ color: "#2563eb", marginBottom: 0 }}>
            {furniture.length}
          </h2>
        </div>

        <div style={cardStyle}>
          <span style={{ color: "#6b7280", fontSize: "13px" }}>
            Assigned
          </span>
          <h2 style={{ color: "#16a34a", marginBottom: 0 }}>
            {assignedCount}
          </h2>
        </div>

        <div style={cardStyle}>
          <span style={{ color: "#6b7280", fontSize: "13px" }}>
            Unassigned
          </span>
          <h2 style={{ color: "#dc2626", marginBottom: 0 }}>
            {unassignedFurniture.length}
          </h2>
        </div>

        <div style={cardStyle}>
          <span style={{ color: "#6b7280", fontSize: "13px" }}>
            Pending Reminders
          </span>
          <h2 style={{ color: "#d97706", marginBottom: 0 }}>
            {pendingReminders}
          </h2>
        </div>
      </div>

      {/* Assignment progress */}
      <h3>Assignment Completion</h3>

      <div
        style={{
          height: "14px",
          background: "#e5e7eb",
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${completionPercentage}%`,
            height: "100%",
            background: "#16a34a",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <p style={{ color: "#6b7280" }}>
        {completionPercentage}% of furniture assigned.
      </p>

      {/* Reminder creation */}
      <button
        type="button"
        onClick={createReminders}
        disabled={unassignedFurniture.length === 0}
        style={{
          ...buttonStyle,
          background:
            unassignedFurniture.length === 0 ? "#9ca3af" : "#2563eb",
          color: "#ffffff",
          cursor:
            unassignedFurniture.length === 0 ? "not-allowed" : "pointer",
        }}
      >
        Create Reminders for Unassigned Furniture
      </button>

      {message && (
        <p
          role="status"
          style={{
            padding: "10px",
            marginTop: "14px",
            background: "#eff6ff",
            color: "#1d4ed8",
            borderRadius: "7px",
          }}
        >
          {message}
        </p>
      )}

      {/* Search and filter */}
      <h3 style={{ marginTop: "28px" }}>Furniture Assignment List</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search furniture..."
          style={{
            padding: "11px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            minWidth: 0,
          }}
        />

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          style={{
            padding: "11px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
          }}
        >
          <option value="All">All Furniture</option>
          <option value="Assigned">Assigned</option>
          <option value="Unassigned">Unassigned</option>
        </select>
      </div>

      {/* Furniture list */}
      <div style={{ display: "grid", gap: "12px" }}>
        {filteredFurniture.map((item) => {
          const id = String(item.id);
          const room = assignments[id];
          const isAssigned =
            typeof room === "string" && room.trim() !== "";
          const reminder = getReminder(id);

          return (
            <div
              key={id}
              style={{
                padding: "15px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                background: "#f9fafb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <strong>{String(item.name || "Unnamed Furniture")}</strong>

                  <p style={{ margin: "5px 0", color: "#6b7280" }}>
                    {String(item.category || "Other")}
                  </p>

                  <span
                    style={{
                      fontSize: "13px",
                      color: isAssigned ? "#15803d" : "#b91c1c",
                    }}
                  >
                    {isAssigned
                      ? `Assigned to: ${room}`
                      : "Not assigned to a room"}
                  </span>

                  {reminder && (
                    <p
                      style={{
                        marginBottom: 0,
                        fontSize: "12px",
                        color: reminder.resolved
                          ? "#15803d"
                          : "#b45309",
                      }}
                    >
                      Reminder: {reminder.resolved ? "Resolved" : "Pending"}
                    </p>
                  )}
                </div>

                {!isAssigned && (
                  <button
                    type="button"
                    onClick={() => toggleReminder(id)}
                    style={{
                      ...buttonStyle,
                      background: reminder?.resolved
                        ? "#dcfce7"
                        : "#fef3c7",
                      color: reminder?.resolved
                        ? "#166534"
                        : "#92400e",
                    }}
                  >
                    {reminder?.resolved
                      ? "Reopen Reminder"
                      : "Mark Resolved"}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredFurniture.length === 0 && (
          <p style={{ color: "#9ca3af" }}>
            No matching furniture found.
          </p>
        )}
      </div>
    </section>
  );
}

export default FurnitureRoomNotifications;
