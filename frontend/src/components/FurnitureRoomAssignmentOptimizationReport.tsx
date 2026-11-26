
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
    lineHeight: 1.5,
    marginBottom: "20px",
  },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "18px",
  },
  button: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    padding: "10px 15px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    fontWeight: 600,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  },
  stat: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "16px",
  },
  number: {
    display: "block",
    fontSize: "25px",
    fontWeight: 700,
    marginTop: "7px",
  },
  muted: {
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  section: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "18px",
    marginBottom: "16px",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "14px",
  },
  cell: {
    padding: "11px 9px",
    borderBottom: "1px solid #e2e8f0",
  },
  empty: {
    padding: "18px",
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
        furnitureName:
          typeof item.furnitureName === "string"
            ? item.furnitureName
            : undefined,
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

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return replacements[character];
  });
}

function downloadCSV(
  furnitureRows: {
    name: string;
    id: string | number;
    room: string;
    assignmentStatus: string;
  }[],
  actions: PlannerAction[]
) {
  const headers = [
    "Record Type",
    "Furniture Name",
    "Furniture ID",
    "Room",
    "Assignment Status",
    "Suggestion",
    "Priority",
    "Planner Status",
  ];

  const furnitureData = furnitureRows.map((item) => [
    "Furniture",
    item.name,
    item.id,
    item.room,
    item.assignmentStatus,
    "",
    "",
    "",
  ]);

  const actionData = actions.map((action) => [
    "Planner Action",
    action.furnitureName,
    action.furnitureId,
    action.currentRoom,
    "",
    action.suggestion,
    action.priority,
    action.status,
  ]);

  const escapeCell = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [headers, ...furnitureData, ...actionData]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "interior-ai-room-optimization-report.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function printReport(report: {
  generatedAt: string;
  score: number;
  assigned: number;
  unassigned: number;
  total: number;
  roomRows: { room: string; count: number }[];
  furnitureRows: {
    name: string;
    id: string | number;
    room: string;
    assignmentStatus: string;
  }[];
  actions: PlannerAction[];
  recommendations: string[];
  pending: number;
  reviewed: number;
  completed: number;
}) {
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    window.alert(
      "The report window was blocked. Please allow pop-ups and try again."
    );
    return;
  }

  const furnitureTable = report.furnitureRows
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${escapeHtml(item.id)}</td>
          <td>${escapeHtml(item.room)}</td>
          <td>${escapeHtml(item.assignmentStatus)}</td>
        </tr>`
    )
    .join("");

  const roomTable = report.roomRows
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.room)}</td>
          <td>${item.count}</td>
        </tr>`
    )
    .join("");

  const actionTable = report.actions
    .map(
      (action) => `
        <tr>
          <td>${escapeHtml(action.furnitureName)}</td>
          <td>${escapeHtml(action.currentRoom)}</td>
          <td>${escapeHtml(action.suggestion)}</td>
          <td>${escapeHtml(action.priority)}</td>
          <td>${escapeHtml(action.status)}</td>
        </tr>`
    )
    .join("");

  const recommendationList = report.recommendations
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Interior AI - Room Optimization Report</title>
        <meta charset="UTF-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #1e293b;
            padding: 28px;
            line-height: 1.5;
          }
          h1 { margin-bottom: 5px; }
          h2 {
            margin-top: 28px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 7px;
          }
          .muted { color: #64748b; font-size: 13px; }
          .score {
            font-size: 34px;
            font-weight: bold;
            margin: 12px 0;
          }
          .summary {
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
            padding: 16px;
            background: #f1f5f9;
            border-radius: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          th, td {
            text-align: left;
            border: 1px solid #cbd5e1;
            padding: 8px;
            font-size: 12px;
          }
          th { background: #f1f5f9; }
          li { margin-bottom: 8px; }
          .note {
            margin-top: 24px;
            font-size: 12px;
            color: #64748b;
          }
          @media print {
            body { padding: 0; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>Interior AI</h1>
        <h2>Furniture Room Assignment Optimization Report</h2>
        <p class="muted">Generated: ${escapeHtml(report.generatedAt)}</p>

        <div class="summary">
          <div>
            <strong>Optimization readiness score</strong>
            <div class="score">${report.score}/100</div>
          </div>
          <div><strong>Total furniture:</strong> ${report.total}</div>
          <div><strong>Assigned:</strong> ${report.assigned}</div>
          <div><strong>Unassigned:</strong> ${report.unassigned}</div>
        </div>

        <h2>Room distribution</h2>
        <table>
          <thead><tr><th>Room</th><th>Furniture count</th></tr></thead>
          <tbody>${roomTable || "<tr><td colspan='2'>No room assignments found</td></tr>"}</tbody>
        </table>

        <h2>Furniture assignment details</h2>
        <table>
          <thead>
            <tr>
              <th>Furniture</th><th>ID</th><th>Room</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${furnitureTable || "<tr><td colspan='4'>No furniture found</td></tr>"}</tbody>
        </table>

        <h2>Planner action summary</h2>
        <p>
          Pending: ${report.pending} |
          Reviewed: ${report.reviewed} |
          Completed: ${report.completed}
        </p>

        <table>
          <thead>
            <tr>
              <th>Furniture</th><th>Current room</th><th>Suggestion</th>
              <th>Priority</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${actionTable || "<tr><td colspan='5'>No planner actions found</td></tr>"}</tbody>
        </table>

        <h2>Recommendations</h2>
        <ul>${recommendationList}</ul>

        <p class="note">
          This is a rule-based planning report. It does not measure actual room
          capacity, walking clearance, furniture dimensions or physical fit.
          Recommendations do not automatically change furniture assignments.
        </p>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();

  printWindow.onload = () => {
    printWindow.print();
  };
}

function FurnitureRoomAssignmentOptimizationReport({
  furniture,
}: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    readAssignments()
  );

  const [actions, setActions] = useState<PlannerAction[]>(() =>
    readActions()
  );

  const [generatedAt, setGeneratedAt] = useState(() =>
    new Date().toLocaleString()
  );

  const refreshReport = () => {
    setAssignments(readAssignments());
    setActions(readActions());
    setGeneratedAt(new Date().toLocaleString());
  };

  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();

    assignments.forEach((assignment) => {
      if (assignment.room.trim()) {
        map.set(String(assignment.furnitureId), assignment);
      }
    });

    return map;
  }, [assignments]);

  const furnitureRows = furniture.map((item) => {
    const assignment = assignmentMap.get(String(item.id));

    return {
      id: item.id,
      name: item.name,
      room: assignment?.room || "Not assigned",
      assignmentStatus: assignment ? "Assigned" : "Unassigned",
    };
  });

  const assignedCount = furnitureRows.filter(
    (item) => item.assignmentStatus === "Assigned"
  ).length;

  const unassignedCount = furniture.length - assignedCount;

  const roomMap = new Map<string, number>();

  furnitureRows.forEach((item) => {
    if (item.assignmentStatus === "Assigned") {
      roomMap.set(item.room, (roomMap.get(item.room) || 0) + 1);
    }
  });

  const roomRows = Array.from(roomMap.entries())
    .map(([room, count]) => ({ room, count }))
    .sort((a, b) => b.count - a.count);

  const pendingCount = actions.filter(
    (action) => action.status === "Pending"
  ).length;

  const reviewedCount = actions.filter(
    (action) => action.status === "Reviewed"
  ).length;

  const completedCount = actions.filter(
    (action) => action.status === "Completed"
  ).length;

  const assignmentCoverage =
    furniture.length === 0 ? 100 : (assignedCount / furniture.length) * 100;

  const roomsNeedingReview = roomRows.filter((room) => room.count >= 5);

  const roomReviewScore =
    roomsNeedingReview.length === 0
      ? 100
      : Math.max(0, 100 - roomsNeedingReview.length * 20);

  const plannerCompletion =
    actions.length === 0
      ? 100
      : ((completedCount + reviewedCount * 0.5) / actions.length) * 100;

  const overallScore = Math.round(
    assignmentCoverage * 0.6 +
      roomReviewScore * 0.25 +
      plannerCompletion * 0.15
  );

  const recommendations = [
    ...(unassignedCount > 0
      ? [
          `Assign rooms to the ${unassignedCount} furniture item(s) currently unassigned.`,
        ]
      : []),
    ...roomsNeedingReview.map(
      (room) =>
        `Review ${room.room}: it has ${room.count} assigned furniture items.`
    ),
    ...(pendingCount > 0
      ? [
          `Review the ${pendingCount} pending optimization planner action(s).`,
        ]
      : []),
    ...(actions.length === 0
      ? [
          "Generate a Day 102 optimization plan to include planner recommendations in this report.",
        ]
      : []),
    ...(unassignedCount === 0 &&
    roomsNeedingReview.length === 0 &&
    pendingCount === 0
      ? [
          "No outstanding issues were detected by the current report rules.",
        ]
      : []),
  ];

  const reportData = {
    generatedAt,
    score: overallScore,
    assigned: assignedCount,
    unassigned: unassignedCount,
    total: furniture.length,
    roomRows,
    furnitureRows,
    actions,
    recommendations,
    pending: pendingCount,
    reviewed: reviewedCount,
    completed: completedCount,
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Furniture Room Assignment Optimization Report
      </h2>

      <p style={styles.description}>
        Generate a printable report of furniture assignments, room
        distribution, optimization readiness and Day 102 planner actions.
      </p>

      <div style={styles.toolbar}>
        <button style={styles.button} onClick={refreshReport}>
          Refresh Report
        </button>

        <button
          style={styles.button}
          onClick={() => printReport(reportData)}
        >
          Print / Save as PDF
        </button>

        <button
          style={styles.secondaryButton}
          onClick={() => downloadCSV(furnitureRows, actions)}
        >
          Export CSV
        </button>
      </div>

      <p style={styles.muted}>Report generated: {generatedAt}</p>

      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.muted}>Readiness score</span>
          <strong style={styles.number}>{overallScore}/100</strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>Total furniture</span>
          <strong style={styles.number}>{furniture.length}</strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>Assigned</span>
          <strong style={styles.number}>{assignedCount}</strong>
        </div>

        <div style={styles.stat}>
          <span style={styles.muted}>Unassigned</span>
          <strong style={styles.number}>{unassignedCount}</strong>
        </div>
      </div>

      <div style={styles.section}>
        <h3>1. Furniture assignment details</h3>

        {furnitureRows.length === 0 ? (
          <div style={styles.empty}>No furniture is available in this project.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cell}>Furniture</th>
                <th style={styles.cell}>Room</th>
                <th style={styles.cell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {furnitureRows.map((item) => (
                <tr key={String(item.id)}>
                  <td style={styles.cell}>{item.name}</td>
                  <td style={styles.cell}>{item.room}</td>
                  <td style={styles.cell}>{item.assignmentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={styles.section}>
        <h3>2. Room distribution</h3>

        {roomRows.length === 0 ? (
          <div style={styles.empty}>No room assignments found.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cell}>Room</th>
                <th style={styles.cell}>Furniture count</th>
                <th style={styles.cell}>Review status</th>
              </tr>
            </thead>
            <tbody>
              {roomRows.map((room) => (
                <tr key={room.room}>
                  <td style={styles.cell}>{room.room}</td>
                  <td style={styles.cell}>{room.count}</td>
                  <td style={styles.cell}>
                    {room.count >= 5 ? "Review recommended" : "No flag"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p style={styles.muted}>
          The report flags rooms with 5 or more items for review. This is a
          simple rule, not a measurement of actual room capacity.
        </p>
      </div>

      <div style={styles.section}>
        <h3>3. Planner action summary</h3>

        <div style={styles.stats}>
          <div style={styles.stat}>
            <span style={styles.muted}>Pending</span>
            <strong style={styles.number}>{pendingCount}</strong>
          </div>

          <div style={styles.stat}>
            <span style={styles.muted}>Reviewed</span>
            <strong style={styles.number}>{reviewedCount}</strong>
          </div>

          <div style={styles.stat}>
            <span style={styles.muted}>Completed</span>
            <strong style={styles.number}>{completedCount}</strong>
          </div>

          <div style={styles.stat}>
            <span style={styles.muted}>Total actions</span>
            <strong style={styles.number}>{actions.length}</strong>
          </div>
        </div>

        {actions.length === 0 ? (
          <div style={styles.empty}>
            No Day 102 planner actions found. Generate a plan in Day 102 to
            include its recommendations here.
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.cell}>Furniture</th>
                <th style={styles.cell}>Suggestion</th>
                <th style={styles.cell}>Priority</th>
                <th style={styles.cell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id}>
                  <td style={styles.cell}>{action.furnitureName}</td>
                  <td style={styles.cell}>{action.suggestion}</td>
                  <td style={styles.cell}>{action.priority}</td>
                  <td style={styles.cell}>{action.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={styles.section}>
        <h3>4. Recommendations</h3>

        {recommendations.map((recommendation, index) => (
          <p key={index}>• {recommendation}</p>
        ))}
      </div>

      <p style={styles.muted}>
        Data sources: {ASSIGNMENT_KEY} and {ACTION_KEY}. This report is
        read-only. It does not change furniture assignments or planner actions.
        The readiness score follows the Day 103 weighted scoring rules.
      </p>
    </div>
  );
}

export default FurnitureRoomAssignmentOptimizationReport;
