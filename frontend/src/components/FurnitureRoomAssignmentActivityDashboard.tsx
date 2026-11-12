
import { useEffect, useMemo, useState } from "react";

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

interface ActivityRecord {
  id: string;
  furnitureId: string;
  furnitureName: string;
  previousRoom: string;
  newRoom: string;
  action: string;
  notes: string;
  timestamp: string;
}

interface Props {
  furniture: FurnitureItem[];
}

const STORAGE_KEY = "interior-ai-room-assignment-audit";

function FurnitureRoomAssignmentActivityDashboard({ furniture }: Props) {
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("All");
  const [period, setPeriod] = useState("All");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          const valid = parsed.filter(
            (item): item is ActivityRecord =>
              item !== null &&
              typeof item === "object" &&
              typeof item.id === "string" &&
              typeof item.furnitureId === "string" &&
              typeof item.furnitureName === "string" &&
              typeof item.previousRoom === "string" &&
              typeof item.newRoom === "string" &&
              typeof item.timestamp === "string"
          );

          setRecords(valid);
        }
      }
    } catch {
      setRecords([]);
    }
  }, []);

  const validRecords = useMemo(
    () =>
      records.filter(record =>
        !Number.isNaN(Date.parse(record.timestamp))
      ),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const now = new Date();

    return validRecords.filter(record => {
      const date = new Date(record.timestamp);

      const matchesSearch = [
        record.furnitureName,
        record.previousRoom,
        record.newRoom,
        record.notes
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesRoom =
        roomFilter === "All" ||
        record.previousRoom === roomFilter ||
        record.newRoom === roomFilter;

      let matchesPeriod = true;

      if (period === "Month") {
        matchesPeriod =
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear();
      }

      if (period === "Year") {
        matchesPeriod = date.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesRoom && matchesPeriod;
    });
  }, [validRecords, search, roomFilter, period]);

  const roomOptions = useMemo(
    () =>
      Array.from(
        new Set(
          validRecords.flatMap(record => [
            record.previousRoom,
            record.newRoom
          ])
        )
      ).sort(),
    [validRecords]
  );

  const totalMovements = filteredRecords.length;

  const uniqueFurniture = new Set(
    filteredRecords.map(record => record.furnitureId)
  ).size;

  const destinationCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredRecords.forEach(record => {
      counts[record.newRoom] =
        (counts[record.newRoom] || 0) + 1;
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredRecords]);

  const furnitureCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredRecords.forEach(record => {
      counts[record.furnitureName] =
        (counts[record.furnitureName] || 0) + 1;
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredRecords]);

  const monthlyCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredRecords.forEach(record => {
      const date = new Date(record.timestamp);

      const month = date.toLocaleString("en-US", {
        month: "short",
        year: "numeric"
      });

      counts[month] = (counts[month] || 0) + 1;
    });

    return Object.entries(counts).slice(-12);
  }, [filteredRecords]);

  const exportCSV = () => {
    const headers = [
      "Furniture",
      "Furniture ID",
      "Previous Room",
      "New Room",
      "Action",
      "Notes",
      "Timestamp"
    ];

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = filteredRecords.map(record => [
      record.furnitureName,
      record.furnitureId,
      record.previousRoom,
      record.newRoom,
      record.action,
      record.notes,
      record.timestamp
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
    link.download = "furniture-room-activity-dashboard.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const maxDestination = Math.max(
    1,
    ...destinationCounts.map(([, count]) => count)
  );

  const maxFurniture = Math.max(
    1,
    ...furnitureCounts.map(([, count]) => count)
  );

  const maxMonthly = Math.max(
    1,
    ...monthlyCounts.map(([, count]) => count)
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2>Furniture Room Activity Dashboard</h2>
          <p style={styles.subtitle}>
            Analyze furniture relocation activity and room movements.
          </p>
        </div>

        <button style={styles.exportButton} onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      <div style={styles.filters}>
        <input
          style={styles.input}
          placeholder="Search furniture or room..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />

        <select
          style={styles.input}
          value={roomFilter}
          onChange={event => setRoomFilter(event.target.value)}
        >
          <option value="All">All Rooms</option>
          {roomOptions.map(room => (
            <option key={room} value={room}>
              {room}
            </option>
          ))}
        </select>

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
          <strong>{uniqueFurniture}</strong>
        </div>

        <div style={styles.statCard}>
          <span>Destination Rooms</span>
          <strong>{destinationCounts.length}</strong>
        </div>

        <div style={styles.statCard}>
          <span>Furniture in Project</span>
          <strong>{furniture.length}</strong>
        </div>
      </div>

      <div style={styles.grid}>
        <section style={styles.panel}>
          <h3>Popular Destination Rooms</h3>

          {destinationCounts.length === 0 ? (
            <p style={styles.empty}>No room activity available.</p>
          ) : (
            destinationCounts.map(([room, count]) => (
              <div key={room} style={styles.chartItem}>
                <div style={styles.chartLabel}>
                  <span>{room}</span>
                  <strong>{count}</strong>
                </div>

                <div style={styles.track}>
                  <div
                    style={{
                      ...styles.bar,
                      width: `${(count / maxDestination) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </section>

        <section style={styles.panel}>
          <h3>Frequently Relocated Furniture</h3>

          {furnitureCounts.length === 0 ? (
            <p style={styles.empty}>No furniture activity available.</p>
          ) : (
            furnitureCounts.slice(0, 8).map(([name, count]) => (
              <div key={name} style={styles.chartItem}>
                <div style={styles.chartLabel}>
                  <span>{name}</span>
                  <strong>{count}</strong>
                </div>

                <div style={styles.track}>
                  <div
                    style={{
                      ...styles.bar,
                      background: "#0f766e",
                      width: `${(count / maxFurniture) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <section style={styles.panel}>
        <h3>Monthly Movement Activity</h3>

        {monthlyCounts.length === 0 ? (
          <p style={styles.empty}>No monthly data available.</p>
        ) : (
          <div style={styles.monthChart}>
            {monthlyCounts.map(([month, count]) => (
              <div key={month} style={styles.monthColumn}>
                <strong>{count}</strong>

                <div style={styles.monthTrack}>
                  <div
                    style={{
                      ...styles.monthBar,
                      height: `${(count / maxMonthly) * 100}%`
                    }}
                  />
                </div>

                <small>{month}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={styles.panel}>
        <h3>Recent Room Movements</h3>

        {filteredRecords.length === 0 ? (
          <p style={styles.empty}>
            No matching room movement records found.
          </p>
        ) : (
          filteredRecords
            .slice()
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            )
            .slice(0, 20)
            .map(record => (
              <div key={record.id} style={styles.activityCard}>
                <div>
                  <strong>{record.furnitureName}</strong>

                  <p style={styles.movement}>
                    {record.previousRoom} → {record.newRoom}
                  </p>

                  {record.notes && (
                    <small style={styles.note}>
                      {record.notes}
                    </small>
                  )}
                </div>

                <small style={styles.date}>
                  {new Date(record.timestamp).toLocaleDateString()}
                </small>
              </div>
            ))
        )}
      </section>

      <p style={styles.footer}>
        Dashboard data is read from your Day 88 audit history.
        Adding audit records in Day 88 and refreshing this dashboard
        will update the analytics.
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
    marginTop: 4
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
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    marginBottom: 20
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 18,
    background: "#f1f5f9",
    borderRadius: 10
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
    marginBottom: 16
  },
  panel: {
    padding: 18,
    marginBottom: 16,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    minWidth: 0
  },
  chartItem: {
    marginBottom: 16
  },
  chartLabel: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 14,
    marginBottom: 6
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
    borderRadius: 20,
    transition: "width 0.3s ease"
  },
  monthChart: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    height: 190,
    overflowX: "auto",
    paddingTop: 12
  },
  monthColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    height: "100%",
    minWidth: 48,
    fontSize: 12
  },
  monthTrack: {
    display: "flex",
    alignItems: "flex-end",
    width: 26,
    height: 120,
    background: "#e2e8f0",
    borderRadius: 6,
    overflow: "hidden"
  },
  monthBar: {
    width: "100%",
    background: "#7c3aed",
    borderRadius: 6
  },
  activityCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    padding: 13,
    marginBottom: 10,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 8
  },
  movement: {
    color: "#0f766e",
    margin: "6px 0"
  },
  note: {
    color: "#64748b"
  },
  date: {
    color: "#64748b"
  },
  empty: {
    color: "#94a3b8",
    padding: 12
  },
  footer: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 12
  }
};

export default FurnitureRoomAssignmentActivityDashboard;
