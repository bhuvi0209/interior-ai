
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { FurnitureItem } from "../types/Project";

type ActionStatus = "Pending" | "Accepted" | "Rejected" | "Completed";

interface AuditRecord {
  id?: string;
  furnitureId: string | number;
  furnitureName?: string;
  previousRoom?: string;
  newRoom?: string;
  action?: string;
  notes?: string;
  timestamp?: string;
}

interface ReviewAction {
  id: string;
  furnitureId: string;
  furnitureName: string;
  title: string;
  notes: string;
  status: ActionStatus;
  createdAt: string;
  updatedAt: string;
}

const ACTIONS_STORAGE_KEY = "interior-ai-room-assignment-decisions";
const AUDIT_STORAGE_KEY = "interior-ai-room-assignment-audit";

const styles: Record<string, CSSProperties> = {
  container: {
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
    color: "#222",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    fontSize: "26px",
    marginBottom: "8px",
  },
  description: {
    color: "#666",
    lineHeight: 1.6,
    marginBottom: "22px",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  },
  statCard: {
    padding: "16px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    background: "#fff",
  },
  statNumber: {
    fontSize: "25px",
    fontWeight: 700,
    marginTop: "8px",
  },
  section: {
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    marginBottom: "20px",
    background: "#fff",
  },
  sectionTitle: {
    fontSize: "19px",
    marginTop: 0,
    marginBottom: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "14px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
  },
  button: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "6px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    padding: "8px 12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    background: "#fff",
    color: "#222",
    cursor: "pointer",
  },
  dangerButton: {
    padding: "8px 12px",
    border: "1px solid #dc2626",
    borderRadius: "6px",
    background: "#fff",
    color: "#dc2626",
    cursor: "pointer",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "720px",
  },
  cell: {
    padding: "11px",
    borderBottom: "1px solid #eee",
    textAlign: "left",
    verticalAlign: "top",
    fontSize: "14px",
  },
  muted: {
    color: "#777",
    fontSize: "13px",
  },
  recommendation: {
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    marginBottom: "10px",
  },
};

interface Props {
  furniture: FurnitureItem[];
}

