import { useEffect, useMemo, useState } from "react";

interface FurnitureItem {
  id: string | number;
  name: string;
  category?: string;
}

interface FurnitureRoomAssignmentConflictCheckerProps {
  furniture: FurnitureItem[];
}

interface AssignmentRecord {
  furnitureId: string;
  room: string;
}

const ASSIGNMENT_STORAGE_KEY = "interior-ai-room-assignments";
const CAPACITY_STORAGE_KEY = "interior-ai-room-capacity-limits";

const DEFAULT_ROOMS = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Dining Room",
  "Bathroom",
  "Office",
  "Other",
];

function FurnitureRoomAssignmentConflictChecker({
  furniture,
}: FurnitureRoomAssignmentConflictCheckerProps) {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [savedRooms, setSavedRooms] = useState<string[]>([]);
  const [capacityLimits, setCapacityLimits] = useState<Record<string, number>>(
    {},
  );
  const [selectedRoom, setSelectedRoom] = useState("All Rooms");
  const [message, setMessage] = useState("");

  const loadData = () => {
    try {
      const rawAssignments = localStorage.getItem(ASSIGNMENT_STORAGE_KEY);

      if (!rawAssignments) {
        setAssignments([]);
        setSavedRooms([]);
      } else {
        const parsed = JSON.parse(rawAssignments);

        const roomData = Array.isArray(parsed?.rooms)
          ? parsed.rooms
          : [];

        const normalizedRooms = roomData
          .map((room: unknown) => {
            if (typeof room === "string") return room;
            if (room && typeof room === "object" && "name" in room) {
              return String((room as { name: unknown }).name);
            }
            return "";
          })
          .filter(Boolean);

        setSavedRooms(normalizedRooms);

        const assignmentData =
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed) &&
          "assignments" in parsed
            ? parsed.assignments
            : parsed;

        let normalizedAssignments: AssignmentRecord[] = [];

        if (Array.isArray(assignmentData)) {
          normalizedAssignments = assignmentData
            .map((item: any) => ({
              furnitureId: String(
                item.furnitureId ?? item.furniture_id ?? item.id ?? "",
              ),
              room: String(item.room ?? item.roomName ?? item.room_name ?? ""),
            }))
            .filter((item) => item.furnitureId && item.room);
        } else if (
          assignmentData &&
          typeof assignmentData === "object"
        ) {
          normalizedAssignments = Object.entries(assignmentData)
            .map(([furnitureId, roomValue]) => ({
              furnitureId: String(furnitureId),
              room:
                typeof roomValue === "string"
                  ? roomValue
                  : roomValue &&
                      typeof roomValue === "object" &&
                      "room" in roomValue
                    ? String((roomValue as { room: unknown }).room)
                    : "",
            }))
            .filter((item) => item.furnitureId && item.room);
        }

        setAssignments(normalizedAssignments);
      }

      const rawLimits = localStorage.getItem(CAPACITY_STORAGE_KEY);
      setCapacityLimits(rawLimits ? JSON.parse(rawLimits) : {});
      setMessage("");
    } catch {
      setMessage(
        "Could not read the saved assignment data. Check your browser storage format.",
      );
      setAssignments([]);
      setSavedRooms([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const furnitureById = useMemo(() => {
    return new Map(
      furniture.map((item) => [String(item.id), item]),
    );
  }, [furniture]);

  const roomNames = useMemo(() => {
    const names = new Set<string>([
      ...DEFAULT_ROOMS,
      ...savedRooms,
      ...assignments.map((item) => item.room),
    ]);

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [savedRooms, assignments]);

  const assignmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    assignments.forEach((assignment) => {
      counts[assignment.room] = (counts[assignment.room] || 0) + 1;
    });

    return counts;
  }, [assignments]);

  const duplicateFurnitureIds = useMemo(() => {
    const counts: Record<string, number> = {};

    assignments.forEach((assignment) => {
      counts[assignment.furnitureId] =
        (counts[assignment.furnitureId] || 0) + 1;
    });

    return new Set(
      Object.entries(counts)
        .filter(([, count]) => count > 1)
        .map(([id]) => id),
    );
  }, [assignments]);

  const assignedFurnitureIds = useMemo(
    () => new Set(assignments.map((item) => item.furnitureId)),
    [assignments],
  );

  const knownRoomNames = useMemo(
    () => new Set([...DEFAULT_ROOMS, ...savedRooms]),
    [savedRooms],
  );

  const issues = useMemo(() => {
    const results: {
      id: string;
      furnitureName: string;
      room: string;
      issue: string;
    }[] = [];

    furniture.forEach((item) => {
      const id = String(item.id);
      const itemAssignments = assignments.filter(
        (assignment) => assignment.furnitureId === id,
      );

      if (itemAssignments.length === 0) {
        results.push({
          id,
          furnitureName: item.name,
          room: "Not assigned",
          issue: "Furniture has no room assignment",
        });
      }

      if (itemAssignments.length > 1) {
        results.push({
          id,
          furnitureName: item.name,
          room: itemAssignments.map((a) => a.room).join(", "),
          issue: "Furniture is assigned more than once",
        });
      }

      itemAssignments.forEach((assignment) => {
        if (
          savedRooms.length > 0 &&
          !knownRoomNames.has(assignment.room)
        ) {
          results.push({
            id,
            furnitureName: item.name,
            room: assignment.room,
            issue: "Assigned room is not in the saved room list",
          });
        }
      });
    });

    assignments.forEach((assignment) => {
      if (!furnitureById.has(assignment.furnitureId)) {
        results.push({
          id: assignment.furnitureId,
          furnitureName: `Unknown furniture (${assignment.furnitureId})`,
          room: assignment.room,
          issue: "Assignment refers to furniture that no longer exists",
        });
      }
    });

    roomNames.forEach((room) => {
      const limit = Number(capacityLimits[room]);
      const count = assignmentCounts[room] || 0;

      if (limit > 0 && count > limit) {
        results.push({
          id: `capacity-${room}`,
          furnitureName: `${count} furniture items`,
          room,
          issue: `Room capacity exceeded (limit: ${limit})`,
        });
      }
    });

    return results;
  }, [
    furniture,
    assignments,
    savedRooms,
    knownRoomNames,
    furnitureById,
    roomNames,
    capacityLimits,
    assignmentCounts,
  ]);

  const filteredIssues = useMemo(() => {
    if (selectedRoom === "All Rooms") return issues;

    return issues.filter((issue) => issue.room === selectedRoom);
  }, [issues, selectedRoom]);

  const updateCapacity = (room: string, value: string) => {
    const nextLimits = {
      ...capacityLimits,
      [room]: value === "" ? 0 : Math.max(0, Number(value)),
    };

    setCapacityLimits(nextLimits);

    try {
      localStorage.setItem(
        CAPACITY_STORAGE_KEY,
        JSON.stringify(nextLimits),
      );
      setMessage("Room capacity limit saved.");
    } catch {
      setMessage("Could not save the room capacity limit.");
    }
  };

  const exportReport = () => {
    const rows = [
      ["Furniture", "Room", "Issue"],
      ...filteredIssues.map((issue) => [
        issue.furnitureName,
        issue.room,
        issue.issue,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-room-conflict-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const unassignedCount = furniture.filter(
    (item) => !assignedFurnitureIds.has(String(item.id)),
  ).length;

  const duplicateCount = duplicateFurnitureIds.size;

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
  } as const;

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1100px",
        margin: "0 auto",
        color: "#1f2937",
        fontFamily: "Arial, sans-serif",
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
          <h2 style={{ marginBottom: "6px" }}>
            Furniture Room Assignment Conflict Checker
          </h2>
          <p style={{ color: "#6b7280", marginTop: 0 }}>
            Find missing, duplicate, and invalid room assignments.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={loadData} style={buttonStyle}>
            Refresh Data
          </button>
          <button onClick={exportReport} style={buttonStyle}>
            Export CSV
          </button>
        </div>
      </div>

      {message && (
        <p style={{ color: "#2563eb", marginTop: "12px" }}>
          {message}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          margin: "20px 0",
        }}
      >
        <div style={cardStyle}>
          <p style={statLabelStyle}>Total furniture</p>
          <h2>{furniture.length}</h2>
        </div>

        <div style={cardStyle}>
          <p style={statLabelStyle}>Unassigned</p>
          <h2 style={{ color: "#d97706" }}>{unassignedCount}</h2>
        </div>

        <div style={cardStyle}>
          <p style={statLabelStyle}>Duplicate assignments</p>
          <h2 style={{ color: "#dc2626" }}>{duplicateCount}</h2>
        </div>

        <div style={cardStyle}>
          <p style={statLabelStyle}>Total detected issues</p>
          <h2 style={{ color: issues.length ? "#dc2626" : "#16a34a" }}>
            {issues.length}
          </h2>
        </div>
      </div>

      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Room capacity limits</h3>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          Set a maximum number of furniture items allowed in each room.
          Leave a limit at zero if you do not want to check that room.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
          }}
        >
          {roomNames.map((room) => (
            <label
              key={room}
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <span style={{ fontWeight: 600 }}>{room}</span>
              <input
                type="number"
                min="0"
                value={capacityLimits[room] || ""}
                placeholder="No limit"
                onChange={(event) =>
                  updateCapacity(room, event.target.value)
                }
                style={inputStyle}
              />
              <small style={{ color: "#6b7280" }}>
                Currently assigned: {assignmentCounts[room] || 0}
              </small>
            </label>
          ))}
        </div>
      </section>

      <section style={{ ...cardStyle, marginTop: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h3 style={{ margin: 0 }}>Detected conflicts</h3>

          <select
            value={selectedRoom}
            onChange={(event) => setSelectedRoom(event.target.value)}
            style={inputStyle}
          >
            <option value="All Rooms">All Rooms</option>
            {roomNames.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
            <option value="Not assigned">Not assigned</option>
          </select>
        </div>

        {filteredIssues.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "30px 10px",
              color: "#16a34a",
            }}
          >
            <h3>No conflicts found!</h3>
            <p>Your room assignment checks show no issues for this filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", marginTop: "16px" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "550px",
              }}
            >
              <thead>
                <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                  <th style={cellStyle}>Furniture</th>
                  <th style={cellStyle}>Room</th>
                  <th style={cellStyle}>Issue</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue, index) => (
                  <tr key={`${issue.id}-${issue.issue}-${index}`}>
                    <td style={cellStyle}>{issue.furnitureName}</td>
                    <td style={cellStyle}>{issue.room}</td>
                    <td style={{ ...cellStyle, color: "#dc2626" }}>
                      {issue.issue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p
        style={{
          marginTop: "16px",
          fontSize: "13px",
          color: "#6b7280",
          lineHeight: 1.5,
        }}
      >
        Note: Capacity limits count assigned furniture items, not physical
        floor area. Refresh the checker after changing room assignments in
        the Room Assignment component.
      </p>
    </div>
  );
}

const buttonStyle = {
  padding: "10px 14px",
  border: "none",
  borderRadius: "7px",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
} as const;

const inputStyle = {
  padding: "9px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  width: "100%",
  boxSizing: "border-box" as const,
} as const;

const statLabelStyle = {
  color: "#6b7280",
  fontSize: "13px",
  margin: 0,
} as const;

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "left" as const,
  fontSize: "14px",
};

export default FurnitureRoomAssignmentConflictChecker;