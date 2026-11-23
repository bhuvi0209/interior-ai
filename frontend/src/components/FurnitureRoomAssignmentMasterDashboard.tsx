
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

interface FurnitureItem {
  id: string | number;
  name: string;
  category?: string;
}

interface RoomAssignment {
  furnitureId: string | number;
  furnitureName?: string;
  room: string;
}

interface RecommendationHistory {
  id: string;
  recommendationTitle: string;
  furnitureName: string;
  status: "New" | "Reviewed" | "Dismissed";
  notes: string;
  timestamp: string;
}

interface MovementRecord {
  id: string;
  furnitureId: string | number;
  furnitureName: string;
  previousRoom: string;
  newRoom: string;
  action?: string;
  notes?: string;
  timestamp: string;
}

type AssignmentFilter = "All" | "Assigned" | "Unassigned";

const ASSIGNMENT_KEY = "interior-ai-room-assignments";
const RECOMMENDATION_KEY =
  "interior-ai-room-recommendation-history";
const MOVEMENT_KEY = "interior-ai-room-assignment-audit";

const styles: Record<string, CSSProperties> = {
  container: {
    width: "100%",
    padding: "24px",
    boxSizing: "border-box",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#1f2937",
  },
  heading: {
    fontSize: "24px",
    fontWeight: 700,
    margin: "0 0 8px",
  },
  description: {
    color: "#6b7280",
    fontSize: "14px",
    margin: "0 0 20px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  },
  statCard: {
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    padding: "16px",
    borderRadius: "10px",
  },
  statLabel: {
    color: "#6b7280",
    fontSize: "13px",
    marginBottom: "8px",
  },
  statValue: {
    fontSize: "25px",
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 700,
    margin: "22px 0 14px",
  },
  progressTrack: {
    height: "10px",
    background: "#e5e7eb",
    borderRadius: "20px",
    overflow: "hidden",
    marginTop: "8px",
  },
  progressFill: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "20px",
    transition: "width 0.2s ease",
  },
  roomCard: {
    border: "1px solid #e5e7eb",
    padding: "14px",
    borderRadius: "9px",
    marginBottom: "10px",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "10px",
    marginBottom: "14px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    background: "#ffffff",
    fontSize: "14px",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "14px",
  },
  button: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "7px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#e5e7eb",
    color: "#1f2937",
  },
  tableWrapper: {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
  },
  table: {
    width: "100%",
    minWidth: "560px",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
  },
  empty: {
    padding: "20px",
    textAlign: "center",
    color: "#6b7280",
  },
  badge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
  },
};

