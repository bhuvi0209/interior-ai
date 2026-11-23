
import { useEffect, useMemo, useState } from "react";
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

interface MovementRecord {
  id: string;
  furnitureId: string | number;
  furnitureName: string;
  previousRoom: string;
  newRoom: string;
  timestamp: string;
}

type Priority = "High" | "Medium" | "Low";
type ReviewStatus = "New" | "Reviewed" | "Dismissed";

interface Insight {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: string;
  relatedFurniture: string;
  recommendation: string;
}

interface ReviewState {
  [insightId: string]: ReviewStatus;
}

const ASSIGNMENT_KEY = "interior-ai-room-assignments";
const MOVEMENT_KEY = "interior-ai-room-assignment-audit";
const REVIEW_KEY = "interior-ai-room-insights-review";

const styles: Record<string, CSSProperties> = {
  container: {
    width: "100%",
    padding: "24px",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#1f2937",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  },
  statCard: {
    padding: "16px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#6b7280",
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
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "10px",
    marginBottom: "16px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    background: "#ffffff",
    color: "#1f2937",
    fontSize: "14px",
  },
  insightCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "12px",
    background: "#ffffff",
  },
  badge: {
    display: "inline-block",
    padding: "4px 9px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 700,
  },
  button: {
    border: "none",
    borderRadius: "7px",
    padding: "9px 13px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#ffffff",
  },
  secondaryButton: {
    background: "#e5e7eb",
    color: "#1f2937",
  },
  buttonRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "12px",
  },
  empty: {
    padding: "24px",
    textAlign: "center",
    color: "#6b7280",
    border: "1px dashed #d1d5db",
    borderRadius: "9px",
  },
};

