
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { FurnitureItem } from "../types/Project";

interface Assignment {
  furnitureId: string | number;
  room: string;
  furnitureName?: string;
}

type PlannerStatus = "Pending" | "Reviewed" | "Completed";

interface PlannerAction {
  id: string;
  furnitureId: string;
  furnitureName: string;
  currentRoom: string;
  suggestion: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
  status: PlannerStatus;
  createdAt: string;
}

interface Props {
  furniture: FurnitureItem[];
}

const ASSIGNMENT_KEY = "interior-ai-room-assignments";
const ACTION_KEY = "interior-ai-room-optimization-planner";

const styles: Record<string, CSSProperties> = {
  container: {
    padding: "24px",
    background: "#f8fafc",
    borderRadius: "14px",
    color: "#1e293b",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    fontSize: "24px",
    margin: "0 0 8px",
  },
  description: {
    color: "#64748b",
    margin: "0 0 20px",
    lineHeight: 1.5,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  stat: {
    background: "#ffffff",
    padding: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
  },
  statNumber: {
    display: "block",
    fontSize: "25px",
    fontWeight: 700,
    marginTop: "6px",
  },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "16px",
  },
  input: {
    flex: "1 1 200px",
    minWidth: "160px",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
  },
  select: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
  },
  button: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    padding: "8px 11px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "12px",
  },
  muted: {
    color: "#64748b",
    fontSize: "13px",
  },
  tag: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "20px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 700,
    marginRight: "6px",
  },
  empty: {
    padding: "24px",
    textAlign: "center",
    background: "#ffffff",
    border: "1px dashed #cbd5e1",
    borderRadius: "10px",
    color: "#64748b",
  },
};

function readAssignments(): Assignment[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENT_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is Assignment =>
        item !== null &&
        typeof item === "object" &&
        "furnitureId" in item &&
        "room" in item &&
        (typeof item.room === "string" || typeof item.room === "number")
    ).map((item) => ({
      furnitureId: item.furnitureId as string | number,
      room: String(item.room).trim(),
      furnitureName:
        typeof item.furnitureName === "string" ? item.furnitureName : undefined,
    }));
  } catch {
    return [];
  }
}