function readArray<T>(key: string): T[] {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function validAssignment(item: unknown): item is RoomAssignment {
  if (!item || typeof item !== "object") return false;

  const value = item as Record<string, unknown>;

  return (
    (typeof value.furnitureId === "string" ||
      typeof value.furnitureId === "number") &&
    typeof value.room === "string"
  );
}

function validRecommendation(
  item: unknown
): item is RecommendationHistory {
  if (!item || typeof item !== "object") return false;

  const value = item as Record<string, unknown>;

  return (
    typeof value.id === "string" &&
    typeof value.recommendationTitle === "string" &&
    typeof value.furnitureName === "string" &&
    ["New", "Reviewed", "Dismissed"].includes(
      String(value.status)
    ) &&
    typeof value.notes === "string" &&
    typeof value.timestamp === "string"
  );
}

function validMovement(item: unknown): item is MovementRecord {
  if (!item || typeof item !== "object") return false;

  const value = item as Record<string, unknown>;

  return (
    typeof value.id === "string" &&
    (typeof value.furnitureId === "string" ||
      typeof value.furnitureId === "number") &&
    typeof value.furnitureName === "string" &&
    typeof value.previousRoom === "string" &&
    typeof value.newRoom === "string" &&
    typeof value.timestamp === "string"
  );
}

function escapeCsv(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

interface Props {
  furniture: FurnitureItem[];
}

function FurnitureRoomAssignmentMasterDashboard({
  furniture,
}: Props) {
  const [assignments, setAssignments] = useState<RoomAssignment[]>([]);
  const [recommendations, setRecommendations] = useState<
    RecommendationHistory[]
  >([]);
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AssignmentFilter>("All");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshDashboard = useCallback(() => {
    const assignmentData = readArray<unknown>(ASSIGNMENT_KEY)
      .filter(validAssignment);

    const recommendationData = readArray<unknown>(
      RECOMMENDATION_KEY
    ).filter(validRecommendation);

    const movementData = readArray<unknown>(MOVEMENT_KEY)
      .filter(validMovement);

    setAssignments(assignmentData);
    setRecommendations(recommendationData);
    setMovements(movementData);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const assignmentByFurniture = useMemo(() => {
    const result = new Map<string, string>();

    assignments.forEach((item) => {
      result.set(String(item.furnitureId), item.room.trim());
    });

    return result;
  }, [assignments]);

  const furnitureRows = useMemo(() => {
    return furniture.map((item) => {
      const room = assignmentByFurniture.get(String(item.id)) || "";

      return {
        id: item.id,
        name: item.name,
        category: item.category || "Uncategorized",
        room,
        assigned: Boolean(room),
      };
    });
  }, [furniture, assignmentByFurniture]);

  const assignedCount = furnitureRows.filter(
    (item) => item.assigned
  ).length;

  const unassignedCount = furnitureRows.length - assignedCount;

  const assignmentPercentage =
    furnitureRows.length > 0
      ? Math.round((assignedCount / furnitureRows.length) * 100)
      : 0;

  const roomDistribution = useMemo(() => {
    const counts = new Map<string, number>();

    furnitureRows.forEach((item) => {
      if (item.room) {
        counts.set(item.room, (counts.get(item.room) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([room, count]) => ({ room, count }))
      .sort((a, b) => b.count - a.count);
  }, [furnitureRows]);

  const filteredFurniture = useMemo(() => {
    const query = search.trim().toLowerCase();

    return furnitureRows.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.room.toLowerCase().includes(query);

      const matchesFilter =
        filter === "All" ||
        (filter === "Assigned" && item.assigned) ||
        (filter === "Unassigned" && !item.assigned);

      return matchesSearch && matchesFilter;
    });
  }, [furnitureRows, search, filter]);

  const recommendationStats = useMemo(() => {
    return {
      total: recommendations.length,
      new: recommendations.filter((item) => item.status === "New").length,
      reviewed: recommendations.filter(
        (item) => item.status === "Reviewed"
      ).length,
      dismissed: recommendations.filter(
        (item) => item.status === "Dismissed"
      ).length,
    };
  }, [recommendations]);

  const recentMovements = useMemo(() => {
    return [...movements]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      )
      .slice(0, 5);
  }, [movements]);

  function exportCsv() {
    const headers = [
      "Furniture ID",
      "Furniture Name",
      "Category",
      "Assigned Room",
      "Assignment Status",
    ];

    const rows = filteredFurniture.map((item) => [
      item.id,
      item.name,
      item.category,
      item.room || "Unassigned",
      item.assigned ? "Assigned" : "Unassigned",
    ]);

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "interior-ai-room-master-dashboard.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Furniture Room Assignment Master Dashboard
      </h2>

      <p style={styles.description}>
        A central overview of furniture assignments, recommendation
        reviews, and recorded room movements.
      </p>

      <div style={styles.buttonRow}>
        <button style={styles.button} onClick={refreshDashboard}>
          Refresh Dashboard
        </button>

        <button
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={exportCsv}
        >
          Export Furniture CSV
        </button>
      </div>

      <p style={{ color: "#6b7280", fontSize: "12px" }}>
        Last refreshed: {lastUpdated.toLocaleString()}
      </p>

      <h3 style={styles.sectionTitle}>Furniture Assignment Overview</h3>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Furniture</div>
          <div style={styles.statValue}>{furnitureRows.length}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Assigned</div>
          <div style={styles.statValue}>{assignedCount}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Unassigned</div>
          <div style={styles.statValue}>{unassignedCount}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Assignment Completion</div>
          <div style={styles.statValue}>{assignmentPercentage}%</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Rooms in Use</div>
          <div style={styles.statValue}>{roomDistribution.length}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Recorded Movements</div>
          <div style={styles.statValue}>{movements.length}</div>
        </div>
      </div>

      <div>
        <strong>Room Assignment Progress</strong>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${assignmentPercentage}%`,
            }}
          />
        </div>
        <p style={{ color: "#6b7280", fontSize: "13px" }}>
          {assignedCount} of {furnitureRows.length} furniture items assigned.
        </p>
      </div>

      <h3 style={styles.sectionTitle}>Recommendation Review Overview</h3>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Reviews</div>
          <div style={styles.statValue}>
            {recommendationStats.total}
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>New</div>
          <div style={styles.statValue}>{recommendationStats.new}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Reviewed</div>
          <div style={styles.statValue}>
            {recommendationStats.reviewed}
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Dismissed</div>
          <div style={styles.statValue}>
            {recommendationStats.dismissed}
          </div>
        </div>
      </div>

      <h3 style={styles.sectionTitle}>Furniture Distribution by Room</h3>

      {roomDistribution.length === 0 ? (
        <p style={styles.empty}>No room assignments found.</p>
      ) : (
        roomDistribution.map((item) => {
          const percentage =
            furnitureRows.length > 0
              ? (item.count / furnitureRows.length) * 100
              : 0;

          return (
            <div key={item.room} style={styles.roomCard}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <strong>{item.room}</strong>
                <span>{item.count} items</span>
              </div>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })
      )}

      <h3 style={styles.sectionTitle}>Furniture Assignment List</h3>

      <div style={styles.filters}>
        <input
          style={styles.input}
          placeholder="Search furniture, category, or room..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          style={styles.input}
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value as AssignmentFilter)
          }
        >
          <option value="All">All Furniture</option>
          <option value="Assigned">Assigned Furniture</option>
          <option value="Unassigned">Unassigned Furniture</option>
        </select>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Furniture</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Assigned Room</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredFurniture.length === 0 ? (
              <tr>
                <td style={styles.empty} colSpan={4}>
                  No furniture records found.
                </td>
              </tr>
            ) : (
              filteredFurniture.map((item) => (
                <tr key={String(item.id)}>
                  <td style={styles.td}>{item.name}</td>
                  <td style={styles.td}>{item.category}</td>
                  <td style={styles.td}>{item.room || "Not assigned"}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        background: item.assigned ? "#dcfce7" : "#fee2e2",
                        color: item.assigned ? "#166534" : "#991b1b",
                      }}
                    >
                      {item.assigned ? "Assigned" : "Unassigned"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 style={styles.sectionTitle}>Recent Furniture Movements</h3>

      {recentMovements.length === 0 ? (
        <p style={styles.empty}>No movement history found.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Furniture</th>
                <th style={styles.th}>Previous Room</th>
                <th style={styles.th}>New Room</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>

            <tbody>
              {recentMovements.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>{item.furnitureName}</td>
                  <td style={styles.td}>{item.previousRoom}</td>
                  <td style={styles.td}>{item.newRoom}</td>
                  <td style={styles.td}>
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "18px" }}>
        Dashboard data is read from your existing browser storage.
        Refresh the dashboard after making changes in other components.
      </p>
    </div>
  );
}

export default FurnitureRoomAssignmentMasterDashboard;
