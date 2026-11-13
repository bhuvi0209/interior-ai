
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type FurnitureItem = {
  id: string | number;
  name: string;
  category?: string;
};

type AuditRecord = {
  id: string;
  furnitureId: string;
  furnitureName: string;
  previousRoom: string;
  newRoom: string;
  action: string;
  notes: string;
  timestamp: string;
};

type PeriodFilter = "all" | "30days" | "90days" | "year";

type MovementStat = {
  name: string;
  count: number;
};

type TransitionStat = {
  from: string;
  to: string;
  count: number;
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
    margin: "0 0 20px",
    lineHeight: 1.5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "16px",
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
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "18px",
    marginBottom: "18px",
  },
  sectionTitle: {
    fontSize: "17px",
    fontWeight: 700,
    margin: "0 0 14px",
  },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginBottom: "18px",
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    fontSize: "14px",
    minWidth: "190px",
    flex: "1 1 190px",
  },
  select: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    fontSize: "14px",
    background: "#ffffff",
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
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  listRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    flexWrap: "wrap",
  },
  muted: {
    color: "#64748b",
    fontSize: "13px",
  },
  count: {
    fontWeight: 700,
    color: "#1d4ed8",
  },
  recommendation: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "13px",
    lineHeight: 1.5,
  },
  empty: {
    color: "#64748b",
    padding: "18px",
    textAlign: "center",
    background: "#f8fafc",
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
    textAlign: "left",
    padding: "11px",
    background: "#f1f5f9",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    textAlign: "left",
    padding: "11px",
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

function getDate(record: AuditRecord): Date | null {
  const date = new Date(record.timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinPeriod(
  record: AuditRecord,
  period: PeriodFilter
): boolean {
  if (period === "all") return true;

  const date = getDate(record);
  if (!date) return false;

  const now = new Date();

  if (period === "year") {
    return date.getFullYear() === now.getFullYear();
  }

  const days = period === "30days" ? 30 : 90;
  const cutoff = new Date();
  cutoff.setDate(now.getDate() - days);

  return date >= cutoff && date <= now;
}

function downloadCsv(records: AuditRecord[]) {
  const headers = [
    "Furniture",
    "Previous Room",
    "New Room",
    "Action",
    "Notes",
    "Date",
  ];

  const escapeCsv = (value: string) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const rows = records.map((record) => [
    record.furnitureName,
    record.previousRoom,
    record.newRoom,
    record.action,
    record.notes,
    record.timestamp,
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
  link.download = "furniture-room-movement-forecast.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function FurnitureRoomMovementForecast({
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

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return auditRecords.filter((record) => {
      const matchesPeriod = isWithinPeriod(record, period);

      const searchableText = [
        record.furnitureName,
        record.previousRoom,
        record.newRoom,
        record.action,
        record.notes,
      ]
        .join(" ")
        .toLowerCase();

      return matchesPeriod && (!query || searchableText.includes(query));
    });
  }, [auditRecords, search, period]);

  const furnitureStats = useMemo<MovementStat[]>(() => {
    const counts = new Map<string, number>();

    filteredRecords.forEach((record) => {
      const key = record.furnitureName;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords]);

  const destinationStats = useMemo<MovementStat[]>(() => {
    const counts = new Map<string, number>();

    filteredRecords.forEach((record) => {
      const room = record.newRoom.trim() || "Unspecified";
      counts.set(room, (counts.get(room) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRecords]);

  const transitionStats = useMemo<TransitionStat[]>(() => {
    const counts = new Map<string, TransitionStat>();

    filteredRecords.forEach((record) => {
      const from = record.previousRoom.trim() || "Unspecified";
      const to = record.newRoom.trim() || "Unspecified";
      const key = `${from}|||${to}`;

      const existing = counts.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { from, to, count: 1 });
      }
    });

    return Array.from(counts.values()).sort(
      (a, b) => b.count - a.count
    );
  }, [filteredRecords]);

  const movedFurnitureCount = furnitureStats.length;
  const destinationRoomCount = destinationStats.length;
  const repeatedFurnitureCount = furnitureStats.filter(
    (item) => item.count >= 3
  ).length;

  
  const popularDestination = destinationStats[0];
  const mostCommonTransition = transitionStats[0];

  const recommendations = useMemo(() => {
    const messages: string[] = [];

    const frequentlyMoved = furnitureStats.filter(
      (item) => item.count >= 3
    );

    if (frequentlyMoved.length > 0) {
      messages.push(
        `${frequentlyMoved.length} furniture item(s) have at least 3 recorded movements. Review whether they need a more suitable permanent location.`
      );
    }

    if (mostCommonTransition && mostCommonTransition.count >= 2) {
      messages.push(
        `The movement from ${mostCommonTransition.from} to ${mostCommonTransition.to} appears repeatedly. Review whether this room arrangement is working well.`
      );
    }

    if (popularDestination) {
      messages.push(
        `${popularDestination.name} is the most common destination in the selected period, with ${popularDestination.count} recorded movement(s). Check that the room has enough available space.`
      );
    }

    if (filteredRecords.length === 0) {
      messages.push(
        "No movement records match the selected filters. Add audit records in the Day 88 Room Assignment Audit component to generate insights."
      );
    }

    if (
      filteredRecords.length > 0 &&
      frequentlyMoved.length === 0 &&
      (!mostCommonTransition || mostCommonTransition.count < 2)
    ) {
      messages.push(
        "No strong repeated movement pattern was found in the selected records. Continue recording room changes to build a more useful history."
      );
    }

    return messages;
  }, [
    furnitureStats,
    mostCommonTransition,
    popularDestination,
    filteredRecords.length,
  ]);

  const currentFurnitureCount = furniture.length;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Furniture Room Movement Forecast
      </h2>

      <p style={styles.description}>
        Review recorded room movements, identify repeated patterns,
        and get rule-based suggestions for improving furniture placement.
      </p>

      <div style={styles.controls}>
        <input
          style={styles.input}
          type="text"
          placeholder="Search furniture, rooms, or notes..."
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
          style={styles.button}
          onClick={() => downloadCsv(filteredRecords)}
          disabled={filteredRecords.length === 0}
        >
          Export CSV
        </button>

        <button
          style={{
            ...styles.button,
            background: "#475569",
          }}
          onClick={() => {
            setSearch("");
            setPeriod("all");
          }}
        >
          Reset Filters
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Recorded movements</div>
          <div style={styles.cardValue}>{filteredRecords.length}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Furniture items moved</div>
          <div style={styles.cardValue}>{movedFurnitureCount}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Destination rooms</div>
          <div style={styles.cardValue}>{destinationRoomCount}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Frequently moved items</div>
          <div style={styles.cardValue}>{repeatedFurnitureCount}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Furniture in project</div>
          <div style={styles.cardValue}>{currentFurnitureCount}</div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Movement recommendations
        </h3>

        <div style={styles.list}>
          {recommendations.map((message, index) => (
            <div key={index} style={styles.recommendation}>
              {message}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Most frequently moved furniture
        </h3>

        {furnitureStats.length === 0 ? (
          <div style={styles.empty}>No furniture movement data found.</div>
        ) : (
          <div style={styles.list}>
            {furnitureStats.map((item) => (
              <div key={item.name} style={styles.listRow}>
                <div>
                  <strong>{item.name}</strong>
                  <div style={styles.muted}>
                    {item.count >= 3
                      ? "Review recommended: moved frequently"
                      : item.count >= 2
                      ? "Moved more than once"
                      : "One recorded movement"}
                  </div>
                </div>

                <span style={styles.count}>
                  {item.count} movement(s)
                </span>
              </div>
            ))}
          </div>
        )}

        <p style={{ ...styles.muted, marginTop: "12px" }}>
          The frequently moved label uses a simple threshold of 3 or
          more recorded movements.
        </p>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Most common destination rooms
        </h3>

        {destinationStats.length === 0 ? (
          <div style={styles.empty}>No destination room data found.</div>
        ) : (
          <div style={styles.list}>
            {destinationStats.map((item) => (
              <div key={item.name} style={styles.listRow}>
                <strong>{item.name}</strong>
                <span style={styles.count}>
                  {item.count} arrival(s)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Repeated room-to-room movement patterns
        </h3>

        {transitionStats.length === 0 ? (
          <div style={styles.empty}>No room transition data found.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Previous room</th>
                  <th style={styles.th}>Destination room</th>
                  <th style={styles.th}>Recorded movements</th>
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
          Recorded movement history
        </h3>

        {filteredRecords.length === 0 ? (
          <div style={styles.empty}>
            No audit records match your search or selected period.
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Furniture</th>
                  <th style={styles.th}>From</th>
                  <th style={styles.th}>To</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime()
                  )
                  .map((record, index) => (
                    <tr key={record.id || index}>
                      <td style={styles.td}>
                        {record.furnitureName}
                      </td>
                      <td style={styles.td}>
                        {record.previousRoom || "Unspecified"}
                      </td>
                      <td style={styles.td}>
                        {record.newRoom || "Unspecified"}
                      </td>
                      <td style={styles.td}>
                        {getDate(record)
                          ? getDate(record)!.toLocaleDateString()
                          : record.timestamp}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p style={styles.muted}>
        Forecasts and recommendations are calculated from the saved
        Day 88 audit history. They are suggestions only and do not
        automatically change furniture assignments.
      </p>
    </div>
  );
}

export default FurnitureRoomMovementForecast;
