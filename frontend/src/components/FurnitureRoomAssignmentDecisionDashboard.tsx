
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type FurnitureItem = {
  id: string | number;
  name: string;
  category?: string;
};

type AuditRecord = {
  id?: string;
  furnitureId: string | number;
  furnitureName: string;
  previousRoom: string;
  newRoom: string;
  action?: string;
  notes?: string;
  timestamp: string;
};

type Priority = "High" | "Medium" | "Low";
type PeriodFilter = "all" | "30days" | "90days" | "year";

type DecisionItem = {
  id: string;
  name: string;
  category: string;
  movementCount: number;
  stabilityScore: number;
  priority: Priority;
  latestDestination: string;
  recommendation: string;
};

const STORAGE_KEY = "interior-ai-room-assignment-audit";

const styles: Record<string, CSSProperties> = {
  container: {
    padding: "24px",
    background: "#f8fafc",
    borderRadius: "12px",
    color: "#1e293b",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    fontSize: "24px",
    fontWeight: 700,
    margin: "0 0 8px",
  },
  description: {
    color: "#64748b",
    lineHeight: 1.5,
    margin: "0 0 20px",
  },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "20px",
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    minWidth: "190px",
    flex: "1 1 190px",
    fontSize: "14px",
  },
  select: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    background: "#ffffff",
    fontSize: "14px",
  },
  button: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "7px",
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
    gap: "14px",
    marginBottom: "20px",
  },
  card: {
    padding: "16px",
    borderRadius: "10px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
  },
  cardLabel: {
    color: "#64748b",
    fontSize: "13px",
    marginBottom: "8px",
  },
  cardValue: {
    fontSize: "26px",
    fontWeight: 700,
  },
  section: {
    padding: "18px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    marginBottom: "18px",
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: 700,
    margin: "0 0 14px",
  },
  item: {
    padding: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    marginBottom: "11px",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "10px",
  },
  badge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 700,
  },
  muted: {
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  progressTrack: {
    height: "10px",
    width: "100%",
    background: "#e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "10px",
  },
  recommendation: {
    padding: "12px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    marginBottom: "9px",
    lineHeight: 1.5,
  },
  empty: {
    padding: "18px",
    textAlign: "center",
    background: "#f8fafc",
    color: "#64748b",
    borderRadius: "8px",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    padding: "11px",
    textAlign: "left",
    background: "#f1f5f9",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "11px",
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0",
  },
};

function readAuditRecords(): AuditRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is AuditRecord => {
      return (
        item !== null &&
        typeof item === "object" &&
        (typeof item.furnitureId === "string" ||
          typeof item.furnitureId === "number") &&
        typeof item.furnitureName === "string" &&
        typeof item.previousRoom === "string" &&
        typeof item.newRoom === "string" &&
        typeof item.timestamp === "string"
      );
    });
  } catch {
    return [];
  }
}

function isWithinPeriod(
  record: AuditRecord,
  period: PeriodFilter
): boolean {
  if (period === "all") return true;

  const date = new Date(record.timestamp);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  if (period === "year") {
    return date.getFullYear() === now.getFullYear();
  }

  const cutoff = new Date();
  cutoff.setDate(now.getDate() - (period === "30days" ? 30 : 90));

  return date >= cutoff && date <= now;
}

function getPriority(movementCount: number): Priority {
  if (movementCount >= 3) return "High";
  if (movementCount >= 1) return "Medium";
  return "Low";
}

function getStabilityScore(movementCount: number): number {
  return Math.max(0, 100 - movementCount * 20);
}

function getRecommendation(
  movementCount: number,
  latestDestination: string
): string {
  if (movementCount >= 5) {
    return `This item has been moved repeatedly. Review its function, accessibility, and available space before choosing a more permanent location. Latest recorded destination: ${latestDestination}.`;
  }

  if (movementCount >= 3) {
    return `This item has several recorded room changes. Review whether its current placement is suitable for its everyday use. Latest recorded destination: ${latestDestination}.`;
  }

  if (movementCount >= 1) {
    return `This item has some recorded movement. Monitor future changes and check whether its current room meets its needs. Latest recorded destination: ${latestDestination}.`;
  }

  return "No room movements are recorded in the selected period. No placement review is suggested by the available history alone.";
}