function readArray(key: string): unknown[] {
  try {
    const value = localStorage.getItem(key);
    if (!value) return [];

    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
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

function loadReviewState(): ReviewState {
  try {
    const saved = localStorage.getItem(REVIEW_KEY);
    if (!saved) return {};

    const parsed: unknown = JSON.parse(saved);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const result: ReviewState = {};

    Object.entries(parsed).forEach(([key, value]) => {
      if (
        value === "New" ||
        value === "Reviewed" ||
        value === "Dismissed"
      ) {
        result[key] = value;
      }
    });

    return result;
  } catch {
    return {};
  }
}

function priorityStyle(priority: Priority): CSSProperties {
  if (priority === "High") {
    return { background: "#fee2e2", color: "#991b1b" };
  }

  if (priority === "Medium") {
    return { background: "#fef3c7", color: "#92400e" };
  }

  return { background: "#dcfce7", color: "#166534" };
}

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

interface Props {
  furniture: FurnitureItem[];
}

function FurnitureRoomAssignmentInsights({ furniture }: Props) {
  const [assignments, setAssignments] = useState<RoomAssignment[]>([]);
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [reviewState, setReviewState] = useState<ReviewState>(
    loadReviewState
  );

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  function refreshData() {
    setAssignments(
      readArray(ASSIGNMENT_KEY).filter(validAssignment)
    );

    setMovements(
      readArray(MOVEMENT_KEY).filter(validMovement)
    );
  }

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(reviewState));
  }, [reviewState]);

  const assignmentMap = useMemo(() => {
    const map = new Map<string, string>();

    assignments.forEach((item) => {
      map.set(String(item.furnitureId), item.room.trim());
    });

    return map;
  }, [assignments]);

  const furnitureData = useMemo(() => {
    return furniture.map((item) => ({
      ...item,
      category: item.category || "Uncategorized",
      room: assignmentMap.get(String(item.id)) || "",
    }));
  }, [furniture, assignmentMap]);

  const assignedFurniture = furnitureData.filter(
    (item) => item.room
  );

  const unassignedFurniture = furnitureData.filter(
    (item) => !item.room
  );

  const roomCounts = useMemo(() => {
    const counts = new Map<string, number>();

    assignedFurniture.forEach((item) => {
      counts.set(item.room, (counts.get(item.room) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([room, count]) => ({
      room,
      count,
    }));
  }, [assignedFurniture]);

  const categoryDistribution = useMemo(() => {
    const distribution = new Map<string, Set<string>>();

    assignedFurniture.forEach((item) => {
      if (!distribution.has(item.category)) {
        distribution.set(item.category, new Set());
      }

      distribution.get(item.category)!.add(item.room);
    });

    return Array.from(distribution.entries()).map(
      ([category, rooms]) => ({
        category,
        roomCount: rooms.size,
      })
    );
  }, [assignedFurniture]);

  const movementCounts = useMemo(() => {
    const counts = new Map<string, number>();

    movements.forEach((item) => {
      const id = String(item.furnitureId);
      counts.set(id, (counts.get(id) || 0) + 1);
    });

    return counts;
  }, [movements]);

  const insights = useMemo<Insight[]>(() => {
    const generated: Insight[] = [];

    if (unassignedFurniture.length > 0) {
      generated.push({
        id: "unassigned-furniture",
        title: "Furniture Without Room Assignments",
        description: `${unassignedFurniture.length} furniture item(s) do not have a recorded room assignment.`,
        priority: unassignedFurniture.length >= 3 ? "High" : "Medium",
        category: "Assignment",
        relatedFurniture: unassignedFurniture
          .map((item) => item.name)
          .join(", "),
        recommendation:
          "Review the unassigned furniture and choose an appropriate room for each item.",
      });
    }

    const crowdedRooms = roomCounts.filter((item) => item.count >= 5);

    crowdedRooms.forEach((item) => {
      generated.push({
        id: `crowded-room-${item.room.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        title: `High Furniture Count in ${item.room}`,
        description: `${item.room} contains ${item.count} assigned furniture items.`,
        priority: item.count >= 8 ? "High" : "Medium",
        category: "Room Distribution",
        relatedFurniture: furnitureData
          .filter((f) => f.room === item.room)
          .map((f) => f.name)
          .join(", "),
        recommendation:
          "Review the room layout and check whether the furniture arrangement leaves enough walking space.",
      });
    });

    const frequentlyMoved = furnitureData.filter(
      (item) => (movementCounts.get(String(item.id)) || 0) >= 3
    );

    frequentlyMoved.forEach((item) => {
      const count = movementCounts.get(String(item.id)) || 0;

      generated.push({
        id: `frequent-movement-${String(item.id)}`,
        title: `Frequently Moved: ${item.name}`,
        description: `This furniture item has ${count} recorded room movements.`,
        priority: count >= 5 ? "High" : "Medium",
        category: "Movement",
        relatedFurniture: item.name,
        recommendation:
          "Review whether this furniture has a suitable permanent location and whether repeated moves can be reduced.",
      });
    });

    const categoriesAcrossRooms = categoryDistribution.filter(
      (item) => item.roomCount >= 3
    );

    categoriesAcrossRooms.forEach((item) => {
      generated.push({
        id: `category-distribution-${item.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        title: `${item.category} Across Multiple Rooms`,
        description: `${item.category} furniture is distributed across ${item.roomCount} rooms.`,
        priority: "Low",
        category: "Category Distribution",
        relatedFurniture: item.category,
        recommendation:
          "Review whether the category distribution matches the intended use and design of each room.",
      });
    });

    if (furnitureData.length === 0) {
      generated.push({
        id: "no-furniture",
        title: "No Furniture Available",
        description: "There are no furniture items in the current project.",
        priority: "Low",
        category: "Project",
        relatedFurniture: "None",
        recommendation:
          "Add furniture to the project to begin generating room assignment insights.",
      });
    }

    if (generated.length === 0 && furnitureData.length > 0) {
      generated.push({
        id: "healthy-assignment-overview",
        title: "No Major Assignment Issues Detected",
        description:
          "No unassigned furniture, high-count rooms, or frequent movement patterns were found using the current rules.",
        priority: "Low",
        category: "Overview",
        relatedFurniture: "Current project",
        recommendation:
          "Continue reviewing room layouts and update assignment records when furniture moves.",
      });
    }

    return generated;
  }, [
    unassignedFurniture,
    roomCounts,
    furnitureData,
    movementCounts,
    categoryDistribution,
  ]);

  const filteredInsights = useMemo(() => {
    const query = search.trim().toLowerCase();

    return insights.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.relatedFurniture.toLowerCase().includes(query);

      const matchesPriority =
        priorityFilter === "All" ||
        item.priority === priorityFilter;

      const currentStatus = reviewState[item.id] || "New";

      const matchesStatus =
        statusFilter === "All" || currentStatus === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [insights, search, priorityFilter, statusFilter, reviewState]);

  const highPriorityCount = insights.filter(
    (item) => item.priority === "High"
  ).length;

  const reviewedCount = insights.filter(
    (item) => (reviewState[item.id] || "New") === "Reviewed"
  ).length;

  function updateReview(id: string, status: ReviewStatus) {
    setReviewState((previous) => ({
      ...previous,
      [id]: status,
    }));
  }

  function exportCsv() {
    if (filteredInsights.length === 0) {
      window.alert("There are no insights to export.");
      return;
    }

    const headers = [
      "Title",
      "Description",
      "Priority",
      "Category",
      "Related Furniture",
      "Recommendation",
      "Review Status",
    ];

    const rows = filteredInsights.map((item) => [
      item.title,
      item.description,
      item.priority,
      item.category,
      item.relatedFurniture,
      item.recommendation,
      reviewState[item.id] || "New",
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
    link.download = "furniture-room-assignment-insights.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Furniture Room Assignment Insights
      </h2>

      <p style={styles.description}>
        Rule-based analysis of room assignments, furniture distribution,
        and recorded furniture movements.
      </p>

      <div style={styles.buttonRow}>
        <button
          type="button"
          style={{ ...styles.button, ...styles.primaryButton }}
          onClick={refreshData}
        >
          Refresh Insights
        </button>

        <button
          type="button"
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={exportCsv}
        >
          Export Insights CSV
        </button>
      </div>

      <h3 style={styles.sectionTitle}>Project Overview</h3>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Furniture</div>
          <div style={styles.statValue}>{furnitureData.length}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Assigned Furniture</div>
          <div style={styles.statValue}>{assignedFurniture.length}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Unassigned Furniture</div>
          <div style={styles.statValue}>{unassignedFurniture.length}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Rooms in Use</div>
          <div style={styles.statValue}>{roomCounts.length}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Recorded Movements</div>
          <div style={styles.statValue}>{movements.length}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>High Priority Insights</div>
          <div style={styles.statValue}>{highPriorityCount}</div>
        </div>
      </div>

      <h3 style={styles.sectionTitle}>Insight Review Progress</h3>

      <p style={{ fontSize: "14px", color: "#6b7280" }}>
        {reviewedCount} of {insights.length} current insights marked as
        reviewed.
      </p>

      <div
        style={{
          height: "10px",
          background: "#e5e7eb",
          borderRadius: "20px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width:
              insights.length > 0
                ? `${(reviewedCount / insights.length) * 100}%`
                : "0%",
            background: "#2563eb",
            borderRadius: "20px",
          }}
        />
      </div>

      <h3 style={styles.sectionTitle}>Generated Insights & Recommendations</h3>

      <div style={styles.filters}>
        <input
          style={styles.input}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search insights..."
        />

        <select
          style={styles.input}
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
        >
          <option value="All">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>

        <select
          style={styles.input}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">All Review Statuses</option>
          <option value="New">New</option>
          <option value="Reviewed">Reviewed</option>
          <option value="Dismissed">Dismissed</option>
        </select>
      </div>

      {filteredInsights.length === 0 ? (
        <div style={styles.empty}>
          No insights match your current filters.
        </div>
      ) : (
        filteredInsights.map((item) => {
          const currentStatus = reviewState[item.id] || "New";

          return (
            <div key={item.id} style={styles.insightCard}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <strong>{item.title}</strong>

                <span
                  style={{
                    ...styles.badge,
                    ...priorityStyle(item.priority),
                  }}
                >
                  {item.priority} Priority
                </span>
              </div>

              <p style={{ fontSize: "13px", color: "#6b7280" }}>
                {item.description}
              </p>

              <p style={{ fontSize: "13px" }}>
                <strong>Category:</strong> {item.category}
              </p>

              <p style={{ fontSize: "13px" }}>
                <strong>Related Furniture:</strong> {item.relatedFurniture}
              </p>

              <p style={{ fontSize: "14px" }}>
                <strong>Recommendation:</strong> {item.recommendation}
              </p>

              <div style={styles.buttonRow}>
                <span style={{ fontSize: "13px", alignSelf: "center" }}>
                  Review status:
                </span>

                <select
                  style={{
                    ...styles.input,
                    width: "auto",
                    minWidth: "130px",
                  }}
                  value={currentStatus}
                  onChange={(event) =>
                    updateReview(
                      item.id,
                      event.target.value as ReviewStatus
                    )
                  }
                >
                  <option value="New">New</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
              </div>
            </div>
          );
        })
      )}

      <h3 style={styles.sectionTitle}>Room Distribution Summary</h3>

      {roomCounts.length === 0 ? (
        <div style={styles.empty}>
          No assigned rooms are available for analysis.
        </div>
      ) : (
        roomCounts
          .slice()
          .sort((a, b) => b.count - a.count)
          .map((item) => (
            <div key={item.room} style={styles.insightCard}>
              <strong>{item.room}</strong>
              <p style={{ color: "#6b7280", fontSize: "13px" }}>
                {item.count} furniture item(s)
              </p>
            </div>
          ))
      )}

      <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "18px" }}>
        Recommendations are generated using simple rules from available
        assignment and movement data. They are suggestions, not automatic
        furniture changes or AI predictions.
      </p>
    </div>
  );
}

export default FurnitureRoomAssignmentInsights;