function readStorage<T,>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;

    const parsed: unknown = JSON.parse(saved);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function FurnitureRoomAssignmentActionCenter({
  furniture,
}: Props) {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [reviewActions, setReviewActions] = useState<ReviewAction[]>([]);

  const [selectedFurnitureId, setSelectedFurnitureId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const audit = readStorage<AuditRecord[]>(AUDIT_STORAGE_KEY, []);
    const actions = readStorage<ReviewAction[]>(ACTIONS_STORAGE_KEY, []);

    setAuditRecords(Array.isArray(audit) ? audit : []);
    setReviewActions(Array.isArray(actions) ? actions : []);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        ACTIONS_STORAGE_KEY,
        JSON.stringify(reviewActions)
      );
    } catch (error) {
      console.error("Could not save room assignment decisions:", error);
    }
  }, [reviewActions]);

  const movementCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    auditRecords.forEach((record) => {
      const id = String(record.furnitureId);
      counts[id] = (counts[id] || 0) + 1;
    });

    return counts;
  }, [auditRecords]);

  const frequentMovements = useMemo(() => {
    return furniture
      .map((item) => ({
        id: String(item.id),
        name: item.name,
        category: item.category,
        movements: movementCounts[String(item.id)] || 0,
      }))
      .filter((item) => item.movements >= 3)
      .sort((a, b) => b.movements - a.movements);
  }, [furniture, movementCounts]);

  const filteredActions = useMemo(() => {
    return reviewActions.filter((action) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        action.furnitureName.toLowerCase().includes(searchText) ||
        action.title.toLowerCase().includes(searchText) ||
        action.notes.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || action.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reviewActions, search, statusFilter]);

  const pendingCount = reviewActions.filter(
    (action) => action.status === "Pending"
  ).length;

  const acceptedCount = reviewActions.filter(
    (action) => action.status === "Accepted"
  ).length;

  const rejectedCount = reviewActions.filter(
    (action) => action.status === "Rejected"
  ).length;

  const completedCount = reviewActions.filter(
    (action) => action.status === "Completed"
  ).length;

  function createAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedFurniture = furniture.find(
      (item) => String(item.id) === selectedFurnitureId
    );

    if (!selectedFurniture || !title.trim()) {
      alert("Please select furniture and enter an action title.");
      return;
    }

    const now = new Date().toISOString();

    const newAction: ReviewAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      furnitureId: String(selectedFurniture.id),
      furnitureName: selectedFurniture.name,
      title: title.trim(),
      notes: notes.trim(),
      status: "Pending",
      createdAt: now,
      updatedAt: now,
    };

    setReviewActions((previous) => [newAction, ...previous]);

    setTitle("");
    setNotes("");
    setSelectedFurnitureId("");
  }

  function updateStatus(id: string, status: ActionStatus) {
    setReviewActions((previous) =>
      previous.map((action) =>
        action.id === id
          ? {
              ...action,
              status,
              updatedAt: new Date().toISOString(),
            }
          : action
      )
    );
  }

  function deleteAction(id: string) {
    if (!window.confirm("Delete this action record?")) return;

    setReviewActions((previous) =>
      previous.filter((action) => action.id !== id)
    );
  }

  function exportCSV() {
    const headers = [
      "Furniture",
      "Action Title",
      "Notes",
      "Status",
      "Created At",
      "Updated At",
    ];

    const rows = reviewActions.map((action) => [
      action.furnitureName,
      action.title,
      action.notes,
      action.status,
      action.createdAt,
      action.updatedAt,
    ]);

    const escapeCSV = (value: string) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-room-assignment-actions.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Furniture Room Assignment Action Center
      </h2>

      <p style={styles.description}>
        Review furniture movement insights, create action records, and
        track your room assignment decisions.
      </p>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div>Total Actions</div>
          <div style={styles.statNumber}>{reviewActions.length}</div>
        </div>

        <div style={styles.statCard}>
          <div>Pending</div>
          <div style={styles.statNumber}>{pendingCount}</div>
        </div>

        <div style={styles.statCard}>
          <div>Accepted</div>
          <div style={styles.statNumber}>{acceptedCount}</div>
        </div>

        <div style={styles.statCard}>
          <div>Rejected</div>
          <div style={styles.statNumber}>{rejectedCount}</div>
        </div>

        <div style={styles.statCard}>
          <div>Completed</div>
          <div style={styles.statNumber}>{completedCount}</div>
        </div>
      </div>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>
          Furniture Movement Review
        </h3>

        <p style={styles.muted}>
          Furniture with three or more recorded audit entries is shown
          here for review. This is a simple review indicator, not an
          automatic recommendation to move the furniture.
        </p>

        {frequentMovements.length === 0 ? (
          <p>No furniture currently has three or more audit entries.</p>
        ) : (
          frequentMovements.map((item) => (
            <div key={item.id} style={styles.recommendation}>
              <strong>{item.name}</strong>
              <div style={styles.muted}>
                Category: {item.category || "Not specified"}
              </div>
              <div style={{ marginTop: "6px" }}>
                Recorded audit entries: {item.movements}
              </div>
              <button
                type="button"
                style={{ ...styles.secondaryButton, marginTop: "10px" }}
                onClick={() => {
                  setSelectedFurnitureId(item.id);
                  setTitle(`Review room assignment for ${item.name}`);
                }}
              >
                Create review action
              </button>
            </div>
          ))
        )}
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Create a New Action</h3>

        <form onSubmit={createAction}>
          <div style={styles.field}>
            <label htmlFor="action-furniture">Select furniture</label>
            <select
              id="action-furniture"
              style={styles.input}
              value={selectedFurnitureId}
              onChange={(event) =>
                setSelectedFurnitureId(event.target.value)
              }
              required
            >
              <option value="">Choose furniture</option>
              {furniture.map((item) => (
                <option key={String(item.id)} value={String(item.id)}>
                  {item.name} ({item.category})
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label htmlFor="action-title">Action title</label>
            <input
              id="action-title"
              style={styles.input}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Review sofa placement"
              required
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="action-notes">Notes</label>
            <textarea
              id="action-notes"
              style={{ ...styles.input, minHeight: "90px" }}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Write the reason or next step..."
            />
          </div>

          <button type="submit" style={styles.button}>
            Create Action
          </button>
        </form>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Action Records</h3>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <input
            style={{ ...styles.input, flex: "1 1 220px" }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search furniture or actions..."
          />

          <select
            style={{ ...styles.input, flex: "0 1 180px" }}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
          </select>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={exportCSV}
            disabled={reviewActions.length === 0}
          >
            Export CSV
          </button>
        </div>

        {filteredActions.length === 0 ? (
          <p>No matching action records found.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.cell}>Furniture</th>
                  <th style={styles.cell}>Action</th>
                  <th style={styles.cell}>Notes</th>
                  <th style={styles.cell}>Status</th>
                  <th style={styles.cell}>Update status</th>
                  <th style={styles.cell}>Delete</th>
                </tr>
              </thead>

              <tbody>
                {filteredActions.map((action) => (
                  <tr key={action.id}>
                    <td style={styles.cell}>
                      {action.furnitureName}
                    </td>

                    <td style={styles.cell}>{action.title}</td>

                    <td style={styles.cell}>
                      {action.notes || "—"}
                    </td>

                    <td style={styles.cell}>
                      <strong>{action.status}</strong>
                    </td>

                    <td style={styles.cell}>
                      <select
                        style={styles.input}
                        value={action.status}
                        onChange={(event) =>
                          updateStatus(
                            action.id,
                            event.target.value as ActionStatus
                          )
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>

                    <td style={styles.cell}>
                      <button
                        type="button"
                        style={styles.dangerButton}
                        onClick={() => deleteAction(action.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p style={styles.muted}>
        Action records are stored in this browser using localStorage.
        They are separate from the actual room assignments and audit
        history.
      </p>
    </div>
  );
}

export default FurnitureRoomAssignmentActionCenter;
