
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { FurnitureItem } from "../types/Project";

interface FurnitureRoomAssignmentProps {
  furniture: FurnitureItem[];
}

interface AssignmentData {
  rooms: string[];
  assignments: Record<string, string>;
}

const STORAGE_KEY = "interior-ai-day76-room-assignments";

const DEFAULT_ROOMS = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Bathroom",
  "Dining Room",
  "Office",
  "Balcony",
];

function FurnitureRoomAssignment({
  furniture,
}: FurnitureRoomAssignmentProps) {
  const [data, setData] = useState<AssignmentData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        return {
          rooms: Array.isArray(parsed.rooms)
            ? parsed.rooms.filter(
                (room: unknown) => typeof room === "string"
              )
            : DEFAULT_ROOMS,
          assignments:
            parsed.assignments &&
            typeof parsed.assignments === "object" &&
            !Array.isArray(parsed.assignments)
              ? parsed.assignments
              : {},
        };
      }
    } catch (error) {
      console.error("Could not load room assignments:", error);
    }

    return {
      rooms: DEFAULT_ROOMS,
      assignments: {},
    };
  });

  const [newRoom, setNewRoom] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("All");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Could not save room assignments:", error);
      setMessage("Unable to save changes in browser storage.");
    }
  }, [data]);

  const getRoom = (id: string): string => {
    return data.assignments[id] || "Unassigned";
  };

  const filteredFurniture = furniture.filter((item) => {
    const name = String(item.name || "");
    const category = String(item.category || "");
    const room = getRoom(String(item.id));

    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      name.toLowerCase().includes(searchText) ||
      category.toLowerCase().includes(searchText) ||
      room.toLowerCase().includes(searchText);

    const matchesRoom =
      selectedRoom === "All" ||
      (selectedRoom === "Unassigned"
        ? room === "Unassigned"
        : room === selectedRoom);

    return matchesSearch && matchesRoom;
  });

  const assignedCount = furniture.filter(
    (item) => getRoom(String(item.id)) !== "Unassigned"
  ).length;

  const unassignedCount = furniture.length - assignedCount;

  const addRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const roomName = newRoom.trim();

    if (!roomName) {
      setMessage("Please enter a room name.");
      return;
    }

    const alreadyExists = data.rooms.some(
      (room) => room.toLowerCase() === roomName.toLowerCase()
    );

    if (alreadyExists) {
      setMessage("This room already exists.");
      return;
    }

    setData((previous) => ({
      ...previous,
      rooms: [...previous.rooms, roomName],
    }));

    setNewRoom("");
    setMessage(`"${roomName}" added successfully.`);
  };

  const assignRoom = (id: string, room: string) => {
    setData((previous) => {
      const updatedAssignments = { ...previous.assignments };

      if (room === "Unassigned") {
        delete updatedAssignments[id];
      } else {
        updatedAssignments[id] = room;
      }

      return {
        ...previous,
        assignments: updatedAssignments,
      };
    });

    setMessage("Furniture room assignment updated.");
  };

  const deleteRoom = (roomName: string) => {
    const furnitureInRoom = furniture.some(
      (item) => getRoom(String(item.id)) === roomName
    );

    if (furnitureInRoom) {
      setMessage(
        "Move all furniture out of this room before deleting it."
      );
      return;
    }

    if (!window.confirm(`Delete "${roomName}"?`)) {
      return;
    }

    setData((previous) => ({
      ...previous,
      rooms: previous.rooms.filter((room) => room !== roomName),
    }));

    if (selectedRoom === roomName) {
      setSelectedRoom("All");
    }

    setMessage("Room deleted successfully.");
  };

  const exportCSV = () => {
    const headers = ["Furniture Name", "Category", "Room"];

    const escapeCSV = (value: string) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const rows = furniture.map((item) => [
      String(item.name || ""),
      String(item.category || ""),
      getRoom(String(item.id)),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-room-assignments.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        marginTop: "24px",
        padding: "24px",
        background: "#ffffff",
        color: "#1f2937",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
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
          <h2 style={{ margin: "0 0 6px" }}>
            Furniture Room Assignment Manager
          </h2>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Organize your furniture by room.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          disabled={furniture.length === 0}
          style={buttonStyle}
        >
          Export CSV
        </button>
      </div>

      <div style={summaryGridStyle}>
        <SummaryCard label="Total Furniture" value={furniture.length} />
        <SummaryCard label="Assigned" value={assignedCount} />
        <SummaryCard label="Unassigned" value={unassignedCount} />
        <SummaryCard label="Total Rooms" value={data.rooms.length} />
      </div>

      <form onSubmit={addRoom} style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>Add a Custom Room</h3>

        <div style={flexRowStyle}>
          <input
            value={newRoom}
            onChange={(event) => setNewRoom(event.target.value)}
            placeholder="Example: Guest Room"
            style={{ ...inputStyle, flex: "1 1 200px" }}
          />

          <button type="submit" style={buttonStyle}>
            Add Room
          </button>
        </div>
      </form>

      <h3>Room Overview</h3>

      <div style={summaryGridStyle}>
        {data.rooms.map((room) => {
          const count = furniture.filter(
            (item) => getRoom(String(item.id)) === room
          ).length;

          return (
            <div key={room} style={roomCardStyle}>
              <div style={{ fontWeight: 600 }}>{room}</div>

              <div style={{ fontSize: "22px", fontWeight: 700, margin: "6px 0" }}>
                {count}
              </div>

              <div style={{ color: "#6b7280", fontSize: "12px" }}>
                Furniture items
              </div>

              <button
                type="button"
                onClick={() => deleteRoom(room)}
                style={smallDeleteButtonStyle}
              >
                Delete Room
              </button>
            </div>
          );
        })}
      </div>

      <h3>Furniture Assignments</h3>

      <div style={flexRowStyle}>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search furniture or room..."
          style={{ ...inputStyle, flex: "1 1 200px" }}
        />

        <select
          value={selectedRoom}
          onChange={(event) => setSelectedRoom(event.target.value)}
          style={{ ...inputStyle, flex: "0 1 190px" }}
        >
          <option value="All">All Rooms</option>
          <option value="Unassigned">Unassigned</option>

          {data.rooms.map((room) => (
            <option key={room} value={room}>
              {room}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <p role="status" style={{ color: "#2563eb", fontSize: "13px" }}>
          {message}
        </p>
      )}

      <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
        {filteredFurniture.map((item) => {
          const id = String(item.id);
          const currentRoom = getRoom(id);

          return (
            <div key={id} style={furnitureCardStyle}>
              <div style={{ flex: "1 1 180px" }}>
                <h3 style={{ margin: "0 0 5px" }}>
                  {item.name || "Unnamed Furniture"}
                </h3>

                <div style={{ color: "#6b7280", fontSize: "13px" }}>
                  Category: {item.category || "Not specified"}
                </div>

                <div style={{ fontSize: "14px", marginTop: "7px" }}>
                  Current Room: <strong>{currentRoom}</strong>
                </div>
              </div>

              <div style={{ flex: "0 1 220px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Assign to Room
                </label>

                <select
                  aria-label={`Assign ${item.name} to a room`}
                  value={currentRoom}
                  onChange={(event) => assignRoom(id, event.target.value)}
                  style={inputStyle}
                >
                  <option value="Unassigned">Unassigned</option>

                  {data.rooms.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}

        {filteredFurniture.length === 0 && (
          <p style={{ color: "#6b7280", textAlign: "center" }}>
            {furniture.length === 0
              ? "Add furniture to your design to start assigning rooms."
              : "No furniture matches your search or selected room."}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={summaryCardStyle}>
      <div style={{ color: "#6b7280", fontSize: "13px" }}>{label}</div>
      <div style={{ fontSize: "25px", fontWeight: 700, marginTop: "6px" }}>
        {value}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  fontSize: "14px",
  background: "#ffffff",
};

const buttonStyle = {
  padding: "9px 14px",
  border: "none",
  borderRadius: "7px",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
};

const smallDeleteButtonStyle = {
  marginTop: "10px",
  padding: "6px 9px",
  border: "none",
  borderRadius: "6px",
  background: "#fee2e2",
  color: "#b91c1c",
  cursor: "pointer",
  fontSize: "12px",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: "12px",
  margin: "20px 0",
};

const summaryCardStyle = {
  padding: "16px",
  background: "#f3f4f6",
  borderRadius: "10px",
};

const sectionStyle = {
  padding: "18px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  marginBottom: "20px",
};

const flexRowStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "10px",
};

const roomCardStyle = {
  padding: "14px",
  border: "1px solid #e5e7eb",
  borderRadius: "9px",
  background: "#f9fafb",
};

const furnitureCardStyle = {
  padding: "16px",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap" as const,
  gap: "14px",
};

export default FurnitureRoomAssignment;
