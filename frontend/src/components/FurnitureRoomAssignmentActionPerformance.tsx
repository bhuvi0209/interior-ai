
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type ActionStatus = "Pending" | "Accepted" | "Rejected" | "Completed";

interface ReviewAction {
  id: string;
  furnitureId: string;
  furnitureName: string;
  title: string;
  notes: string;
  status: ActionStatus;
  createdAt: string;
  updatedAt: string;
}

interface FurniturePerformance {
  furnitureId: string;
  furnitureName: string;
  total: number;
  completed: number;
  pending: number;
  accepted: number;
  rejected: number;
  completionRate: number;
}

const STORAGE_KEY = "interior-ai-room-assignment-decisions";

const styles: Record<string, CSSProperties> = {
  container: {
    padding: "24px",
    maxWidth: "1250px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
    color: "#222",
  },
  heading: {
    fontSize: "26px",
    marginBottom: "8px",
  },
  description: {
    color: "#666",
    lineHeight: 1.6,
    marginBottom: "22px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "17px",
    background: "#fff",
  },
  cardLabel: {
    color: "#666",
    fontSize: "14px",
  },
  cardValue: {
    fontSize: "27px",
    fontWeight: 700,
    marginTop: "10px",
  },
  section: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
    background: "#fff",
  },
  sectionTitle: {
    fontSize: "19px",
    marginTop: 0,
    marginBottom: "16px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },
  progressBackground: {
    height: "13px",
    background: "#e5e7eb",
    borderRadius: "20px",
    overflow: "hidden",
    marginTop: "8px",
    marginBottom: "15px",
  },
  progressFill: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "20px",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  button: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "6px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  tableWrapper: {
    overflowX: "auto",
    width: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px",
  },
  cell: {
    padding: "11px",
    borderBottom: "1px solid #eee",
    textAlign: "left",
    fontSize: "14px",
  },
  muted: {
    color: "#777",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  insight: {
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    marginBottom: "10px",
    lineHeight: 1.5,
  },
};

function readActions(): ReviewAction[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is ReviewAction => {
      return (
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.furnitureId === "string" &&
        typeof item.furnitureName === "string" &&
        typeof item.title === "string" &&
        typeof item.notes === "string" &&
        ["Pending", "Accepted", "Rejected", "Completed"].includes(
          item.status
        ) &&
        typeof item.createdAt === "string" &&
        typeof item.updatedAt === "string"
      );
    });
  } catch {
    return [];
  }
}

