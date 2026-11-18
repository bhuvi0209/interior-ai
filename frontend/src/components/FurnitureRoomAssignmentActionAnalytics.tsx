
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

interface FurnitureActionSummary {
  furnitureId: string;
  furnitureName: string;
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  completed: number;
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
    gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
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
  progressBackground: {
    height: "13px",
    background: "#e5e7eb",
    borderRadius: "20px",
    overflow: "hidden",
    marginTop: "8px",
    marginBottom: "16px",
  },
  progressFill: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "20px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
    flexWrap: "wrap",
  },
  barBackground: {
    height: "11px",
    background: "#e5e7eb",
    borderRadius: "20px",
    overflow: "hidden",
    flex: 1,
    minWidth: "100px",
  },
  barFill: {
    height: "100%",
    background: "#64748b",
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
    minWidth: "650px",
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

function FurnitureRoomAssignmentActionAnalytics() {
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
      const text = search.toLowerCase();

      const matchesSearch =
        action.furnitureName.toLowerCase().includes(text) ||
        action.title.toLowerCase().includes(text) ||
        action.notes.toLowerCase().includes(text);

      const matchesStatus =
        statusFilter === "All" || action.status === statusFilter;

      const createdDate = new Date(action.createdAt);
      let matchesPeriod = true;

      if (!Number.isNaN(createdDate.getTime())) {
        if (periodFilter === "30 Days") {
          matchesPeriod =
            createdDate >=
            new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (periodFilter === "90 Days") {
          matchesPeriod =
            createdDate >=
            new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        } else if (periodFilter === "This Year") {
          matchesPeriod =
            createdDate.getFullYear() === now.getFullYear();
        }
      } else if (periodFilter !== "All") {
        matchesPeriod = false;
      }

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [actions, search, statusFilter, periodFilter]);

  const total = filteredActions.length;

  const countStatus = (status: ActionStatus) =>
    filteredActions.filter((action) => action.status === status).length;

  const pending = countStatus("Pending");
  const accepted = countStatus("Accepted");
  const rejected = countStatus("Rejected");
  const completed = countStatus("Completed");

  const completionRate =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  const furnitureSummary = useMemo(() => {
    const grouped = new Map<string, FurnitureActionSummary>();

    filteredActions.forEach((action) => {
      const id = String(action.furnitureId);

      if (!grouped.has(id)) {
        grouped.set(id, {
          furnitureId: id,
          furnitureName: action.furnitureName,
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
          completed: 0,
        });
      }

      const summary = grouped.get(id)!;

      summary.total += 1;

      if (action.status === "Pending") summary.pending += 1;
      if (action.status === "Accepted") summary.accepted += 1;
      if (action.status === "Rejected") summary.rejected += 1;
      if (action.status === "Completed") summary.completed += 1;
    });

    return Array.from(grouped.values()).sort(
      (a, b) => b.total - a.total
    );
  }, [filteredActions]);

  const mostReviewed = furnitureSummary[0];

  const dailyActivity = useMemo(() => {
    const grouped = new Map<string, number>();

    filteredActions.forEach((action) => {
      const date = new Date(action.createdAt);

      if (Number.isNaN(date.getTime())) return;

      const key = date.toLocaleDateString();

      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([date, count]) => ({ date, count }))
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      .slice(-10);
  }, [filteredActions]);

  const maximumDailyActivity = Math.max(
    1,
    ...dailyActivity.map((item) => item.count)
  );

  function exportCSV() {
    const headers = [
      "Furniture ID",
      "Furniture Name",
      "Action Title",
      "Notes",
      "Status",
      "Created At",
      "Updated At",
    ];

    const escapeCSV = (value: string) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const rows = filteredActions.map((action) =>
      [
        action.furnitureId,
        action.furnitureName,
        action.title,
        action.notes,
        action.status,
        action.createdAt,
        action.updatedAt,
      ]
        .map(escapeCSV)
        .join(",")
    );

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
    link.download = "furniture-room-action-analytics.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Furniture Room Assignment Action Analytics
      </h2>

      <p style={styles.description}>
        Analyze your Day 95 review actions, track decision progress,
        and understand which furniture items receive the most attention.
      </p>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Analytics Filters</h3>

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
          Analytics below use the selected filters.
        </p>
      </section>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Actions</div>
          <div style={styles.cardValue}>{total}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Pending</div>
          <div style={styles.cardValue}>{pending}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Accepted</div>
          <div style={styles.cardValue}>{accepted}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Rejected</div>
          <div style={styles.cardValue}>{rejected}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Completed</div>
          <div style={styles.cardValue}>{completed}</div>
        </div>
      </div>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Completion Progress</h3>

        <div style={styles.row}>
          <strong>Completed actions</strong>
          <strong>{completionRate}%</strong>
        </div>

        <div style={styles.progressBackground}>
          <div
            style={{
              ...styles.progressFill,
              width: `${completionRate}%`,
            }}
          />
        </div>

        <p style={styles.muted}>
          {completed} of {total} filtered actions are marked Completed.
        </p>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Action Status Distribution</h3>

        {(
          [
            ["Pending", pending],
            ["Accepted", accepted],
            ["Rejected", rejected],
            ["Completed", completed],
          ] as [string, number][]
        ).map(([label, count]) => (
          <div key={label} style={styles.row}>
            <span style={{ width: "100px" }}>{label}</span>

            <div style={styles.barBackground}>
              <div
                style={{
                  ...styles.barFill,
                  width: `${total ? (count / total) * 100 : 0}%`,
                }}
              />
            </div>

            <strong>{count}</strong>
          </div>
        ))}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Furniture Action Breakdown
        </h3>

        {furnitureSummary.length === 0 ? (
          <p>No furniture action records found.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.cell}>Furniture</th>
                  <th style={styles.cell}>Total</th>
                  <th style={styles.cell}>Pending</th>
                  <th style={styles.cell}>Accepted</th>
                  <th style={styles.cell}>Rejected</th>
                  <th style={styles.cell}>Completed</th>
                </tr>
              </thead>

              <tbody>
                {furnitureSummary.map((item) => (
                  <tr key={item.furnitureId}>
                    <td style={styles.cell}>{item.furnitureName}</td>
                    <td style={styles.cell}>{item.total}</td>
                    <td style={styles.cell}>{item.pending}</td>
                    <td style={styles.cell}>{item.accepted}</td>
                    <td style={styles.cell}>{item.rejected}</td>
                    <td style={styles.cell}>{item.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Most Reviewed Furniture</h3>

        {mostReviewed ? (
          <>
            <h2>{mostReviewed.furnitureName}</h2>
            <p>
              This furniture has {mostReviewed.total} action records
              in the selected period.
            </p>
          </>
        ) : (
          <p>No review activity available yet.</p>
        )}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Recent Daily Activity</h3>

        {dailyActivity.length === 0 ? (
          <p>No dated action activity is available.</p>
        ) : (
          dailyActivity.map((item) => (
            <div key={item.date} style={styles.row}>
              <span style={{ width: "120px" }}>{item.date}</span>

              <div style={styles.barBackground}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${
                      (item.count / maximumDailyActivity) * 100
                    }%`,
                  }}
                />
              </div>

              <strong>{item.count}</strong>
            </div>
          ))
        )}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Action Insights</h3>

        {total === 0 ? (
          <p>Create Day 95 actions to start generating analytics.</p>
        ) : (
          <ul>
            <li>
              {pending} actions are still waiting for a decision.
            </li>
            <li>
              {accepted} actions have been accepted.
            </li>
            <li>
              {rejected} actions have been rejected.
            </li>
            <li>
              {completed} actions have been completed.
            </li>
            <li>
              {furnitureSummary.length} furniture items have recorded
              actions.
            </li>
          </ul>
        )}
      </section>

      <p style={styles.muted}>
        This dashboard reads the Day 95 localStorage records. It is
        an analytics-only feature and does not change furniture
        assignments or action statuses.
      </p>
    </div>
  );
}

export default FurnitureRoomAssignmentActionAnalytics;
