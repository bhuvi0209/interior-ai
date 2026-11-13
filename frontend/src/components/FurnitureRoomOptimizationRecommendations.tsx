
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type FurnitureItem = {
  id: string | number;
  name: string;
  category?: string;
};

type AuditRecord = {
  id?: string;
  furnitureId: string;
  furnitureName: string;
  previousRoom: string;
  newRoom: string;
  action?: string;
  notes?: string;
  timestamp: string;
};

type PeriodFilter = "all" | "30days" | "90days" | "year";
type Priority = "High" | "Medium" | "Low";

type Recommendation = {
  furnitureId: string;
  furnitureName: string;
  category: string;
  movementCount: number;
  priority: Priority;
  suggestion: string;
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
    gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
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
  recommendation: {
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    padding: "14px",
    marginBottom: "11px",
  },
  recommendationHeader: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "8px",
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
        typeof item.furnitureId === "string" &&
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

function matchesPeriod(
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

function getPriority(count: number): Priority {
  if (count >= 3) return "High";
  if (count >= 1) return "Medium";
  return "Low";
}

function getSuggestion(count: number): string {
  if (count >= 5) {
    return "This item has been moved many times. Review whether its current room, function, accessibility, and available space are suitable. Consider choosing a more permanent location.";
  }

  if (count >= 3) {
    return "This item has repeated room changes. Review why it keeps being relocated and whether its current placement can be improved.";
  }

  if (count >= 1) {
    return "This item has some recorded movement. Monitor future changes and check whether its current room meets its needs.";
  }

  return "No movement is recorded for this item in the selected period. No relocation review is suggested by this history alone.";
}

function exportRecommendations(items: Recommendation[]) {
  const headers = [
    "Furniture",
    "Category",
    "Movement Count",
    "Priority",
    "Recommendation",
  ];

  const escapeCsv = (value: string | number) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const rows = items.map((item) => [
    item.furnitureName,
    item.category,
    item.movementCount,
    item.priority,
    item.suggestion,
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
  link.download = "furniture-room-optimization-recommendations.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function FurnitureRoomOptimizationRecommendations({
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

  const periodRecords = useMemo(
    () => auditRecords.filter((record) => matchesPeriod(record, period)),
    [auditRecords, period]
  );

  const recommendations = useMemo<Recommendation[]>(() => {
    const counts = new Map<string, number>();

    periodRecords.forEach((record) => {
      const id = String(record.furnitureId);
      counts.set(id, (counts.get(id) || 0) + 1);
    });

    return furniture.map((item) => {
      const id = String(item.id);
      const movementCount = counts.get(id) || 0;

      return {
        furnitureId: id,
        furnitureName: item.name,
        category: item.category || "Uncategorized",
        movementCount,
        priority: getPriority(movementCount),
        suggestion: getSuggestion(movementCount),
      };
    });
  }, [furniture, periodRecords]);

  const filteredRecommendations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return recommendations
      .filter((item) => {
        const matchesSearch =
          !query ||
          item.furnitureName.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.suggestion.toLowerCase().includes(query);

        const matchesPriority =
          priorityFilter === "all" ||
          item.priority === priorityFilter;

        return matchesSearch && matchesPriority;
      })
      .sort((a, b) => {
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        return (
          priorityOrder[a.priority] - priorityOrder[b.priority] ||
          b.movementCount - a.movementCount
        );
      });
  }, [recommendations, search, priorityFilter]);

  const highPriorityCount = recommendations.filter(
    (item) => item.priority === "High"
  ).length;

  const mediumPriorityCount = recommendations.filter(
    (item) => item.priority === "Medium"
  ).length;

  const lowPriorityCount = recommendations.filter(
    (item) => item.priority === "Low"
  ).length;

  const totalMovements = periodRecords.length;

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

  const transitionStats = useMemo(() => {
    const counts = new Map<string, number>();

    periodRecords.forEach((record) => {
      const from = record.previousRoom.trim() || "Unspecified";
      const to = record.newRoom.trim() || "Unspecified";
      const key = `${from}|||${to}`;

      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([key, count]) => {
        const [from, to] = key.split("|||");
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count);
  }, [periodRecords]);

  const resetFilters = () => {
    setSearch("");
    setPeriod("all");
    setPriorityFilter("all");
  };

  const priorityStyle = (priority: Priority): CSSProperties => {
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

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Furniture Room Optimization Recommendations
      </h2>

      <p style={styles.description}>
        Review furniture movement history to identify room placements
        that may benefit from reconsideration. Recommendations are
        based on recorded movement frequency.
      </p>

      <div style={styles.controls}>
        <input
          style={styles.input}
          type="text"
          placeholder="Search furniture or recommendations..."
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
          disabled={filteredRecommendations.length === 0}
          onClick={() =>
            exportRecommendations(filteredRecommendations)
          }
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
          <div style={styles.cardValue}>{furniture.length}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Recorded movements</div>
          <div style={styles.cardValue}>{totalMovements}</div>
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
          Furniture optimization recommendations
        </h3>

        {filteredRecommendations.length === 0 ? (
          <div style={styles.empty}>
            No furniture items match the selected filters.
          </div>
        ) : (
          filteredRecommendations.map((item) => (
            <div
              key={item.furnitureId}
              style={styles.recommendation}
            >
              <div style={styles.recommendationHeader}>
                <div>
                  <strong>{item.furnitureName}</strong>
                  <div style={styles.muted}>{item.category}</div>
                </div>

                <span style={priorityStyle(item.priority)}>
                  {item.priority} priority
                </span>
              </div>

              <p style={{ margin: "8px 0" }}>
                <strong>{item.movementCount}</strong> recorded
                movement(s)
              </p>

              <p style={{ margin: 0, lineHeight: 1.5 }}>
                {item.suggestion}
              </p>
            </div>
          ))
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Frequently used destination rooms
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
          Room-to-room movement patterns
        </h3>

        {transitionStats.length === 0 ? (
          <div style={styles.empty}>
            No room transition records found.
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Previous room</th>
                  <th style={styles.th}>Destination room</th>
                  <th style={styles.th}>Movements</th>
                </tr>
              </thead>

              <tbody>
                {transitionStats.map((item, index) => (
                  <tr key={`${item.from}-${item.to}-${index}`}>
                    <td style={styles.td}>{item.from}</td>
                    <td style={styles.td}>{item.to}</td>
                    <td style={styles.td}>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Priority calculation
        </h3>

        <p style={styles.muted}>
          Priority is calculated from the number of recorded movements
          for each furniture item during the selected period:
        </p>

        <ul style={styles.muted}>
          <li>High: 3 or more movements.</li>
          <li>Medium: 1–2 movements.</li>
          <li>Low: no recorded movements.</li>
        </ul>

        <p style={styles.muted}>
          A high priority means the item's placement is worth reviewing.
          It does not necessarily mean the current room is unsuitable.
        </p>
      </div>

      <p style={styles.muted}>
        This dashboard reads the Day 88 audit history. It does not
        automatically change furniture positions or room assignments.
        Its recommendations are heuristic suggestions, not verified
        space-planning decisions.
      </p>
    </div>
  );
}

export default FurnitureRoomOptimizationRecommendations;
