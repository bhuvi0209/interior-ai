
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

interface HistoryRoom {
  room: string;
  count: number;
}

interface HistoryFurniture {
  id: string;
  name: string;
  room: string;
  assignmentStatus: "Assigned" | "Unassigned";
}

interface HistoryAction {
  id: string;
  status: "Pending" | "Reviewed" | "Completed";
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
  rooms: HistoryRoom[];
  furniture: HistoryFurniture[];
  actions: HistoryAction[];
}

interface TrendRecord extends HistoryRecord {
  coverage: number;
  plannerProgress: number;
}

interface TrendChartProps {
  title: string;
  description: string;
  values: number[];
  labels: string[];
  suffix?: string;
}

const STORAGE_KEY = "interior-ai-room-optimization-history";

const readHistory = (): HistoryRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is HistoryRecord =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.createdAt === "string"
    );
  } catch (error) {
    console.error("Unable to read optimization history:", error);
    return [];
  }
};

const safeNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString();
};

const getCoverage = (record: HistoryRecord): number => {
  const total = safeNumber(record.totalFurniture);

  if (total <= 0) return 0;

  return Math.round(
    (safeNumber(record.assignedFurniture) / total) * 100
  );
};

const getPlannerProgress = (record: HistoryRecord): number => {
  const total = safeNumber(record.totalActions);

  if (total <= 0) return 100;

  const progress =
    safeNumber(record.completedActions) +
    safeNumber(record.reviewedActions) * 0.5;

  return Math.round((progress / total) * 100);
};

const escapeCsv = (value: unknown): string => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

