
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

interface FurnitureItem {
  id: string | number;
  name: string;
  category: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  visible: boolean;
  locked: boolean;
  width?: number;
  depth?: number;
  height?: number;
  model3D?: string;
}

interface MovementRecord {
  id: string;
  furnitureId: string;
  furnitureName: string;
  previousRoom: string;
  newRoom: string;
  action?: string;
  notes?: string;
  timestamp: string;
}

interface Props {
  furniture: FurnitureItem[];
}

type MovementLevel = "Frequently Moved" | "Occasionally Moved" | "Stable";

const STORAGE_KEY = "interior-ai-room-assignment-audit";

function FurnitureRoomMovementInsights({ furniture }: Props) {
  const [records, setRecords] = useState<MovementRecord[]>([]);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("All");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        setRecords([]);
        return;
      }

      const parsed: unknown = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        setRecords([]);
        return;
      }

      const validRecords = parsed.filter(
        (item): item is MovementRecord =>
          item !== null &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.furnitureId === "string" &&
          typeof item.furnitureName === "string" &&
          typeof item.previousRoom === "string" &&
          typeof item.newRoom === "string" &&
          typeof item.timestamp === "string" &&
          !Number.isNaN(Date.parse(item.timestamp))
      );

      setRecords(validRecords);
    } catch {
      setRecords([]);
    }
  }, []);

  const filteredRecords = useMemo(() => {
    const now = new Date();

    return records.filter(record => {
      const date = new Date(record.timestamp);

      const matchesPeriod =
        period === "All" ||
        (period === "Month" &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()) ||
        (period === "Year" &&
          date.getFullYear() === now.getFullYear());

      const matchesSearch = [
        record.furnitureName,
        record.previousRoom,
        record.newRoom,
        record.notes || ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesPeriod && matchesSearch;
    });
  }, [records, period, search]);

  const furnitureMovementCounts = useMemo(() => {
    const counts = new Map<string, number>();

    filteredRecords.forEach(record => {
      const id = record.furnitureId;
      counts.set(id, (counts.get(id) || 0) + 1);
    });

    return furniture.map(item => ({
      id: String(item.id),
      name: item.name,
      category: item.category,
      count: counts.get(String(item.id)) || 0
    })).sort((a, b) => b.count - a.count);
  }, [furniture, filteredRecords]);

  const roomMovementCounts = useMemo(() => {
    const counts = new Map<string, number>();

    filteredRecords.forEach(record => {
      const transition =
        `${record.previousRoom} → ${record.newRoom}`;

      counts.set(transition, (counts.get(transition) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([transition, count]) => ({ transition, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords]);

  const destinationCounts = useMemo(() => {
    const counts = new Map<string, number>();

    filteredRecords.forEach(record => {
      counts.set(
        record.newRoom,
        (counts.get(record.newRoom) || 0) + 1
      );
    });

    return Array.from(counts.entries())
      .map(([room, count]) => ({ room, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords]);

  const movementLevel = (count: number): MovementLevel => {
    if (count >= 3) return "Frequently Moved";
    if (count >= 1) return "Occasionally Moved";
    return "Stable";
  };

  const totalMovements = filteredRecords.length;

  const movedFurnitureCount = furnitureMovementCounts.filter(
    item => item.count > 0
  ).length;

  const stableFurnitureCount = furnitureMovementCounts.filter(
    item => item.count === 0
  ).length;

  const mostMoved = furnitureMovementCounts.find(
    item => item.count > 0
  );

  const leastMoved = [...furnitureMovementCounts]
    .filter(item => item.count > 0)
    .sort((a, b) => a.count - b.count)[0];

  const mostPopularRoom = destinationCounts[0];

  const maximumFurnitureMoves = Math.max(
    1,
    ...furnitureMovementCounts.map(item => item.count)
  );

  const maximumRoomMoves = Math.max(
    1,
    ...roomMovementCounts.map(item => item.count)
  );

  const exportCSV = () => {
    const headers = [
      "Furniture Name",
      "Furniture ID",
      "Category",
      "Movement Count",
      "Movement Classification"
    ];

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = furnitureMovementCounts.map(item => [
      item.name,
      item.id,
      item.category,
      item.count,
      movementLevel(item.count)
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-room-movement-insights.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2>Furniture Room Movement Insights</h2>
          <p style={styles.subtitle}>
            Understand furniture relocation patterns and room movement trends.
          </p>
        </div>

        <button style={styles.exportButton} onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      <div style={styles.filters}>
        <input
          style={styles.input}
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search furniture or room..."
        />

        <select
          style={styles.input}
          value={period}
          onChange={event => setPeriod(event.target.value)}
        >
          <option value="All">All Time</option>
          <option value="Month">This Month</option>
          <option value="Year">This Year</option>
        </select>
      </div>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <span>Total Movements</span>
          <strong>{totalMovements}</strong>
        </div>

        <div style={styles.statCard}>
          <span>Furniture Relocated</span>
          <strong>{movedFurnitureCount}</strong>
        </div>

        <div style={styles.statCard}>
          <span>Stable Furniture</span>
          <strong>{stableFurnitureCount}</strong>
        </div>

        <div style={styles.statCard}>
          <span>Destination Rooms</span>
          <strong>{destinationCounts.length}</strong>
        </div>
      </div>

      <section style={styles.insightPanel}>
        <h3>Key Insights</h3>

        <div style={styles.insightGrid}>
          <div style={styles.insightCard}>
            <span style={styles.insightLabel}>Most Moved Furniture</span>
            <strong>{mostMoved?.name || "No movement data"}</strong>
            <small>
              {mostMoved
                ? `${mostMoved.count} recorded movements`
                : "Add audit records to see insights"}
            </small>
          </div>

          <div style={styles.insightCard}>
            <span style={styles.insightLabel}>Least Moved Furniture</span>
            <strong>{leastMoved?.name || "No movement data"}</strong>
            <small>
              {leastMoved
                ? `${leastMoved.count} recorded movements`
                : "No furniture has been relocated"}
            </small>
          </div>

          <div style={styles.insightCard}>
            <span style={styles.insightLabel}>Popular Destination</span>
            <strong>{mostPopularRoom?.room || "No destination data"}</strong>
            <small>
              {mostPopularRoom
                ? `${mostPopularRoom.count} movements to this room`
                : "No destination recorded"}
            </small>
          </div>
        </div>
      </section>

      <section style={styles.panel}>
        <h3>Furniture Movement Ranking</h3>
        <p style={styles.helpText}>
          Furniture is ranked by its number of recorded movements
          in the selected period.
        </p>

        {furnitureMovementCounts.length === 0 ? (
          <p style={styles.empty}>No furniture available in this project.</p>
        ) : (
          furnitureMovementCounts.map((item, index) => (
            <div key={item.id} style={styles.rankingItem}>
              <div style={styles.rankingHeader}>
                <div style={styles.nameGroup}>
                  <span style={styles.rank}>#{index + 1}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <small style={styles.category}>
                      {item.category}
                    </small>
                  </div>
                </div>

                <div style={styles.countGroup}>
                  <strong>{item.count}</strong>
                  <span style={styles.level}>
                    {movementLevel(item.count)}
                  </span>
                </div>
              </div>

              <div style={styles.track}>
                <div
                  style={{
                    ...styles.bar,
                    width: `${(item.count / maximumFurnitureMoves) * 100}%`,
                    background:
                      item.count >= 3
                        ? "#dc6b42"
                        : item.count >= 1
                          ? "#2563eb"
                          : "#16a34a"
                  }}
                />
              </div>
            </div>
          ))
        )}
      </section>

      <div style={styles.twoColumns}>
        <section style={styles.panel}>
          <h3>Room-to-Room Movement Patterns</h3>

          {roomMovementCounts.length === 0 ? (
            <p style={styles.empty}>No room transitions recorded.</p>
          ) : (
            roomMovementCounts.map(item => (
              <div key={item.transition} style={styles.chartItem}>
                <div style={styles.chartHeader}>
                  <span>{item.transition}</span>
                  <strong>{item.count}</strong>
                </div>

                <div style={styles.track}>
                  <div
                    style={{
                      ...styles.bar,
                      width: `${(item.count / maximumRoomMoves) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </section>

        <section style={styles.panel}>
          <h3>Popular Destination Rooms</h3>

          {destinationCounts.length === 0 ? (
            <p style={styles.empty}>No destination data available.</p>
          ) : (
            destinationCounts.map(item => (
              <div key={item.room} style={styles.chartItem}>
                <div style={styles.chartHeader}>
                  <span>{item.room}</span>
                  <strong>{item.count}</strong>
                </div>

                <div style={styles.track}>
                  <div
                    style={{
                      ...styles.bar,
                      background: "#0f766e",
                      width: `${(item.count / Math.max(
                        1,
                        ...destinationCounts.map(room => room.count)
                      )) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <section style={styles.panel}>
        <h3>Movement Classification</h3>

        <div style={styles.classificationGrid}>
          <div style={styles.classificationCard}>
            <strong>Frequently Moved</strong>
            <span>3 or more movements</span>
            <b>
              {furnitureMovementCounts.filter(
                item => item.count >= 3
              ).length}
            </b>
          </div>

          <div style={styles.classificationCard}>
            <strong>Occasionally Moved</strong>
            <span>1–2 movements</span>
            <b>
              {furnitureMovementCounts.filter(
                item => item.count >= 1 && item.count < 3
              ).length}
            </b>
          </div>

          <div style={styles.classificationCard}>
            <strong>Stable</strong>
            <span>No recorded movements</span>
            <b>{stableFurnitureCount}</b>
          </div>
        </div>
      </section>

      <p style={styles.footer}>
        Insights are calculated from the Day 88 room assignment audit
        history and the furniture currently available in your project.
      </p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: 24,
    margin: "20px 0",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    color: "#1f2937"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20
  },
  subtitle: {
    color: "#64748b",
    marginTop: 5
  },
  exportButton: {
    padding: "10px 16px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer"
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginBottom: 20
  },
  input: {
    width: "100%",
    padding: 11,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    boxSizing: "border-box",
    background: "#fff",
    color: "#1f2937"
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
    gap: 12,
    marginBottom: 20
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    padding: 17,
    background: "#f1f5f9",
    borderRadius: 10
  },
  insightPanel: {
    padding: 18,
    marginBottom: 16,
    background: "#eff6ff",
    borderRadius: 10
  },
  insightGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 12
  },
  insightCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 14,
    background: "#ffffff",
    borderRadius: 9,
    overflowWrap: "anywhere"
  },
  insightLabel: {
    color: "#64748b",
    fontSize: 12
  },
  panel: {
    padding: 18,
    marginBottom: 16,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    minWidth: 0
  },
  helpText: {
    color: "#64748b",
    fontSize: 13
  },
  rankingItem: {
    padding: "12px 0",
    borderBottom: "1px solid #e2e8f0"
  },
  rankingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 9
  },
  nameGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10
  },
  rank: {
    fontWeight: 700,
    color: "#64748b"
  },
  category: {
    display: "block",
    color: "#64748b",
    marginTop: 3
  },
  countGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 3
  },
  level: {
    fontSize: 11,
    color: "#64748b"
  },
  track: {
    width: "100%",
    height: 9,
    background: "#e2e8f0",
    borderRadius: 20,
    overflow: "hidden"
  },
  bar: {
    height: "100%",
    background: "#2563eb",
    borderRadius: 20
  },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 16
  },
  chartItem: {
    marginBottom: 16
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 13,
    marginBottom: 7
  },
  classificationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12
  },
  classificationCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 15,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 9
  },
  footer: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 12
  },
  empty: {
    padding: 12,
    color: "#94a3b8"
  }
};

export default FurnitureRoomMovementInsights;
