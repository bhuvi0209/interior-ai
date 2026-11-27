
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { FurnitureItem } from "../types/Project";

interface Assignment {
  furnitureId: string | number;
  room: string;
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

interface FurnitureSnapshot {
  id: string;
  name: string;
  room: string;
  assignmentStatus: "Assigned" | "Unassigned";
}

interface RoomSnapshot {
  room: string;
  count: number;
}

interface HistoryRecord {
  id: string;
  title: string;
  createdAt: string;
  score: number;
  totalFurniture: number;
  assignedFurniture: number;
  unassignedFurniture: number;
  totalActions: number;
  pendingActions: number;
  reviewedActions: number;
  completedActions: number;
  roomReviewCount: number;
  rooms: RoomSnapshot[];
  furniture: FurnitureSnapshot[];
  actions: PlannerAction[];
}

interface Props {
  furniture: FurnitureItem[];
}

const ASSIGNMENT_KEY = "interior-ai-room-assignments";
const ACTION_KEY = "interior-ai-room-optimization-planner";
const HISTORY_KEY = "interior-ai-room-optimization-history";

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
    lineHeight: 1.5,
    marginBottom: "20px",
  },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "16px",
  },
  input: {
    flex: "1 1 200px",
    minWidth: "150px",
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
    padding: "9px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    fontWeight: 600,
  },
  dangerButton: {
    padding: "9px 12px",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    background: "#fff1f2",
    color: "#b91c1c",
    cursor: "pointer",
    fontWeight: 600,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  },
  stat: {
    background: "#ffffff",
    padding: "15px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
  },
  number: {
    display: "block",
    fontSize: "24px",
    fontWeight: 700,
    marginTop: "6px",
  },
  section: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "18px",
    marginBottom: "16px",
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
    lineHeight: 1.5,
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
    marginBottom: "6px",
  },
  empty: {
    padding: "22px",
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

    return parsed
      .filter(
        (item) =>
          item !== null &&
          typeof item === "object" &&
          "furnitureId" in item &&
          "room" in item &&
          (typeof item.room === "string" ||
            typeof item.room === "number")
      )
      .map((item) => ({
        furnitureId: item.furnitureId as string | number,
        room: String(item.room).trim(),
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
      (item) =>
        item !== null &&
        typeof item === "object" &&
        "id" in item &&
        "furnitureId" in item &&
        "furnitureName" in item &&
        "suggestion" in item &&
        "status" in item &&
        ["Pending", "Reviewed", "Completed"].includes(
          String(item.status)
        )
    ) as PlannerAction[];
  } catch {
    return [];
  }
}

function readHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        "id" in item &&
        "createdAt" in item &&
        "score" in item &&
        "furniture" in item &&
        "rooms" in item
    ) as HistoryRecord[];
  } catch {
    return [];
  }
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function downloadCSV(records: HistoryRecord[]) {
  const headers = [
    "Report Title",
    "Date",
    "Optimization Score",
    "Total Furniture",
    "Assigned Furniture",
    "Unassigned Furniture",
    "Total Planner Actions",
    "Pending Actions",
    "Reviewed Actions",
    "Completed Actions",
    "Rooms Needing Review",
  ];

  const rows = records.map((record) => [
    record.title,
    record.createdAt,
    record.score,
    record.totalFurniture,
    record.assignedFurniture,
    record.unassignedFurniture,
    record.totalActions,
    record.pendingActions,
    record.reviewedActions,
    record.completedActions,
    record.roomReviewCount,
  ]);

  const escapeCell = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "interior-ai-optimization-history.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function FurnitureRoomAssignmentOptimizationHistory({
  furniture,
}: Props) {
  const [history, setHistory] = useState<HistoryRecord[]>(() =>
    readHistory()
  );

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");

  const currentReport = useMemo(() => {
    const assignments = readAssignments();
    const actions = readActions();

    const assignmentMap = new Map<string, Assignment>();

    assignments.forEach((assignment) => {
      if (assignment.room) {
        assignmentMap.set(String(assignment.furnitureId), assignment);
      }
    });

    const furnitureRows: FurnitureSnapshot[] = furniture.map((item) => {
      const assignment = assignmentMap.get(String(item.id));

      return {
        id: String(item.id),
        name: item.name,
        room: assignment?.room || "Not assigned",
        assignmentStatus: assignment ? "Assigned" : "Unassigned",
      };
    });

    const assigned = furnitureRows.filter(
      (item) => item.assignmentStatus === "Assigned"
    ).length;

    const unassigned = furnitureRows.length - assigned;

    const roomMap = new Map<string, number>();

    furnitureRows.forEach((item) => {
      if (item.assignmentStatus === "Assigned") {
        roomMap.set(item.room, (roomMap.get(item.room) || 0) + 1);
      }
    });

    const rooms = Array.from(roomMap.entries())
      .map(([room, count]) => ({ room, count }))
      .sort((a, b) => b.count - a.count);

    const pending = actions.filter(
      (action) => action.status === "Pending"
    ).length;

    const reviewed = actions.filter(
      (action) => action.status === "Reviewed"
    ).length;

    const completed = actions.filter(
      (action) => action.status === "Completed"
    ).length;

    const roomsNeedingReview = rooms.filter(
      (room) => room.count >= 5
    ).length;

    const assignmentCoverage =
      furnitureRows.length === 0
        ? 100
        : (assigned / furnitureRows.length) * 100;

    const roomReviewScore =
      roomsNeedingReview === 0
        ? 100
        : Math.max(0, 100 - roomsNeedingReview * 20);

    const plannerProgress =
      actions.length === 0
        ? 100
        : ((completed + reviewed * 0.5) / actions.length) * 100;

    const score = Math.round(
      assignmentCoverage * 0.6 +
        roomReviewScore * 0.25 +
        plannerProgress * 0.15
    );

    return {
      score,
      totalFurniture: furnitureRows.length,
      assignedFurniture: assigned,
      unassignedFurniture: unassigned,
      totalActions: actions.length,
      pendingActions: pending,
      reviewedActions: reviewed,
      completedActions: completed,
      roomReviewCount: roomsNeedingReview,
      rooms,
      furniture: furnitureRows,
      actions,
    };
  }, [furniture]);

  const saveSnapshot = () => {
    const now = new Date();

    const record: HistoryRecord = {
      id: createId(),
      title: `Optimization Report - ${now.toLocaleDateString()}`,
      createdAt: now.toISOString(),
      ...currentReport,
    };

    const updated = [record, ...history];

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setHistory(updated);
      setSelectedId(record.id);
      setMessage("Report snapshot saved successfully.");
    } catch {
      setMessage(
        "Unable to save the report. Browser storage may be full."
      );
    }
  };

  const deleteRecord = (id: string) => {
    const updated = history.filter((record) => record.id !== id);

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      setHistory(updated);

      if (selectedId === id) {
        setSelectedId("");
      }

      setMessage("Selected report deleted.");
    } catch {
      setMessage("Unable to update report history.");
    }
  };

  const clearHistory = () => {
    if (history.length === 0) return;

    const confirmed = window.confirm(
      "Delete all saved optimization reports? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
      setHistory([]);
      setSelectedId("");
      setMessage("All saved reports have been cleared.");
    } catch {
      setMessage("Unable to clear report history.");
    }
  };

  const filteredHistory = history.filter((record) => {
    const query = search.toLowerCase();

    return (
      record.title.toLowerCase().includes(query) ||
      new Date(record.createdAt)
        .toLocaleString()
        .toLowerCase()
        .includes(query)
    );
  });

  const selectedRecord = history.find(
    (record) => record.id === selectedId
  );

  const latestRecord = history[0];
  const previousRecord = history[1];

  const scoreDifference =
    latestRecord && previousRecord
      ? latestRecord.score - previousRecord.score
      : null;

  const formatDate = (date: string) => {
    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? "Unknown date"
      : parsed.toLocaleString();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Furniture Room Assignment Optimization History
      </h2>

      <p style={styles.description}>
        Save dated snapshots of your room assignment optimization reports.
        Compare scores and review the furniture, rooms and planner actions
        recorded at each snapshot.
      </p>

      <div style={styles.toolbar}>
        <button style={styles.button} onClick={saveSnapshot}>
          Save Current Report
        </button>

        <button
          style={styles.secondaryButton}
          onClick={() => downloadCSV(filteredHistory)}
          disabled={filteredHistory.length === 0}
        >
          Export History CSV
        </button>

        <button
          style={styles.dangerButton}
          onClick={clearHistory}
          disabled={history.length === 0}
        >
          Clear All History
        </button>
      </div>

      {message && (
        <p role="status" style={styles.muted}>
          {message}
        </p>
      )}

      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.muted}>Current score</span>
          <strong style={styles.number}>
            {currentReport.score}/100
          </strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>Saved reports</span>
          <strong style={styles.number}>{history.length}</strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>Assigned furniture</span>
          <strong style={styles.number}>
            {currentReport.assignedFurniture}
          </strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>Unassigned furniture</span>
          <strong style={styles.number}>
            {currentReport.unassignedFurniture}
          </strong>
        </div>
      </div>

      <div style={styles.section}>
        <h3>Latest report comparison</h3>

        {!latestRecord ? (
          <p style={styles.muted}>
            No saved reports yet. Save your first report to begin tracking
            optimization progress.
          </p>
        ) : (
          <>
            <p>
              <strong>Latest saved score:</strong> {latestRecord.score}/100
            </p>

            {previousRecord ? (
              <>
                <p>
                  <strong>Previous saved score:</strong>{" "}
                  {previousRecord.score}/100
                </p>

                <p>
                  <strong>Score change:</strong>{" "}
                  {scoreDifference! > 0
                    ? `+${scoreDifference} points`
                    : `${scoreDifference} points`}
                </p>
              </>
            ) : (
              <p style={styles.muted}>
                Save another report to compare it with this snapshot.
              </p>
            )}
          </>
        )}

        <p style={styles.muted}>
          Comparison uses the two most recently saved snapshots, not
          automatically detected changes.
        </p>
      </div>

      <div style={styles.section}>
        <h3>Current report preview</h3>

        <div style={styles.toolbar}>
          <span style={styles.tag}>
            Score: {currentReport.score}/100
          </span>
          <span style={styles.tag}>
            Furniture: {currentReport.totalFurniture}
          </span>
          <span style={styles.tag}>
            Rooms: {currentReport.rooms.length}
          </span>
        </div>

        <p>
          <strong>Planner actions:</strong>{" "}
          {currentReport.totalActions} total,{" "}
          {currentReport.pendingActions} pending,{" "}
          {currentReport.reviewedActions} reviewed,{" "}
          {currentReport.completedActions} completed.
        </p>
      </div>

      <div style={styles.section}>
        <h3>Saved report archive</h3>

        <div style={styles.toolbar}>
          <input
            style={styles.input}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search report title or date..."
          />
        </div>

        {filteredHistory.length === 0 ? (
          <div style={styles.empty}>
            No saved reports match your search.
          </div>
        ) : (
          filteredHistory.map((record) => (
            <div key={record.id} style={styles.card}>
              <strong>{record.title}</strong>

              <p style={styles.muted}>
                Saved: {formatDate(record.createdAt)}
              </p>

              <div style={styles.toolbar}>
                <span style={styles.tag}>
                  Score: {record.score}/100
                </span>
                <span style={styles.tag}>
                  Assigned: {record.assignedFurniture}
                </span>
                <span style={styles.tag}>
                  Unassigned: {record.unassignedFurniture}
                </span>
              </div>

              <div style={styles.toolbar}>
                <button
                  style={styles.secondaryButton}
                  onClick={() => setSelectedId(record.id)}
                >
                  View Snapshot
                </button>

                <button
                  style={styles.dangerButton}
                  onClick={() => deleteRecord(record.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedRecord && (
        <div style={styles.section}>
          <h3>Archived report details</h3>

          <strong>{selectedRecord.title}</strong>
          <p style={styles.muted}>
            Saved: {formatDate(selectedRecord.createdAt)}
          </p>

          <div style={styles.stats}>
            <div style={styles.stat}>
              <span style={styles.muted}>Score</span>
              <strong style={styles.number}>
                {selectedRecord.score}/100
              </strong>
            </div>

            <div style={styles.stat}>
              <span style={styles.muted}>Total furniture</span>
              <strong style={styles.number}>
                {selectedRecord.totalFurniture}
              </strong>
            </div>

            <div style={styles.stat}>
              <span style={styles.muted}>Assigned</span>
              <strong style={styles.number}>
                {selectedRecord.assignedFurniture}
              </strong>
            </div>

            <div style={styles.stat}>
              <span style={styles.muted}>Unassigned</span>
              <strong style={styles.number}>
                {selectedRecord.unassignedFurniture}
              </strong>
            </div>
          </div>

          <h4>Archived room distribution</h4>

          {selectedRecord.rooms.length === 0 ? (
            <p style={styles.muted}>No room assignments in this snapshot.</p>
          ) : (
            selectedRecord.rooms.map((room) => (
              <p key={room.room}>
                {room.room}: <strong>{room.count} item(s)</strong>
              </p>
            ))
          )}

          <h4>Archived furniture list</h4>

          {selectedRecord.furniture.map((item) => (
            <p key={item.id}>
              {item.name} — {item.room} ({item.assignmentStatus})
            </p>
          ))}

          <h4>Archived planner actions</h4>

          {selectedRecord.actions.length === 0 ? (
            <p style={styles.muted}>No planner actions in this snapshot.</p>
          ) : (
            selectedRecord.actions.map((action) => (
              <div key={action.id} style={styles.card}>
                <strong>{action.furnitureName}</strong>
                <p>{action.suggestion}</p>
                <p style={styles.muted}>
                  Priority: {action.priority} | Status: {action.status}
                </p>
              </div>
            ))
          )}

          <button
            style={styles.secondaryButton}
            onClick={() => setSelectedId("")}
          >
            Close Snapshot
          </button>
        </div>
      )}

      <p style={styles.muted}>
        History is stored locally in this browser under {HISTORY_KEY}.
        Snapshots are saved copies and will not change when current furniture
        assignments are edited. Clearing browser site data may remove them.
      </p>
    </div>
  );
}

export default FurnitureRoomAssignmentOptimizationHistory;