function TrendChart({
  title,
  description,
  values,
  labels,
  suffix = "%",
}: TrendChartProps) {
  const width = 700;
  const height = 220;
  const left = 42;
  const right = 18;
  const top = 20;
  const bottom = 42;

  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;

  const safeValues = values.map((value) =>
    Math.max(0, Math.min(100, safeNumber(value)))
  );

  const points = safeValues.map((value, index) => {
    const x =
      safeValues.length <= 1
        ? left + chartWidth / 2
        : left + (index / (safeValues.length - 1)) * chartWidth;

    const y = top + chartHeight - (value / 100) * chartHeight;

    return { x, y, value };
  });

  const linePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const gridValues = [0, 25, 50, 75, 100];

  return (
    <section style={styles.chartCard}>
      <div style={styles.chartHeading}>
        <div>
          <h3 style={styles.chartTitle}>{title}</h3>
          <p style={styles.muted}>{description}</p>
        </div>

        <strong style={styles.chartLatest}>
          {values.length > 0
            ? `${Math.round(values[values.length - 1])}${suffix}`
            : "—"}
        </strong>
      </div>

      {values.length === 0 ? (
        <div style={styles.chartEmpty}>
          No history snapshots available yet.
        </div>
      ) : (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${title} trend chart`}
            style={{ width: "100%", minWidth: "320px", display: "block" }}
          >
            {gridValues.map((value) => {
              const y = top + chartHeight - (value / 100) * chartHeight;

              return (
                <g key={value}>
                  <line
                    x1={left}
                    y1={y}
                    x2={width - right}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={left - 8}
                    y={y + 4}
                    fontSize="11"
                    textAnchor="end"
                    fill="#6b7280"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            <line
              x1={left}
              y1={top}
              x2={left}
              y2={top + chartHeight}
              stroke="#9ca3af"
            />

            <line
              x1={left}
              y1={top + chartHeight}
              x2={width - right}
              y2={top + chartHeight}
              stroke="#9ca3af"
            />

            {points.length > 1 && (
              <polyline
                points={linePoints}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {points.map((point, index) => (
              <g key={`${labels[index]}-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth="2"
                >
                  <title>
                    {labels[index]}: {point.value}
                    {suffix}
                  </title>
                </circle>

                {(points.length <= 8 ||
                  index === 0 ||
                  index === points.length - 1) && (
                  <text
                    x={point.x}
                    y={height - 12}
                    fontSize="10"
                    textAnchor="middle"
                    fill="#6b7280"
                  >
                    {labels[index]}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      )}

      <p style={styles.chartFootnote}>
        Based on saved Day 105 snapshots. The chart displays values from 0% to
        100%.
      </p>
    </section>
  );
}

function FurnitureRoomAssignmentOptimizationTrends({
  furniture,
}: {
  furniture: {
    id: string | number;
    name: string;
    category?: string;
  }[];
}) {
  const [history, setHistory] = useState<HistoryRecord[]>(() =>
    readHistory()
  );
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const refreshHistory = () => {
    setHistory(readHistory());
  };

  const trends = useMemo<TrendRecord[]>(() => {
    return history
      .map((record) => ({
        ...record,
        score: safeNumber(record.score),
        totalFurniture: safeNumber(record.totalFurniture),
        assignedFurniture: safeNumber(record.assignedFurniture),
        unassignedFurniture: safeNumber(record.unassignedFurniture),
        totalActions: safeNumber(record.totalActions),
        pendingActions: safeNumber(record.pendingActions),
        reviewedActions: safeNumber(record.reviewedActions),
        completedActions: safeNumber(record.completedActions),
        rooms: Array.isArray(record.rooms) ? record.rooms : [],
        furniture: Array.isArray(record.furniture) ? record.furniture : [],
        actions: Array.isArray(record.actions) ? record.actions : [],
        coverage: getCoverage(record),
        plannerProgress: getPlannerProgress(record),
      }))
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );
  }, [history]);

  const displayedTrends = useMemo(() => {
    const filtered = trends.filter((record) => {
      const query = search.toLowerCase();

      return (
        record.title.toLowerCase().includes(query) ||
        formatDate(record.createdAt).toLowerCase().includes(query)
      );
    });

    return sortOrder === "newest"
      ? [...filtered].reverse()
      : filtered;
  }, [trends, search, sortOrder]);

  const latest = trends.length > 0 ? trends[trends.length - 1] : null;
  const previous =
    trends.length > 1 ? trends[trends.length - 2] : null;

  const best = trends.length
    ? trends.reduce((current, item) =>
        item.score > current.score ? item : current
      )
    : null;

  const lowest = trends.length
    ? trends.reduce((current, item) =>
        item.score < current.score ? item : current
      )
    : null;

  const scoreChange =
    latest && previous ? latest.score - previous.score : null;

  const roomComparison = useMemo(() => {
    if (!latest) return [];

    const previousRoomCounts = new Map<string, number>();

    previous?.rooms.forEach((room) => {
      previousRoomCounts.set(room.room, safeNumber(room.count));
    });

    const currentRoomCounts = new Map<string, number>();

    latest.rooms.forEach((room) => {
      currentRoomCounts.set(room.room, safeNumber(room.count));
    });

    const allRooms = new Set([
      ...previousRoomCounts.keys(),
      ...currentRoomCounts.keys(),
    ]);

    return Array.from(allRooms)
      .map((room) => {
        const oldCount = previousRoomCounts.get(room) ?? 0;
        const newCount = currentRoomCounts.get(room) ?? 0;

        return {
          room,
          oldCount,
          newCount,
          change: newCount - oldCount,
        };
      })
      .sort((a, b) => b.newCount - a.newCount);
  }, [latest, previous]);

  const exportCsv = () => {
    if (trends.length === 0) {
      alert("There are no optimization snapshots to export.");
      return;
    }

    const rows = [
      [
        "Snapshot",
        "Date",
        "Optimization Score",
        "Total Furniture",
        "Assigned Furniture",
        "Unassigned Furniture",
        "Assignment Coverage",
        "Total Planner Actions",
        "Pending Actions",
        "Reviewed Actions",
        "Completed Actions",
        "Planner Progress",
        "Room Count",
      ],
      ...trends.map((record) => [
        record.title,
        formatDateTime(record.createdAt),
        record.score,
        record.totalFurniture,
        record.assignedFurniture,
        record.unassignedFurniture,
        `${record.coverage}%`,
        record.totalActions,
        record.pendingActions,
        record.reviewedActions,
        record.completedActions,
        `${record.plannerProgress}%`,
        record.rooms.length,
      ]),
    ];

    const csv = rows
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-room-optimization-trends.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const scoreLabels = trends.map((record) =>
    formatDate(record.createdAt)
  );

  const currentFurnitureCount = furniture.length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>
            Furniture Room Assignment Optimization Trends
          </h2>
          <p style={styles.muted}>
            Track optimization performance across your saved history
            snapshots.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.secondaryButton} onClick={refreshHistory}>
            Refresh History
          </button>

          <button style={styles.primaryButton} onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={styles.infoBanner}>
        <strong>History snapshots: {trends.length}</strong>
        <span>
          Current project furniture: {currentFurnitureCount}. Trends are
          calculated from saved snapshots, not from unsaved changes.
        </span>
      </div>

      {trends.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>No optimization history found</h3>
          <p>
            Save at least one snapshot using the Day 105 Furniture Room
            Assignment Optimization History component. Then click Refresh
            History here.
          </p>
        </div>
      ) : (
        <>
          <div style={styles.metricGrid}>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Latest score</span>
              <strong style={styles.metricValue}>
                {latest?.score.toFixed(1)}%
              </strong>
              <span style={styles.metricNote}>
                {latest ? formatDate(latest.createdAt) : ""}
              </span>
            </div>

            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Best score</span>
              <strong style={styles.metricValue}>
                {best?.score.toFixed(1)}%
              </strong>
              <span style={styles.metricNote}>
                {best ? formatDate(best.createdAt) : ""}
              </span>
            </div>

            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Lowest score</span>
              <strong style={styles.metricValue}>
                {lowest?.score.toFixed(1)}%
              </strong>
              <span style={styles.metricNote}>
                {lowest ? formatDate(lowest.createdAt) : ""}
              </span>
            </div>

            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Change from previous</span>
              <strong
                style={{
                  ...styles.metricValue,
                  color:
                    scoreChange === null
                      ? "#374151"
                      : scoreChange >= 0
                        ? "#15803d"
                        : "#dc2626",
                }}
              >
                {scoreChange === null
                  ? "—"
                  : `${scoreChange > 0 ? "+" : ""}${scoreChange.toFixed(1)}%`}
              </strong>
              <span style={styles.metricNote}>
                {previous ? "Compared with previous snapshot" : "Save another snapshot to compare"}
              </span>
            </div>
          </div>

          <div style={styles.chartGrid}>
            <TrendChart
              title="Optimization Score Trend"
              description="Overall optimization score from each saved snapshot."
              values={trends.map((record) => record.score)}
              labels={scoreLabels}
            />

            <TrendChart
              title="Assignment Coverage Trend"
              description="Percentage of furniture assigned to a room."
              values={trends.map((record) => record.coverage)}
              labels={scoreLabels}
            />

            <TrendChart
              title="Planner Progress Trend"
              description="Completed actions plus half credit for reviewed actions."
              values={trends.map((record) => record.plannerProgress)}
              labels={scoreLabels}
            />
          </div>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>
              Room Distribution Changes
            </h3>

            <p style={styles.muted}>
              Compares the latest saved snapshot with the previous snapshot.
            </p>

            {roomComparison.length === 0 ? (
              <p style={styles.emptyInline}>
                No room distribution data is available in the latest
                snapshots.
              </p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Room</th>
                      <th style={styles.th}>Previous</th>
                      <th style={styles.th}>Latest</th>
                      <th style={styles.th}>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomComparison.map((room) => (
                      <tr key={room.room}>
                        <td style={styles.td}>{room.room}</td>
                        <td style={styles.td}>{room.oldCount}</td>
                        <td style={styles.td}>{room.newCount}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              color:
                                room.change > 0
                                  ? "#15803d"
                                  : room.change < 0
                                    ? "#dc2626"
                                    : "#6b7280",
                              fontWeight: 700,
                            }}
                          >
                            {room.change > 0 ? "+" : ""}
                            {room.change}
                          </span>
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
              Historical Performance Insights
            </h3>

            <div style={styles.insightGrid}>
              <div style={styles.insightCard}>
                <strong>Assignment coverage</strong>
                <p>
                  Latest snapshot has {latest?.coverage ?? 0}% assignment
                  coverage, with {latest?.unassignedFurniture ?? 0} unassigned
                  furniture items.
                </p>
              </div>

              <div style={styles.insightCard}>
                <strong>Planner progress</strong>
                <p>
                  Latest planner progress is {latest?.plannerProgress ?? 0}%.
                  There are {latest?.pendingActions ?? 0} pending actions.
                </p>
              </div>

              <div style={styles.insightCard}>
                <strong>Score movement</strong>
                <p>
                  {scoreChange === null
                    ? "Save another snapshot to compare optimization scores."
                    : scoreChange > 0
                      ? `The optimization score improved by ${scoreChange.toFixed(1)} percentage points compared with the previous snapshot.`
                      : scoreChange < 0
                        ? `The optimization score decreased by ${Math.abs(scoreChange).toFixed(1)} percentage points compared with the previous snapshot.`
                        : "The optimization score has not changed since the previous snapshot."}
                </p>
              </div>
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.historyHeader}>
              <div>
                <h3 style={styles.sectionTitle}>Snapshot History</h3>
                <p style={styles.muted}>
                  Search and review your saved optimization snapshots.
                </p>
              </div>

              <div style={styles.historyControls}>
                <input
                  style={styles.searchInput}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search snapshot or date..."
                />

                <select
                  style={styles.select}
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value as "newest" | "oldest")
                  }
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>

            {displayedTrends.length === 0 ? (
              <p style={styles.emptyInline}>
                No snapshots match your search.
              </p>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Snapshot</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Score</th>
                      <th style={styles.th}>Coverage</th>
                      <th style={styles.th}>Planner progress</th>
                      <th style={styles.th}>Furniture</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTrends.map((record) => (
                      <tr key={record.id}>
                        <td style={styles.td}>{record.title}</td>
                        <td style={styles.td}>
                          {formatDate(record.createdAt)}
                        </td>
                        <td style={styles.td}>
                          {record.score.toFixed(1)}%
                        </td>
                        <td style={styles.td}>
                          {record.coverage}%
                        </td>
                        <td style={styles.td}>
                          {record.plannerProgress}%
                        </td>
                        <td style={styles.td}>
                          {record.assignedFurniture}/
                          {record.totalFurniture}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: "24px",
    color: "#1f2937",
    fontFamily: "Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  heading: {
    fontSize: "24px",
    margin: "0 0 8px",
  },
  muted: {
    color: "#6b7280",
    fontSize: "14px",
    margin: "6px 0",
    lineHeight: 1.5,
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "none",
    borderRadius: "7px",
    padding: "10px 16px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    padding: "10px 16px",
    background: "#ffffff",
    color: "#374151",
    fontWeight: 700,
    cursor: "pointer",
  },
  infoBanner: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "14px 16px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    color: "#1e40af",
    fontSize: "14px",
  },
  emptyState: {
    padding: "35px 20px",
    textAlign: "center",
    border: "1px dashed #cbd5e1",
    borderRadius: "10px",
    background: "#f9fafb",
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "14px",
  },
  metricCard: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "18px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#ffffff",
  },
  metricLabel: {
    color: "#6b7280",
    fontSize: "13px",
  },
  metricValue: {
    fontSize: "27px",
    color: "#111827",
  },
  metricNote: {
    color: "#6b7280",
    fontSize: "12px",
    lineHeight: 1.4,
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  chartCard: {
    minWidth: 0,
    padding: "18px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#ffffff",
  },
  chartHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "12px",
  },
  chartTitle: {
    fontSize: "16px",
    margin: "0",
  },
  chartLatest: {
    color: "#2563eb",
    fontSize: "20px",
    whiteSpace: "nowrap",
  },
  chartEmpty: {
    padding: "35px 10px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px",
  },
  chartFootnote: {
    color: "#9ca3af",
    fontSize: "11px",
    marginBottom: 0,
  },
  section: {
    padding: "18px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#ffffff",
  },
  sectionTitle: {
    fontSize: "18px",
    margin: "0 0 8px",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    marginTop: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "580px",
    fontSize: "13px",
  },
  th: {
    padding: "12px",
    textAlign: "left",
    background: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },
  emptyInline: {
    padding: "18px",
    color: "#6b7280",
    background: "#f9fafb",
    borderRadius: "8px",
  },
  insightGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    marginTop: "14px",
  },
  insightCard: {
    padding: "15px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
  },
  historyControls: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  searchInput: {
    padding: "9px 11px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    minWidth: "190px",
  },
  select: {
    padding: "9px 11px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#ffffff",
  },
};

export default FurnitureRoomAssignmentOptimizationTrends;
