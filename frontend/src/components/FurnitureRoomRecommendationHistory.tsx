import { useEffect, useMemo, useState } from "react";
import type { FormEvent, CSSProperties } from "react";

type ReviewStatus = "New" | "Reviewed" | "Dismissed";

interface HistoryRecord {
  id: string;
  recommendationTitle: string;
  furnitureName: string;
  status: ReviewStatus;
  notes: string;
  timestamp: string;
}

const STORAGE_KEY = "interior-ai-room-recommendation-history";

const styles: Record<string, CSSProperties> = {
  container: {
    padding: "24px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    color: "#1f2937",
    width: "100%",
    boxSizing: "border-box",
  },
  heading: {
    fontSize: "24px",
    fontWeight: 700,
    margin: "0 0 8px",
  },
  description: {
    color: "#6b7280",
    margin: "0 0 20px",
    fontSize: "14px",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
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
    fontSize: "24px",
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 700,
    margin: "0 0 14px",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    padding: "18px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    marginBottom: "24px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    background: "#ffffff",
    color: "#111827",
    fontSize: "14px",
  },
  textarea: {
    width: "100%",
    minHeight: "78px",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    background: "#ffffff",
    color: "#111827",
    fontSize: "14px",
    resize: "vertical",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "end",
  },
  button: {
    border: "none",
    borderRadius: "7px",
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "13px",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#ffffff",
  },
  secondaryButton: {
    background: "#e5e7eb",
    color: "#1f2937",
  },
  dangerButton: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    verticalAlign: "top",
  },
  empty: {
    padding: "24px",
    textAlign: "center",
    color: "#6b7280",
  },
  status: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
};

function loadHistory(): HistoryRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is HistoryRecord => {
      return (
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.recommendationTitle === "string" &&
        typeof item.furnitureName === "string" &&
        ["New", "Reviewed", "Dismissed"].includes(item.status) &&
        typeof item.notes === "string" &&
        typeof item.timestamp === "string"
      );
    });
  } catch {
    return [];
  }
}