function getValidDate(value: string): Date | null {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function FurnitureRoomAssignmentActionPerformance() {
  const [actions, setActions] = useState<ReviewAction[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [periodFilter, setPeriodFilter] = useState("All");

  useEffect(() => {
    setActions(readActions());
  }, []);

  const filteredActions = useMemo(() => {
    const now = new Date();

    return actions.filter((action) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        action.furnitureName.toLowerCase().includes(searchText) ||
        action.title.toLowerCase().includes(searchText) ||
        action.notes.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || action.status === statusFilter;

      const createdDate = getValidDate(action.createdAt);
      let matchesPeriod = true;

      if (periodFilter !== "All") {
        if (!createdDate) {
          matchesPeriod = false;
        } else if (periodFilter === "30 Days") {
          matchesPeriod =
            createdDate.getTime() >=
            now.getTime() - 30 * 24 * 60 * 60 * 1000;
        } else if (periodFilter === "90 Days") {
          matchesPeriod =
            createdDate.getTime() >=
            now.getTime() - 90 * 24 * 60 * 60 * 1000;
        } else if (periodFilter === "This Year") {
          matchesPeriod =
            createdDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [actions, search, statusFilter, periodFilter]);

  const total = filteredActions.length;

  const pending = filteredActions.filter(
    (action) => action.status === "Pending"
  ).length;

  const accepted = filteredActions.filter(
    (action) => action.status === "Accepted"
  ).length;

  const rejected = filteredActions.filter(
    (action) => action.status === "Rejected"
  ).length;

  const completed = filteredActions.filter(
    (action) => action.status === "Completed"
  ).length;

  const completionRate =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  // This is a simple progress indicator, not an AI-generated score.
  const performanceScore =
    total > 0
      ? Math.round(
          ((completed + accepted * 0.5) / total) * 100
        )
      : 0;

  const averageCompletionDays = useMemo(() => {
    const completedActions = filteredActions.filter(
      (action) => action.status === "Completed"
    );

    const durations = completedActions
      .map((action) => {
        const created = getValidDate(action.createdAt);
        const updated = getValidDate(action.updatedAt);

        if (!created || !updated) return null;

        const duration =
          (updated.getTime() - created.getTime()) /
          (1000 * 60 * 60 * 24);

        return duration >= 0 ? duration : null;
      })
      .filter((duration): duration is number => duration !== null);

    if (durations.length === 0) return null;

    return (
      durations.reduce((sum, value) => sum + value, 0) /
      durations.length
    );
  }, [filteredActions]);

  const overdueActions = useMemo(() => {
    const now = new Date();

    return filteredActions.filter((action) => {
      if (action.status !== "Pending") return false;

      const created = getValidDate(action.createdAt);

      if (!created) return false;

      const age =
        (now.getTime() - created.getTime()) /
        (1000 * 60 * 60 * 24);

      return age >= 7;
    });
  }, [filteredActions]);

  const furniturePerformance = useMemo(() => {
    const grouped = new Map<string, FurniturePerformance>();

    filteredActions.forEach((action) => {
      const id = String(action.furnitureId);

      if (!grouped.has(id)) {
        grouped.set(id, {
          furnitureId: id,
          furnitureName: action.furnitureName,
          total: 0,
          completed: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
          completionRate: 0,
        });
      }

      const item = grouped.get(id)!;

      item.total += 1;

      if (action.status === "Completed") item.completed += 1;
      if (action.status === "Pending") item.pending += 1;
      if (action.status === "Accepted") item.accepted += 1;
      if (action.status === "Rejected") item.rejected += 1;
    });

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        completionRate:
          item.total > 0
            ? Math.round((item.completed / item.total) * 100)
            : 0,
      }))
      .sort((a, b) => b.completionRate - a.completionRate);
  }, [filteredActions]);

  const insights = useMemo(() => {
    const messages: string[] = [];

    if (total === 0) {
      messages.push(
        "No action records match the selected filters. Create actions in Day 95 to generate performance insights."
      );

      return messages;
    }

    if (pending > 0) {
      messages.push(
        `${pending} action(s) are still pending. Review them to keep your work moving.`
      );
    }

    if (overdueActions.length > 0) {
      messages.push(
        `${overdueActions.length} pending action(s) have been waiting for at least 7 days. Consider reviewing them.`
      );
    }

    if (completionRate >= 80) {
      messages.push(
        "Your completion rate is at least 80% in the selected records."
      );
    } else {
      messages.push(
        "Your completion rate is below 80%. Review pending actions and decide which should be completed."
      );
    }

    if (rejected > 0) {
      messages.push(
        `${rejected} action(s) were rejected. Review their notes if you need to understand why.`
      );
    }

    if (accepted > 0) {
      messages.push(
        `${accepted} action(s) are accepted but not yet completed.`
      );
    }

    return messages;
  }, [
    total,
    pending,
    overdueActions.length,
    completionRate,
    rejected,
    accepted,
  ]);

  function exportCSV() {
    const headers = [
      "Furniture ID",
      "Furniture Name",
      "Action Title",
      "Status",
      "Created At",
      "Updated At",
      "Duration Days",
    ];

    const escapeCSV = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const rows = filteredActions.map((action) => {
      const created = getValidDate(action.createdAt);
      const updated = getValidDate(action.updatedAt);

      const duration =
        created && updated
          ? Math.max(
              0,
              (updated.getTime() - created.getTime()) /
                (1000 * 60 * 60 * 24)
            ).toFixed(2)
          : "";

      return [
        action.furnitureId,
        action.furnitureName,
        action.title,
        action.status,
        action.createdAt,
        action.updatedAt,
        duration,
      ]
        .map(escapeCSV)
        .join(",");
    });

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows,
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-room-action-performance.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Furniture Room Assignment Action Performance
      </h2>

      <p style={styles.description}>
        Understand action completion, pending work, response time,
        and furniture-wise decision performance.
      </p>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Filters</h3>

        <div style={styles.row}>
          <input
            style={{ ...styles.input, flex: "1 1 220px" }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search furniture or action..."
          />

          <select
            style={styles.input}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            style={styles.input}
            value={periodFilter}
            onChange={(event) => setPeriodFilter(event.target.value)}
          >
            <option value="All">All time</option>
            <option value="30 Days">Last 30 days</option>
            <option value="90 Days">Last 90 days</option>
            <option value="This Year">This year</option>
          </select>

          <button
            type="button"
            style={styles.button}
            onClick={exportCSV}
            disabled={filteredActions.length === 0}
          >
            Export CSV
          </button>
        </div>

        <p style={styles.muted}>
          All performance values below use the selected filters.
        </p>
      </section>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Actions</div>
          <div style={styles.cardValue}>{total}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Performance Score</div>
          <div style={styles.cardValue}>{performanceScore}%</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Completion Rate</div>
          <div style={styles.cardValue}>{completionRate}%</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Pending Actions</div>
          <div style={styles.cardValue}>{pending}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Overdue Pending</div>
          <div style={styles.cardValue}>{overdueActions.length}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Average Completion Time</div>
          <div style={styles.cardValue}>
            {averageCompletionDays === null
              ? "N/A"
              : `${averageCompletionDays.toFixed(1)} days`}
          </div>
        </div>
      </div>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Overall Performance</h3>

        <div style={styles.row}>
          <strong>Performance indicator</strong>
          <strong>{performanceScore}%</strong>
        </div>

        <div style={styles.progressBackground}>
          <div
            style={{
              ...styles.progressFill,
              width: `${performanceScore}%`,
            }}
          />
        </div>

        <p style={styles.muted}>
          The indicator gives 1 point for each completed action,
          0.5 for each accepted action, and 0 for pending or rejected
          actions. It is a simple project metric, not an AI score.
        </p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Furniture Performance Ranking</h3>

        {furniturePerformance.length === 0 ? (
          <p>No performance records available.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.cell}>Furniture</th>
                  <th style={styles.cell}>Total</th>
                  <th style={styles.cell}>Completed</th>
                  <th style={styles.cell}>Pending</th>
                  <th style={styles.cell}>Accepted</th>
                  <th style={styles.cell}>Rejected</th>
                  <th style={styles.cell}>Completion</th>
                </tr>
              </thead>

              <tbody>
                {furniturePerformance.map((item) => (
                  <tr key={item.furnitureId}>
                    <td style={styles.cell}>{item.furnitureName}</td>
                    <td style={styles.cell}>{item.total}</td>
                    <td style={styles.cell}>{item.completed}</td>
                    <td style={styles.cell}>{item.pending}</td>
                    <td style={styles.cell}>{item.accepted}</td>
                    <td style={styles.cell}>{item.rejected}</td>
                    <td style={styles.cell}>
                      {item.completionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Pending Actions Requiring Attention
        </h3>

        {overdueActions.length === 0 ? (
          <p>No pending actions have reached the 7-day review threshold.</p>
        ) : (
          overdueActions.map((action) => (
            <div key={action.id} style={styles.insight}>
              <strong>{action.furnitureName}</strong>
              <div>{action.title}</div>
              <p style={styles.muted}>
                Created:{" "}
                {getValidDate(action.createdAt)?.toLocaleDateString() ||
                  "Unknown date"}
              </p>
            </div>
          ))
        )}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Performance Insights</h3>

        {insights.map((message, index) => (
          <div key={index} style={styles.insight}>
            {message}
          </div>
        ))}
      </section>

      <p style={styles.muted}>
        This dashboard reads the Day 95 action records from localStorage.
        It does not update action statuses or move furniture. Completion
        time is calculated using the createdAt and updatedAt timestamps.
        Since updatedAt changes whenever the status changes, this is an
        approximate duration rather than a precise completion timestamp.
      </p>
    </div>
  );
}

export default FurnitureRoomAssignmentActionPerformance;
