
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { FurnitureItem } from "../types/Project";

interface FurnitureWarrantyTrackerProps {
  furniture: FurnitureItem[];
}

type WarrantyStatus = "Active" | "Expiring Soon" | "Expired";

interface WarrantyRecord {
  id: string;
  furnitureId: string;
  manufacturer: string;
  provider: string;
  duration: string;
  startDate: string;
  expiryDate: string;
  notes: string;
  createdAt: string;
}

const STORAGE_KEY = "interior-ai-day72-warranties";
const EXPIRY_WARNING_DAYS = 30;

function loadWarranties(): WarrantyRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (record) =>
            record &&
            typeof record.id === "string" &&
            typeof record.furnitureId === "string" &&
            typeof record.expiryDate === "string" &&
            typeof record.startDate === "string"
        );
      }
    }
  } catch {
    // Start with an empty list if saved data cannot be read.
  }

  return [];
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getToday(): string {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function getDaysUntilExpiry(expiryDate: string): number {
  const today = getToday();
  const todayTime = new Date(`${today}T00:00:00Z`).getTime();
  const expiryTime = new Date(`${expiryDate}T00:00:00Z`).getTime();

  if (!Number.isFinite(expiryTime)) {
    return Number.NaN;
  }

  return Math.round((expiryTime - todayTime) / 86400000);
}

function getWarrantyStatus(record: WarrantyRecord): WarrantyStatus {
  const days = getDaysUntilExpiry(record.expiryDate);

  if (!Number.isFinite(days) || days < 0) {
    return "Expired";
  }

  if (days <= EXPIRY_WARNING_DAYS) {
    return "Expiring Soon";
  }

  return "Active";
}

function formatDate(value: string): string {
  if (!value) return "Not available";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function escapeCsv(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export default function FurnitureWarrantyTracker({
  furniture,
}: FurnitureWarrantyTrackerProps) {
  const [warranties, setWarranties] =
    useState<WarrantyRecord[]>(loadWarranties);

  const [furnitureId, setFurnitureId] = useState(
    furniture.length > 0 ? String(furniture[0].id) : ""
  );

  const [manufacturer, setManufacturer] = useState("");
  const [provider, setProvider] = useState("");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState(getToday());
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(warranties)
      );
    } catch {
      // Records remain usable while the page is open.
    }
  }, [warranties]);

  const furnitureNames = useMemo(() => {
    return new Map(
      furniture.map((item) => [String(item.id), item.name])
    );
  }, [furniture]);

  const counts = useMemo(() => {
    return {
      total: warranties.length,
      active: warranties.filter(
        (record) => getWarrantyStatus(record) === "Active"
      ).length,
      expiring: warranties.filter(
        (record) => getWarrantyStatus(record) === "Expiring Soon"
      ).length,
      expired: warranties.filter(
        (record) => getWarrantyStatus(record) === "Expired"
      ).length,
    };
  }, [warranties]);

  const filteredWarranties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return warranties
      .filter((record) => {
        const status = getWarrantyStatus(record);
        const furnitureName =
          furnitureNames.get(record.furnitureId) || "Furniture removed";

        const matchesFilter =
          filter === "All" || status === filter;

        const searchableText = [
          furnitureName,
          record.manufacturer,
          record.provider,
          record.duration,
          record.notes,
        ]
          .join(" ")
          .toLowerCase();

        return matchesFilter && searchableText.includes(query);
      })
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  }, [warranties, furnitureNames, filter, search]);

  function resetForm() {
    setFurnitureId(
      furniture.length > 0 ? String(furniture[0].id) : ""
    );
    setManufacturer("");
    setProvider("");
    setDuration("");
    setStartDate(getToday());
    setExpiryDate("");
    setNotes("");
    setEditingId(null);
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!furnitureId) {
      setError("Please select a furniture item.");
      return;
    }

    const exists = furniture.some(
      (item) => String(item.id) === furnitureId
    );

    if (!exists) {
      setError("The selected furniture item is not available.");
      return;
    }

    if (!startDate || !expiryDate) {
      setError("Please enter both warranty dates.");
      return;
    }

    if (expiryDate < startDate) {
      setError("Expiry date cannot be earlier than the start date.");
      return;
    }

    const recordData = {
      furnitureId,
      manufacturer: manufacturer.trim(),
      provider: provider.trim(),
      duration: duration.trim(),
      startDate,
      expiryDate,
      notes: notes.trim(),
    };

    if (editingId) {
      setWarranties((current) =>
        current.map((record) =>
          record.id === editingId
            ? { ...record, ...recordData }
            : record
        )
      );
    } else {
      const newRecord: WarrantyRecord = {
        id: createId(),
        ...recordData,
        createdAt: new Date().toISOString(),
      };

      setWarranties((current) => [...current, newRecord]);
    }

    resetForm();
  }

  function editWarranty(record: WarrantyRecord) {
    setEditingId(record.id);
    setFurnitureId(record.furnitureId);
    setManufacturer(record.manufacturer);
    setProvider(record.provider);
    setDuration(record.duration);
    setStartDate(record.startDate);
    setExpiryDate(record.expiryDate);
    setNotes(record.notes);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function deleteWarranty(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this warranty record?"
    );

    if (!confirmed) return;

    setWarranties((current) =>
      current.filter((record) => record.id !== id)
    );

    if (editingId === id) {
      resetForm();
    }
  }

  function exportCsv() {
    const rows = [
      [
        "Furniture",
        "Manufacturer",
        "Warranty Provider",
        "Duration",
        "Start Date",
        "Expiry Date",
        "Status",
        "Days Until Expiry",
        "Notes",
      ],
      ...warranties.map((record) => [
        furnitureNames.get(record.furnitureId) || "Furniture removed",
        record.manufacturer,
        record.provider,
        record.duration,
        record.startDate,
        record.expiryDate,
        getWarrantyStatus(record),
        getDaysUntilExpiry(record.expiryDate),
        record.notes,
      ]),
    ];

    const csv = rows
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "interior-ai-warranty-records.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function getStatusColor(status: WarrantyStatus): string {
    if (status === "Active") return "#247342";
    if (status === "Expiring Soon") return "#a56800";
    return "#c62828";
  }

  const styles = {
    panel: {
      padding: "24px",
      margin: "20px 0",
      border: "1px solid #d9dce3",
      borderRadius: "14px",
      background: "#ffffff",
      color: "#20232a",
      fontFamily: "Arial, sans-serif",
    } as const,
    input: {
      width: "100%",
      boxSizing: "border-box" as const,
      padding: "11px 12px",
      border: "1px solid #cbd0d9",
      borderRadius: "8px",
      fontSize: "14px",
    },
    button: {
      padding: "10px 14px",
      border: "none",
      borderRadius: "8px",
      background: "#242b3a",
      color: "#ffffff",
      fontWeight: 600,
      cursor: "pointer",
    } as const,
    card: {
      padding: "15px",
      border: "1px solid #e1e4ea",
      borderRadius: "10px",
    } as const,
  };

  return (
    <section style={styles.panel}>
      {/* Header */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "22px",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 6px" }}>
            Furniture Warranty Tracker
          </h2>

          <p style={{ margin: 0, color: "#666b76", fontSize: "14px" }}>
            Keep track of furniture warranties and expiry dates.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={warranties.length === 0}
          style={{
            ...styles.button,
            opacity: warranties.length === 0 ? 0.5 : 1,
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Summary */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
          gap: "12px",
          marginBottom: "25px",
        }}
      >
        <div style={styles.card}>
          <p style={{ margin: "0 0 7px", color: "#666b76", fontSize: "13px" }}>
            Total warranties
          </p>
          <strong style={{ fontSize: "23px" }}>{counts.total}</strong>
        </div>

        <div style={styles.card}>
          <p style={{ margin: "0 0 7px", color: "#666b76", fontSize: "13px" }}>
            Active
          </p>
          <strong style={{ fontSize: "23px", color: "#247342" }}>
            {counts.active}
          </strong>
        </div>

        <div style={styles.card}>
          <p style={{ margin: "0 0 7px", color: "#666b76", fontSize: "13px" }}>
            Expiring soon
          </p>
          <strong style={{ fontSize: "23px", color: "#a56800" }}>
            {counts.expiring}
          </strong>
        </div>

        <div style={styles.card}>
          <p style={{ margin: "0 0 7px", color: "#666b76", fontSize: "13px" }}>
            Expired
          </p>
          <strong style={{ fontSize: "23px", color: "#c62828" }}>
            {counts.expired}
          </strong>
        </div>
      </div>

      {/* Warranty form */}

      <div
        style={{
          padding: "18px",
          background: "#f7f8fa",
          borderRadius: "10px",
          marginBottom: "25px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {editingId ? "Edit Warranty" : "Add New Warranty"}
        </h3>

        {furniture.length === 0 ? (
          <p style={{ color: "#666b76" }}>
            Add furniture to your project before recording warranties.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "14px",
              }}
            >
              <div>
                <label
                  htmlFor="day72-furniture"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "7px",
                  }}
                >
                  Furniture item
                </label>

                <select
                  id="day72-furniture"
                  value={furnitureId}
                  onChange={(event) => setFurnitureId(event.target.value)}
                  style={styles.input}
                  required
                >
                  {furniture.map((item) => (
                    <option key={String(item.id)} value={String(item.id)}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="day72-manufacturer"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "7px",
                  }}
                >
                  Manufacturer / Brand
                </label>

                <input
                  id="day72-manufacturer"
                  type="text"
                  placeholder="Example: Furniture brand"
                  value={manufacturer}
                  onChange={(event) => setManufacturer(event.target.value)}
                  maxLength={100}
                  style={styles.input}
                />
              </div>

              <div>
                <label
                  htmlFor="day72-provider"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "7px",
                  }}
                >
                  Warranty provider
                </label>

                <input
                  id="day72-provider"
                  type="text"
                  placeholder="Example: Store or manufacturer"
                  value={provider}
                  onChange={(event) => setProvider(event.target.value)}
                  maxLength={100}
                  style={styles.input}
                />
              </div>

              <div>
                <label
                  htmlFor="day72-duration"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "7px",
                  }}
                >
                  Warranty duration
                </label>

                <input
                  id="day72-duration"
                  type="text"
                  placeholder="Example: 2 years"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  maxLength={50}
                  style={styles.input}
                />
              </div>

              <div>
                <label
                  htmlFor="day72-start"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "7px",
                  }}
                >
                  Warranty start date
                </label>

                <input
                  id="day72-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="day72-expiry"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: "7px",
                  }}
                >
                  Warranty expiry date
                </label>

                <input
                  id="day72-expiry"
                  type="date"
                  value={expiryDate}
                  min={startDate || undefined}
                  onChange={(event) => setExpiryDate(event.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: "14px" }}>
              <label
                htmlFor="day72-notes"
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: "7px",
                }}
              >
                Notes (optional)
              </label>

              <textarea
                id="day72-notes"
                rows={3}
                maxLength={500}
                placeholder="Add invoice details, warranty conditions, or other notes..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                style={{
                  ...styles.input,
                  resize: "vertical",
                }}
              />
            </div>

            {error && (
              <p role="alert" style={{ color: "#c62828", fontSize: "14px" }}>
                {error}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "15px",
              }}
            >
              <button type="submit" style={styles.button}>
                {editingId ? "Update Warranty" : "Save Warranty"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    ...styles.button,
                    background: "#697386",
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Search and filter */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        <h3 style={{ margin: 0 }}>Warranty Records</h3>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="search"
            aria-label="Search warranty records"
            placeholder="Search warranties..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              ...styles.input,
              width: "190px",
            }}
          />

          <select
            aria-label="Filter warranty records"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            style={{
              ...styles.input,
              width: "auto",
              minWidth: "145px",
            }}
          >
            <option value="All">All warranties</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Warranty list */}

      {filteredWarranties.length === 0 ? (
        <div
          style={{
            padding: "25px",
            textAlign: "center",
            background: "#f7f8fa",
            borderRadius: "10px",
            color: "#666b76",
          }}
        >
          No warranty records found.

          <p style={{ marginBottom: 0, fontSize: "13px" }}>
            Add a warranty above or change your search and filter.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "13px" }}>
          {filteredWarranties.map((record) => {
            const status = getWarrantyStatus(record);
            const days = getDaysUntilExpiry(record.expiryDate);
            const color = getStatusColor(status);

            let expiryMessage = "";

            if (status === "Expired") {
              expiryMessage = `Expired ${Math.abs(days)} day(s) ago`;
            } else if (status === "Expiring Soon") {
              expiryMessage =
                days === 0
                  ? "Expires today"
                  : `Expires in ${days} day(s)`;
            } else {
              expiryMessage = `${days} day(s) remaining`;
            }

            return (
              <article
                key={record.id}
                style={{
                  padding: "17px",
                  border: "1px solid #e1e4ea",
                  borderRadius: "10px",
                  borderLeft: `4px solid ${color}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <h4 style={{ margin: "0 0 7px" }}>
                      {furnitureNames.get(record.furnitureId) ||
                        "Furniture removed from project"}
                    </h4>

                    {record.manufacturer && (
                      <p
                        style={{
                          margin: "0 0 5px",
                          fontSize: "13px",
                          color: "#666b76",
                        }}
                      >
                        Manufacturer: {record.manufacturer}
                      </p>
                    )}

                    {record.provider && (
                      <p
                        style={{
                          margin: "0 0 5px",
                          fontSize: "13px",
                          color: "#666b76",
                        }}
                      >
                        Provider: {record.provider}
                      </p>
                    )}

                    {record.duration && (
                      <p
                        style={{
                          margin: "0 0 5px",
                          fontSize: "13px",
                          color: "#666b76",
                        }}
                      >
                        Duration: {record.duration}
                      </p>
                    )}

                    <p
                      style={{
                        margin: "8px 0 5px",
                        fontSize: "13px",
                      }}
                    >
                      Start: {formatDate(record.startDate)}
                    </p>

                    <p
                      style={{
                        margin: "0 0 5px",
                        fontSize: "13px",
                      }}
                    >
                      Expiry: {formatDate(record.expiryDate)}
                    </p>

                    {record.notes && (
                      <p
                        style={{
                          margin: "9px 0 0",
                          fontSize: "13px",
                          lineHeight: 1.5,
                        }}
                      >
                        Notes: {record.notes}
                      </p>
                    )}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 10px",
                        borderRadius: "20px",
                        background: `${color}18`,
                        color,
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {status}
                    </span>

                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "12px",
                        color,
                      }}
                    >
                      {expiryMessage}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "15px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => editWarranty(record)}
                    style={{
                      ...styles.button,
                      background: "#5265a8",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteWarranty(record.id)}
                    style={{
                      ...styles.button,
                      background: "#c62828",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p
        style={{
          marginTop: "22px",
          color: "#666b76",
          fontSize: "12px",
        }}
      >
        A warranty is marked Expiring Soon when it has 30 days or fewer
        remaining. Warranty records are stored in this browser. Keep your
        original invoices and warranty documents as proof of coverage.
      </p>
    </section>
  );
}