function getStatusStyle(status: ReviewStatus): CSSProperties {
  if (status === "Reviewed") {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (status === "Dismissed") {
    return { background: "#fee2e2", color: "#991b1b" };
  }

  return { background: "#dbeafe", color: "#1d4ed8" };
}

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function FurnitureRoomRecommendationHistory() {
  const [history, setHistory] = useState<HistoryRecord[]>(loadHistory);

  const [recommendationTitle, setRecommendationTitle] = useState("");
  const [furnitureName, setFurnitureName] = useState("");
  const [status, setStatus] = useState<ReviewStatus>("New");
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const summary = useMemo(() => {
    return {
      total: history.length,
      new: history.filter((item) => item.status === "New").length,
      reviewed: history.filter((item) => item.status === "Reviewed").length,
      dismissed: history.filter((item) => item.status === "Dismissed").length,
    };
  }, [history]);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...history]
      .filter((item) => {
        const matchesSearch =
          !query ||
          item.recommendationTitle.toLowerCase().includes(query) ||
          item.furnitureName.toLowerCase().includes(query) ||
          item.notes.toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "All" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [history, search, statusFilter]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!recommendationTitle.trim() || !furnitureName.trim()) {
      window.alert("Please enter both the recommendation and furniture name.");
      return;
    }

    const newRecord: HistoryRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      recommendationTitle: recommendationTitle.trim(),
      furnitureName: furnitureName.trim(),
      status,
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
    };

    setHistory((previous) => [newRecord, ...previous]);

    setRecommendationTitle("");
    setFurnitureName("");
    setStatus("New");
    setNotes("");
  }

  function updateStatus(id: string, nextStatus: ReviewStatus) {
    setHistory((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, status: nextStatus, timestamp: new Date().toISOString() }
          : item
      )
    );
  }

  function deleteRecord(id: string) {
    if (!window.confirm("Delete this recommendation history record?")) {
      return;
    }

    setHistory((previous) => previous.filter((item) => item.id !== id));
  }

  function clearHistory() {
    if (history.length === 0) {
      return;
    }

    if (!window.confirm("Delete all recommendation history records?")) {
      return;
    }

    setHistory([]);
  }

  function exportCsv() {
    if (filteredHistory.length === 0) {
      window.alert("There are no history records to export.");
      return;
    }

    const headers = [
      "Recommendation",
      "Furniture",
      "Status",
      "Notes",
      "Date",
    ];

    const rows = filteredHistory.map((item) => [
      item.recommendationTitle,
      item.furnitureName,
      item.status,
      item.notes,
      new Date(item.timestamp).toLocaleString(),
    ]);

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-room-recommendation-history.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Furniture Room Recommendation History</h2>

      <p style={styles.description}>
        Record recommendation reviews, track their status, and keep notes about
        room assignment decisions.
      </p>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Records</div>
          <div style={styles.statValue}>{summary.total}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>New</div>
          <div style={styles.statValue}>{summary.new}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Reviewed</div>
          <div style={styles.statValue}>{summary.reviewed}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Dismissed</div>
          <div style={styles.statValue}>{summary.dismissed}</div>
        </div>
      </div>

      <h3 style={styles.sectionTitle}>Add Recommendation Review</h3>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="recommendation-title">
            Recommendation
          </label>
          <input
            id="recommendation-title"
            style={styles.input}
            value={recommendationTitle}
            onChange={(event) => setRecommendationTitle(event.target.value)}
            placeholder="Example: Review frequently moved furniture"
            required
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label} htmlFor="furniture-name">
            Furniture Name
          </label>
          <input
            id="furniture-name"
            style={styles.input}
            value={furnitureName}
            onChange={(event) => setFurnitureName(event.target.value)}
            placeholder="Example: Living Room Sofa"
            required
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label} htmlFor="review-status">
            Review Status
          </label>
          <select
            id="review-status"
            style={styles.input}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ReviewStatus)
            }
          >
            <option value="New">New</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Dismissed">Dismissed</option>
          </select>
        </div>

        <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
          <label style={styles.label} htmlFor="review-notes">
            Review Notes
          </label>
          <textarea
            id="review-notes"
            style={styles.textarea}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Write why this recommendation was reviewed or dismissed..."
          />
        </div>

        <div style={styles.buttonRow}>
          <button
            type="submit"
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            Add to History
          </button>
        </div>
      </form>

      <h3 style={styles.sectionTitle}>Recommendation History Records</h3>

      <div style={styles.filters}>
        <input
          style={styles.input}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search recommendation, furniture, or notes..."
          aria-label="Search recommendation history"
        />

        <select
          style={styles.input}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by review status"
        >
          <option value="All">All Statuses</option>
          <option value="New">New</option>
          <option value="Reviewed">Reviewed</option>
          <option value="Dismissed">Dismissed</option>
        </select>
      </div>

      <div style={styles.buttonRow}>
        <button
          type="button"
          style={{ ...styles.button, ...styles.secondaryButton }}
          onClick={exportCsv}
        >
          Export CSV
        </button>

        <button
          type="button"
          style={{ ...styles.button, ...styles.dangerButton }}
          onClick={clearHistory}
          disabled={history.length === 0}
        >
          Clear All History
        </button>
      </div>

      <div style={{ ...styles.tableWrapper, marginTop: "14px" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Recommendation</th>
              <th style={styles.th}>Furniture</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Notes</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td style={styles.empty} colSpan={6}>
                  No recommendation history records found.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>{item.recommendationTitle}</td>
                  <td style={styles.td}>{item.furnitureName}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.status,
                        ...getStatusStyle(item.status),
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td style={styles.td}>{item.notes || "—"}</td>
                  <td style={styles.td}>
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <select
                        style={{ ...styles.input, minWidth: "120px" }}
                        value={item.status}
                        onChange={(event) =>
                          updateStatus(
                            item.id,
                            event.target.value as ReviewStatus
                          )
                        }
                        aria-label={`Update status for ${item.recommendationTitle}`}
                      >
                        <option value="New">New</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Dismissed">Dismissed</option>
                      </select>

                      <button
                        type="button"
                        style={{ ...styles.button, ...styles.dangerButton }}
                        onClick={() => deleteRecord(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "12px" }}>
        Showing {filteredHistory.length} of {history.length} records.
      </p>
    </div>
  );
}

export default FurnitureRoomRecommendationHistory;