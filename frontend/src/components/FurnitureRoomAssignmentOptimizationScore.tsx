
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

interface ScoreBreakdown {
  coverage: number;
  distribution: number;
  actionProgress: number;
  overall: number;
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
    lineHeight: 1.5,
    marginBottom: "20px",
  },
  scoreCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "22px",
    marginBottom: "18px",
    textAlign: "center",
  },
  score: {
    fontSize: "54px",
    fontWeight: 800,
    margin: "12px 0",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  stat: {
    padding: "16px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
  },
  number: {
    display: "block",
    fontSize: "25px",
    fontWeight: 700,
    marginTop: "7px",
  },
  section: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "18px",
    marginBottom: "16px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "8px",
  },
  track: {
    width: "100%",
    height: "11px",
    background: "#e2e8f0",
    borderRadius: "20px",
    overflow: "hidden",
    marginBottom: "16px",
  },
  toolbar: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  input: {
    flex: "1 1 200px",
    minWidth: "150px",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
  },
  button: {
    padding: "10px 14px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    padding: "9px 12px",
    background: "#ffffff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    cursor: "pointer",
  },
  listItem: {
    padding: "12px 0",
    borderBottom: "1px solid #e2e8f0",
  },
  muted: {
    color: "#64748b",
    fontSize: "13px",
  },
  empty: {
    padding: "20px",
    textAlign: "center",
    color: "#64748b",
    background: "#ffffff",
    border: "1px dashed #cbd5e1",
    borderRadius: "10px",
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
        (item): item is Assignment =>
          item !== null &&
          typeof item === "object" &&
          "furnitureId" in item &&
          "room" in item &&
          (typeof item.room === "string" ||
            typeof item.room === "number")
      )
      .map((item) => ({
        furnitureId: item.furnitureId,
        room: String(item.room).trim(),
        furnitureName:
          typeof item.furnitureName === "string"
            ? item.furnitureName
            : undefined,
      }));
  } catch {
    return [];
  }
}

function readPlannerActions(): PlannerAction[] {
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
        "status" in item &&
        "priority" in item
    );
  } catch {
    return [];
  }
}

function downloadCSV(rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "furniture-room-optimization-score.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Poor";
}

