
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

type StabilityItem = {
  id: string;
  name: string;
  category: string;
  movementCount: number;
  score: number;
  status: "Stable" | "Moderate movement" | "Frequent movement";
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
  item: {
    padding: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    marginBottom: "10px",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "10px",
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
    background: "#2563eb",
    transition: "width 0.2s ease",
  },
  badge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    background: "#e2e8f0",
    color: "#334155",
    fontSize: "12px",
    fontWeight: 600,
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

  const days = period === "30days" ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(now.getDate() - days);

  return date >= cutoff && date <= now;
}

function getStabilityScore(movementCount: number): number {
  // Each recorded movement reduces the score by 20 points.
  // The score cannot go below zero.
  return Math.max(0, 100 - movementCount * 20);
}

function getStatus(
  movementCount: number
): StabilityItem["status"] {
  if (movementCount === 0) return "Stable";
  if (movementCount <= 2) return "Moderate movement";
  return "Frequent movement";
}

function exportCsv(items: StabilityItem[]) {
  const headers = [
    "Furniture",
    "Category",
    "Recorded Movements",
    "Stability Score",
    "Status",
  ];

  const escapeCsv = (value: string | number) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const rows = items.map((item) => [
    item.name,
    item.category,
    item.movementCount,
    item.score,
    item.status,
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
  link.download = "furniture-room-stability-report.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function FurnitureRoomStabilityScore({
  furniture,
}: {
  furniture: FurnitureItem[];
}) {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodFilter>("all");

  useEffect(() => {
    setAuditRecords(readAuditRecords());
  }, []);

  const periodRecords = useMemo(() => {
    return auditRecords.filter((record) =>
      isWithinPeriod(record, period)
    );
  }, [auditRecords, period]);

  const stabilityItems = useMemo<StabilityItem[]>(() => {
    const movementCounts = new Map<string, number>();

    periodRecords.forEach((record) => {
      const id = String(record.furnitureId);
      movementCounts.set(id, (movementCounts.get(id) || 0) + 1);
    });

    return furniture.map((item) => {
      const id = String(item.id);
      const movementCount = movementCounts.get(id) || 0;

      return {
        id,
        name: item.name,
        category: item.category || "Uncategorized",
        movementCount,
        score: getStabilityScore(movementCount),
        status: getStatus(movementCount),
      };
    });
  }, [furniture, periodRecords]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return stabilityItems
      .filter((item) => {
        return (
          !query ||
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.score - b.score);
  }, [stabilityItems, search]);

  const totalFurniture = stabilityItems.length;

  const overallScore =
    totalFurniture === 0
      ? 0
      : Math.round(
          stabilityItems.reduce((sum, item) => sum + item.score, 0) /
            totalFurniture
        );

  const stableCount = stabilityItems.filter(
    (item) => item.status === "Stable"
  ).length;

  const moderateCount = stabilityItems.filter(
    (item) => item.status === "Moderate movement"
  ).length;

  const frequentCount = stabilityItems.filter(
    (item) => item.status === "Frequent movement"
  ).length;

  const totalMovements = periodRecords.length;

  const recommendations = useMemo(() => {
    const messages: string[] = [];

    const frequentlyMoved = stabilityItems.filter(
      (item) => item.movementCount >= 3
    );

    if (frequentlyMoved.length > 0) {
      messages.push(
        `${frequentlyMoved.length} furniture item(s) have been moved at least 3 times in the selected period. Review whether their current room placement meets their needs.`
      );
    }

    const moderate = stabilityItems.filter(
      (item) => item.movementCount > 0 && item.movementCount < 3
    );

    if (moderate.length > 0) {
      messages.push(
        `${moderate.length} furniture item(s) have some recorded movement. Monitor these items to see whether the changes are temporary or recurring.`
      );
    }

    if (stableCount > 0) {
      messages.push(
        `${stableCount} furniture item(s) have no recorded movements in the selected period. This indicates no recorded changes, not necessarily that their placement is ideal.`
      );
    }

    if (totalFurniture === 0) {
      messages.push(
        "There are no furniture items in the current project to score."
      );
    }

    return messages;
  }, [stabilityItems, stableCount, totalFurniture]);

  const scoreDescription =
    overallScore >= 80
      ? "Few recorded movements"
      : overallScore >= 50
      ? "Some recorded movement"
      : "Many recorded movements";

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Furniture Room Stability Score
      </h2>

      <p style={styles.description}>
        Measure how often furniture has changed rooms based on your
        saved room assignment audit history. Higher scores indicate
        fewer recorded movements.
      </p>

      <div style={styles.controls}>
        <input
          type="text"
          style={styles.input}
          placeholder="Search furniture or category..."
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
          onClick={() => {
            setSearch("");
            setPeriod("all");
          }}
        >
          Reset Filters
        </button>
      </div>

      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Overall stability score</div>
          <div style={styles.cardValue}>{overallScore}/100</div>
          <div style={styles.muted}>{scoreDescription}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Total furniture</div>
          <div style={styles.cardValue}>{totalFurniture}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Recorded movements</div>
          <div style={styles.cardValue}>{totalMovements}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Stable items</div>
          <div style={styles.cardValue}>{stableCount}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Moderate movement</div>
          <div style={styles.cardValue}>{moderateCount}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Frequent movement</div>
          <div style={styles.cardValue}>{frequentCount}</div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Stability recommendations
        </h3>

        {recommendations.map((message, index) => (
          <div key={index} style={styles.recommendation}>
            {message}
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Furniture stability breakdown
        </h3>

        {filteredItems.length === 0 ? (
          <div style={styles.empty}>
            No furniture items match your search.
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
                  <strong>{item.score}/100</strong>
                  <div>
                    <span style={styles.badge}>{item.status}</span>
                  </div>
                </div>
              </div>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${item.score}%`,
                    background:
                      item.score >= 80
                        ? "#16a34a"
                        : item.score >= 50
                        ? "#d97706"
                        : "#dc2626",
                  }}
                />
              </div>

              <p style={{ ...styles.muted, marginBottom: 0 }}>
                {item.movementCount} recorded movement(s) in the
                selected period.
              </p>
            </div>
          ))
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Stability score calculation
        </h3>

        <p style={styles.muted}>
          Each furniture item starts at 100 points. Every recorded
          room movement reduces its score by 20 points, down to a
          minimum of 0.
        </p>

        <ul style={styles.muted}>
          <li>100 points: no recorded movements.</li>
          <li>80–60 points: 1–2 recorded movements.</li>
          <li>40 points or below: 3 or more recorded movements.</li>
        </ul>

        <p style={styles.muted}>
          The overall score is the average of the individual scores
          for furniture in the current project.
        </p>
      </div>

      <p style={styles.muted}>
        This score is an indicative measure based only on saved Day 88
        audit records. It does not verify the actual physical location
        of furniture or automatically update room assignments.
      </p>
    </div>
  );
}

export default FurnitureRoomStabilityScore;