function exportCsv(items: DecisionItem[]) {
  const headers = [
    "Furniture",
    "Category",
    "Recorded Movements",
    "Stability Score",
    "Priority",
    "Latest Destination",
    "Recommendation",
  ];

  const escapeCsv = (value: string | number) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const rows = items.map((item) => [
    item.name,
    item.category,
    item.movementCount,
    item.stabilityScore,
    item.priority,
    item.latestDestination,
    item.recommendation,
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
  link.download = "furniture-room-decision-dashboard.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function FurnitureRoomAssignmentDecisionDashboard({
  furniture,
}: {
  furniture: FurnitureItem[];
}) {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | Priority
  >("all");

  useEffect(() => {
    setAuditRecords(readAuditRecords());
  }, []);

  const periodRecords = useMemo(() => {
    return auditRecords.filter((record) =>
      isWithinPeriod(record, period)
    );
  }, [auditRecords, period]);

  const decisionItems = useMemo<DecisionItem[]>(() => {
    return furniture.map((item) => {
      const id = String(item.id);

      const itemRecords = periodRecords
        .filter((record) => String(record.furnitureId) === id)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        );

      const movementCount = itemRecords.length;
      const latestDestination =
        itemRecords[0]?.newRoom?.trim() || "Not recorded";

      return {
        id,
        name: item.name,
        category: item.category || "Uncategorized",
        movementCount,
        stabilityScore: getStabilityScore(movementCount),
        priority: getPriority(movementCount),
        latestDestination,
        recommendation: getRecommendation(
          movementCount,
          latestDestination
        ),
      };
    });
  }, [furniture, periodRecords]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return decisionItems
      .filter((item) => {
        const matchesSearch =
          !query ||
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.latestDestination.toLowerCase().includes(query);

        const matchesPriority =
          priorityFilter === "all" ||
          item.priority === priorityFilter;

        return matchesSearch && matchesPriority;
      })
      .sort((a, b) => {
        const order = { High: 0, Medium: 1, Low: 2 };

        return (
          order[a.priority] - order[b.priority] ||
          b.movementCount - a.movementCount
        );
      });
  }, [decisionItems, search, priorityFilter]);

  const totalFurniture = decisionItems.length;
  const totalMovements = periodRecords.length;

  const highPriorityCount = decisionItems.filter(
    (item) => item.priority === "High"
  ).length;

  const mediumPriorityCount = decisionItems.filter(
    (item) => item.priority === "Medium"
  ).length;

  const lowPriorityCount = decisionItems.filter(
    (item) => item.priority === "Low"
  ).length;

  const overallStability =
    totalFurniture === 0
      ? 0
      : Math.round(
          decisionItems.reduce(
            (sum, item) => sum + item.stabilityScore,
            0
          ) / totalFurniture
        );

  const mostMovedItem = [...decisionItems].sort(
    (a, b) => b.movementCount - a.movementCount
  )[0];

  const destinationStats = useMemo(() => {
    const counts = new Map<string, number>();

    periodRecords.forEach((record) => {
      const room = record.newRoom.trim() || "Unspecified";
      counts.set(room, (counts.get(room) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([room, count]) => ({ room, count }))
      .sort((a, b) => b.count - a.count);
  }, [periodRecords]);

  const popularDestination = destinationStats[0];

  const recommendations = useMemo(() => {
    const messages: string[] = [];

    if (highPriorityCount > 0) {
      messages.push(
        `${highPriorityCount} furniture item(s) have 3 or more recorded movements. Review their room suitability, function, and accessibility.`
      );
    }

    if (popularDestination) {
      messages.push(
        `${popularDestination.room} is the most common destination in the selected period, with ${popularDestination.count} recorded arrival(s). Check that the room has adequate space.`
      );
    }

    if (mostMovedItem && mostMovedItem.movementCount > 0) {
      messages.push(
        `${mostMovedItem.name} has the highest recorded movement count (${mostMovedItem.movementCount}). Consider reviewing why it has been relocated repeatedly.`
      );
    }

    if (totalFurniture === 0) {
      messages.push(
        "No furniture items are available in the current project."
      );
    } else if (totalMovements === 0) {
      messages.push(
        "There are no matching movement records for this period. Add room assignment audit records to generate history-based recommendations."
      );
    }

    return messages;
  }, [
    highPriorityCount,
    popularDestination,
    mostMovedItem,
    totalFurniture,
    totalMovements,
  ]);

  const getPriorityStyle = (priority: Priority): CSSProperties => {
    if (priority === "High") {
      return {
        ...styles.badge,
        background: "#fee2e2",
        color: "#991b1b",
      };
    }

    if (priority === "Medium") {
      return {
        ...styles.badge,
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    return {
      ...styles.badge,
      background: "#dcfce7",
      color: "#166534",
    };
  };

  const resetFilters = () => {
    setSearch("");
    setPeriod("all");
    setPriorityFilter("all");
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Furniture Room Assignment Decision Dashboard
      </h2>

      <p style={styles.description}>
        Review furniture movement, room stability, and placement
        recommendations in one dashboard.
      </p>

      <div style={styles.controls}>
        <input
          style={styles.input}
          type="text"
          placeholder="Search furniture, category, or room..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          style={styles.select}
          value={period}
          onChange={(event) =>
            setPeriod(event.target.value as PeriodFilter)
          }
        >
          <option value="all">All time</option>
          <option value="30days">Last 30 days</option>
          <option value="90days">Last 90 days</option>
          <option value="year">This year</option>
        </select>

        <select
          style={styles.select}
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(
              event.target.value as "all" | Priority
            )
          }
        >
          <option value="all">All priorities</option>
          <option value="High">High priority</option>
          <option value="Medium">Medium priority</option>
          <option value="Low">Low priority</option>
        </select>

        <button
          type="button"
          style={styles.button}
          disabled={filteredItems.length === 0}
          onClick={() => exportCsv(filteredItems)}
        >
          Export CSV
        </button>

        <button
          type="button"
          style={{ ...styles.button, background: "#475569" }}
          onClick={resetFilters}
        >
          Reset Filters
        </button>
      </div>

      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Total furniture</div>
          <div style={styles.cardValue}>{totalFurniture}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Recorded movements</div>
          <div style={styles.cardValue}>{totalMovements}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Overall stability</div>
          <div style={styles.cardValue}>{overallStability}/100</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>High priority</div>
          <div style={styles.cardValue}>{highPriorityCount}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Medium priority</div>
          <div style={styles.cardValue}>{mediumPriorityCount}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Low priority</div>
          <div style={styles.cardValue}>{lowPriorityCount}</div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Decision support summary
        </h3>

        {recommendations.map((message, index) => (
          <div key={index} style={styles.recommendation}>
            {message}
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Furniture placement review
        </h3>

        {filteredItems.length === 0 ? (
          <div style={styles.empty}>
            No furniture items match the selected filters.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} style={styles.item}>
              <div style={styles.itemHeader}>
                <div>
                  <strong>{item.name}</strong>
                  <div style={styles.muted}>{item.category}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={getPriorityStyle(item.priority)}>
                    {item.priority} priority
                  </span>
                  <div style={{ marginTop: "7px" }}>
                    <strong>{item.stabilityScore}/100</strong>
                  </div>
                </div>
              </div>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${item.stabilityScore}%`,
                    background:
                      item.stabilityScore >= 80
                        ? "#16a34a"
                        : item.stabilityScore >= 50
                        ? "#d97706"
                        : "#dc2626",
                  }}
                />
              </div>

              <p style={styles.muted}>
                Recorded movements: {item.movementCount}
                {" | "}
                Latest recorded destination: {item.latestDestination}
              </p>

              <p style={{ marginBottom: 0, lineHeight: 1.5 }}>
                {item.recommendation}
              </p>
            </div>
          ))
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Most common destination rooms
        </h3>

        {destinationStats.length === 0 ? (
          <div style={styles.empty}>
            No destination room history found.
          </div>
        ) : (
          destinationStats.map((item) => (
            <div
              key={item.room}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
                padding: "10px 0",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <strong>{item.room}</strong>
              <span style={styles.muted}>
                {item.count} arrival(s)
              </span>
            </div>
          ))
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Decision rules
        </h3>

        <p style={styles.muted}>
          The dashboard uses these simple rules to prioritize furniture
          placement reviews:
        </p>

        <ul style={styles.muted}>
          <li>
            High priority: 3 or more recorded room movements.
          </li>
          <li>
            Medium priority: 1–2 recorded room movements.
          </li>
          <li>
            Low priority: no recorded room movements.
          </li>
          <li>
            Stability score: 100 minus 20 points for each recorded
            movement, with a minimum score of 0.
          </li>
        </ul>

        <p style={styles.muted}>
          A high priority means the placement is worth reviewing. It
          does not prove that the current room is unsuitable.
        </p>
      </div>

      <p style={styles.muted}>
        Data source: Day 88 room assignment audit history and the
        current project furniture list. This dashboard is read-only
        and does not modify furniture assignments.
      </p>
    </div>
  );
}

export default FurnitureRoomAssignmentDecisionDashboard;