function readActions(): PlannerAction[] {
  try {
    const raw = localStorage.getItem(ACTION_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is PlannerAction =>
        item !== null &&
        typeof item === "object" &&
        "id" in item &&
        "furnitureId" in item &&
        "status" in item
    );
  } catch {
    return [];
  }
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function downloadCSV(actions: PlannerAction[]) {
  const headers = [
    "Furniture",
    "Furniture ID",
    "Current Room",
    "Suggestion",
    "Reason",
    "Priority",
    "Status",
    "Created At",
  ];

  const rows = actions.map((action) => [
    action.furnitureName,
    action.furnitureId,
    action.currentRoom,
    action.suggestion,
    action.reason,
    action.priority,
    action.status,
    action.createdAt,
  ]);

  const escapeCell = (value: string | number) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "furniture-room-optimization-plan.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function FurnitureRoomAssignmentOptimizationPlanner({
  furniture,
}: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    readAssignments()
  );
  const [actions, setActions] = useState<PlannerAction[]>(() =>
    readActions()
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();

    assignments.forEach((assignment) => {
      map.set(String(assignment.furnitureId), assignment);
    });

    return map;
  }, [assignments]);

  const roomCounts = useMemo(() => {
    const counts = new Map<string, number>();

    assignments.forEach((assignment) => {
      const room = assignment.room.trim();
      if (room) counts.set(room, (counts.get(room) || 0) + 1);
    });

    return counts;
  }, [assignments]);

  const generatedSuggestions = useMemo(() => {
    const suggestions: Omit<PlannerAction, "id" | "status" | "createdAt">[] = [];

    furniture.forEach((item) => {
      const assignment = assignmentMap.get(String(item.id));
      const room = assignment?.room?.trim() || "";

      if (!room) {
        suggestions.push({
          furnitureId: String(item.id),
          furnitureName: item.name,
          currentRoom: "Not assigned",
          suggestion: "Choose a suitable room",
          reason: "This furniture item does not have a recorded room assignment.",
          priority: "High",
        });
      } else {
        const count = roomCounts.get(room) || 0;

        if (count >= 8) {
          suggestions.push({
            furnitureId: String(item.id),
            furnitureName: item.name,
            currentRoom: room,
            suggestion: "Review this room's furniture distribution",
            reason: `${room} has ${count} assigned furniture items. Check whether the room has enough usable space.`,
            priority: "High",
          });
        } else if (count >= 5) {
          suggestions.push({
            furnitureId: String(item.id),
            furnitureName: item.name,
            currentRoom: room,
            suggestion: "Check room capacity and layout",
            reason: `${room} has ${count} assigned furniture items. Review the layout before adding more items.`,
            priority: "Medium",
          });
        }
      }
    });

    return suggestions;
  }, [furniture, assignmentMap, roomCounts]);

  const generatePlan = () => {
    const existingByKey = new Map(
      actions.map((action) => [
        `${action.furnitureId}|${action.suggestion}`,
        action,
      ])
    );

    const nextActions = generatedSuggestions.map((suggestion) => {
      const key = `${suggestion.furnitureId}|${suggestion.suggestion}`;
      const existing = existingByKey.get(key);

      if (existing) return existing;

      return {
        ...suggestion,
        id: createId(),
        status: "Pending" as PlannerStatus,
        createdAt: new Date().toISOString(),
      };
    });

    setActions(nextActions);
    localStorage.setItem(ACTION_KEY, JSON.stringify(nextActions));
  };

  const updateStatus = (id: string, status: PlannerStatus) => {
    const updated = actions.map((action) =>
      action.id === id ? { ...action, status } : action
    );

    setActions(updated);
    localStorage.setItem(ACTION_KEY, JSON.stringify(updated));
  };

  const refreshAssignments = () => {
    setAssignments(readAssignments());
  };

  const filteredActions = actions.filter((action) => {
    const query = search.toLowerCase();

    const matchesSearch =
      action.furnitureName.toLowerCase().includes(query) ||
      action.currentRoom.toLowerCase().includes(query) ||
      action.suggestion.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "All" || action.status === statusFilter;

    const matchesPriority =
      priorityFilter === "All" || action.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const assignedCount = furniture.filter((item) =>
    assignmentMap.has(String(item.id))
  ).length;

  const pendingCount = actions.filter(
    (action) => action.status === "Pending"
  ).length;

  const highPriorityCount = actions.filter(
    (action) => action.priority === "High"
  ).length;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Furniture Room Assignment Optimization Planner</h2>

      <p style={styles.description}>
        Review room assignments and create a practical list of items that may
        need attention. Suggestions are rule-based and do not change room
        assignments automatically.
      </p>

      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.muted}>Total furniture</span>
          <strong style={styles.statNumber}>{furniture.length}</strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>Assigned furniture</span>
          <strong style={styles.statNumber}>{assignedCount}</strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>Pending actions</span>
          <strong style={styles.statNumber}>{pendingCount}</strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>High-priority suggestions</span>
          <strong style={styles.statNumber}>{highPriorityCount}</strong>
        </div>
      </div>

      <div style={styles.toolbar}>
        <button style={styles.button} onClick={generatePlan}>
          Generate Optimization Plan
        </button>

        <button style={styles.secondaryButton} onClick={refreshAssignments}>
          Refresh Assignments
        </button>

        <button
          style={styles.secondaryButton}
          onClick={() => downloadCSV(filteredActions)}
          disabled={filteredActions.length === 0}
        >
          Export CSV
        </button>
      </div>

      <div style={styles.toolbar}>
        <input
          style={styles.input}
          type="text"
          placeholder="Search furniture, room or suggestion..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          style={styles.select}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Reviewed">Reviewed</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          style={styles.select}
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
        >
          <option value="All">All priorities</option>
          <option value="High">High priority</option>
          <option value="Medium">Medium priority</option>
          <option value="Low">Low priority</option>
        </select>
      </div>

      <h3>Optimization suggestions</h3>

      {actions.length === 0 ? (
        <div style={styles.empty}>
          <p>No optimization plan has been generated yet.</p>
          <p>Click "Generate Optimization Plan" to create suggestions.</p>
        </div>
      ) : filteredActions.length === 0 ? (
        <div style={styles.empty}>
          No suggestions match your current search or filters.
        </div>
      ) : (
        filteredActions.map((action) => (
          <div key={action.id} style={styles.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <strong>{action.furnitureName}</strong>
              <div>
                <span style={styles.tag}>{action.priority}</span>
                <span style={styles.tag}>{action.status}</span>
              </div>
            </div>

            <p style={{ marginBottom: "6px" }}>
              <strong>Current room:</strong> {action.currentRoom}
            </p>

            <p style={{ marginBottom: "6px" }}>
              <strong>Suggested action:</strong> {action.suggestion}
            </p>

            <p style={styles.muted}>{action.reason}</p>

            <div style={styles.toolbar}>
              <button
                style={styles.secondaryButton}
                onClick={() => updateStatus(action.id, "Pending")}
              >
                Mark Pending
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => updateStatus(action.id, "Reviewed")}
              >
                Mark Reviewed
              </button>

              <button
                style={styles.secondaryButton}
                onClick={() => updateStatus(action.id, "Completed")}
              >
                Mark Completed
              </button>
            </div>
          </div>
        ))
      )}

      <h3>Room distribution</h3>

      {roomCounts.size === 0 ? (
        <div style={styles.empty}>
          No room assignments were found in local storage.
        </div>
      ) : (
        Array.from(roomCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([room, count]) => (
            <div key={room} style={styles.card}>
              <strong>{room}</strong>
              <span style={{ float: "right" }}>{count} items</span>
            </div>
          ))
      )}

      <p style={styles.muted}>
        Assignment data source: {ASSIGNMENT_KEY}. Planner actions are saved
        separately under {ACTION_KEY}.
      </p>
    </div>
  );
}

export default FurnitureRoomAssignmentOptimizationPlanner;