function getScoreColor(score: number) {
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function FurnitureRoomAssignmentOptimizationScore({
  furniture,
}: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    readAssignments()
  );

  const [actions, setActions] = useState<PlannerAction[]>(() =>
    readPlannerActions()
  );

  const [search, setSearch] = useState("");

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

      if (room) {
        counts.set(room, (counts.get(room) || 0) + 1);
      }
    });

    return counts;
  }, [assignments]);

  const validFurniture = furniture.filter(
    (item) => item.visible !== false
  );

  const assignedFurniture = validFurniture.filter((item) => {
    const assignment = assignmentMap.get(String(item.id));
    return Boolean(assignment?.room?.trim());
  });

  const unassignedFurniture = validFurniture.filter((item) => {
    const assignment = assignmentMap.get(String(item.id));
    return !assignment?.room?.trim();
  });

  const crowdedRooms = Array.from(roomCounts.entries()).filter(
    ([, count]) => count >= 8
  );

  const totalRooms = roomCounts.size;

  const coverageScore =
    validFurniture.length === 0
      ? 100
      : Math.round(
          (assignedFurniture.length / validFurniture.length) * 100
        );

  // A room with 1–7 assigned items receives full distribution credit.
  // Rooms with 8 or more items reduce the distribution score.
  const distributionScore =
    totalRooms === 0
      ? 100
      : Math.max(
          0,
          Math.round(
            100 -
              (crowdedRooms.reduce(
                (total, [, count]) => total + (count - 7) * 10,
                0
              ) /
                Math.max(validFurniture.length, 1)) *
                100
          )
        );

  const pendingActions = actions.filter(
    (action) => action.status === "Pending"
  );

  const completedActions = actions.filter(
    (action) => action.status === "Completed"
  );

  const actionProgressScore =
    actions.length === 0
      ? 100
      : Math.round(
          ((completedActions.length + actions.filter(
            (action) => action.status === "Reviewed"
          ).length * 0.5) /
            actions.length) *
            100
        );

  const scoreBreakdown: ScoreBreakdown = {
    coverage: coverageScore,
    distribution: distributionScore,
    actionProgress: actionProgressScore,
    overall: Math.round(
      coverageScore * 0.5 +
        distributionScore * 0.3 +
        actionProgressScore * 0.2
    ),
  };

  const suggestions = useMemo(() => {
    const result: string[] = [];

    if (unassignedFurniture.length > 0) {
      result.push(
        `Assign rooms to ${unassignedFurniture.length} unassigned furniture item(s).`
      );
    }

    if (crowdedRooms.length > 0) {
      result.push(
        `Review ${crowdedRooms.length} room(s) containing 8 or more assigned items.`
      );
    }

    if (pendingActions.length > 0) {
      result.push(
        `Review or complete ${pendingActions.length} pending planner action(s).`
      );
    }

    if (result.length === 0) {
      result.push(
        "No issues were detected by the current scoring rules. Continue checking actual room layouts and clearances."
      );
    }

    return result;
  }, [
    unassignedFurniture.length,
    crowdedRooms.length,
    pendingActions.length,
  ]);

  const filteredFurniture = validFurniture.filter((item) => {
    const assignment = assignmentMap.get(String(item.id));
    const room = assignment?.room || "";

    return (
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      room.toLowerCase().includes(search.toLowerCase())
    );
  });

  const refreshData = () => {
    setAssignments(readAssignments());
    setActions(readPlannerActions());
  };

  const exportReport = () => {
    const rows = [
      ["Metric", "Score or Value"],
      ["Overall optimization score", String(scoreBreakdown.overall)],
      ["Assignment coverage score", String(scoreBreakdown.coverage)],
      ["Room distribution score", String(scoreBreakdown.distribution)],
      ["Action progress score", String(scoreBreakdown.actionProgress)],
      ["Total furniture", String(validFurniture.length)],
      ["Assigned furniture", String(assignedFurniture.length)],
      ["Unassigned furniture", String(unassignedFurniture.length)],
      ["Total rooms", String(totalRooms)],
      ["Crowded rooms", String(crowdedRooms.length)],
      ["Pending actions", String(pendingActions.length)],
      [],
      ["Furniture", "Room", "Assignment status"],
      ...filteredFurniture.map((item) => {
        const assignment = assignmentMap.get(String(item.id));

        return [
          item.name,
          assignment?.room || "Not assigned",
          assignment?.room ? "Assigned" : "Unassigned",
        ];
      }),
      [],
      ["Improvement suggestions"],
      ...suggestions.map((suggestion) => [suggestion]),
    ];

    downloadCSV(rows);
  };

  const renderProgress = (value: number) => (
    <div style={styles.track}>
      <div
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: "100%",
          background: getScoreColor(value),
          borderRadius: "20px",
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Furniture Room Assignment Optimization Score
      </h2>

      <p style={styles.description}>
        Measure room assignment coverage, room distribution, and progress on
        optimization planner actions.
      </p>

      <div style={styles.scoreCard}>
        <span style={styles.muted}>Overall optimization score</span>

        <div
          style={{
            ...styles.score,
            color: getScoreColor(scoreBreakdown.overall),
          }}
        >
          {scoreBreakdown.overall}/100
        </div>

        <strong>{getScoreLabel(scoreBreakdown.overall)}</strong>

        <p style={styles.muted}>
          Calculated using assignment coverage (50%), room distribution (30%),
          and planner action progress (20%).
        </p>

        {renderProgress(scoreBreakdown.overall)}
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.muted}>Total furniture</span>
          <strong style={styles.number}>{validFurniture.length}</strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>Assigned</span>
          <strong style={styles.number}>{assignedFurniture.length}</strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>Unassigned</span>
          <strong style={styles.number}>{unassignedFurniture.length}</strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>Total rooms</span>
          <strong style={styles.number}>{totalRooms}</strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>Crowded rooms</span>
          <strong style={styles.number}>{crowdedRooms.length}</strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>Pending actions</span>
          <strong style={styles.number}>{pendingActions.length}</strong>
        </div>
      </div>

      <div style={styles.toolbar}>
        <button style={styles.button} onClick={refreshData}>
          Refresh Score
        </button>

        <button style={styles.secondaryButton} onClick={exportReport}>
          Export Score Report
        </button>
      </div>

      <div style={styles.section}>
        <h3>Score breakdown</h3>

        <div style={styles.row}>
          <strong>Assignment coverage</strong>
          <strong>{scoreBreakdown.coverage}/100</strong>
        </div>
        {renderProgress(scoreBreakdown.coverage)}

        <div style={styles.row}>
          <strong>Room distribution</strong>
          <strong>{scoreBreakdown.distribution}/100</strong>
        </div>
        {renderProgress(scoreBreakdown.distribution)}

        <div style={styles.row}>
          <strong>Planner action progress</strong>
          <strong>{scoreBreakdown.actionProgress}/100</strong>
        </div>
        {renderProgress(scoreBreakdown.actionProgress)}
      </div>

      <div style={styles.section}>
        <h3>Improvement suggestions</h3>

        {suggestions.map((suggestion, index) => (
          <div key={index} style={styles.listItem}>
            {index + 1}. {suggestion}
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h3>Room distribution details</h3>

        {roomCounts.size === 0 ? (
          <div style={styles.empty}>
            No room assignments were found.
          </div>
        ) : (
          Array.from(roomCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([room, count]) => (
              <div key={room} style={styles.listItem}>
                <div style={styles.row}>
                  <strong>{room}</strong>
                  <span>{count} furniture item(s)</span>
                </div>

                <span style={styles.muted}>
                  {count >= 8
                    ? "Review recommended"
                    : count >= 5
                      ? "Check room capacity"
                      : "No crowding flag from current rule"}
                </span>
              </div>
            ))
        )}
      </div>

      <div style={styles.section}>
        <h3>Furniture assignment details</h3>

        <div style={styles.toolbar}>
          <input
            style={styles.input}
            placeholder="Search furniture or room..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {filteredFurniture.length === 0 ? (
          <div style={styles.empty}>No matching furniture found.</div>
        ) : (
          filteredFurniture.map((item) => {
            const assignment = assignmentMap.get(String(item.id));

            return (
              <div key={String(item.id)} style={styles.listItem}>
                <div style={styles.row}>
                  <strong>{item.name}</strong>

                  <span
                    style={{
                      color: assignment?.room ? "#15803d" : "#dc2626",
                      fontWeight: 700,
                      fontSize: "13px",
                    }}
                  >
                    {assignment?.room ? "Assigned" : "Unassigned"}
                  </span>
                </div>

                <span style={styles.muted}>
                  Room: {assignment?.room || "Not assigned"}
                </span>
              </div>
            );
          })
        )}
      </div>

      <p style={styles.muted}>
        Scoring rules are indicative planning measures, not a physical
        measurement of room capacity, walking clearance, or furniture
        collisions. Assignment data is read from {ASSIGNMENT_KEY}; planner
        actions are read from {ACTION_KEY}.
      </p>
    </div>
  );
}

export default FurnitureRoomAssignmentOptimizationScore;
