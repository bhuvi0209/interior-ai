
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { FurnitureItem } from "../types/Project";

interface InventoryRecord {
  quantity: number;
  condition: "New" | "Good" | "Fair" | "Needs Repair";
  location: string;
  purchaseDate: string;
  notes: string;
}

interface FurnitureInventoryTrackerProps {
  furniture: FurnitureItem[];
}

const STORAGE_KEY = "interior-ai-day73-furniture-inventory";

const defaultRecord: InventoryRecord = {
  quantity: 1,
  condition: "Good",
  location: "",
  purchaseDate: "",
  notes: "",
};

function FurnitureInventoryTracker({
  furniture,
}: FurnitureInventoryTrackerProps) {
  const [records, setRecords] = useState<Record<string, InventoryRecord>>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
  );

  const [search, setSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InventoryRecord>(defaultRecord);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const inventory = useMemo(() => {
    return furniture.map((item) => {
      const id = String(item.id);

      return {
        item,
        id,
        record: records[id] || defaultRecord,
      };
    });
  }, [furniture, records]);

  const filteredInventory = inventory.filter(({ item, record }) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      record.location.toLowerCase().includes(search.toLowerCase());

    const matchesCondition =
      conditionFilter === "All" ||
      record.condition === conditionFilter;

    return matchesSearch && matchesCondition;
  });

  const totalItems = inventory.reduce(
    (total, entry) => total + entry.record.quantity,
    0
  );

  const needsRepair = inventory.filter(
    (entry) => entry.record.condition === "Needs Repair"
  ).length;

  const startEditing = (id: string) => {
    setEditingId(id);
    setForm({ ...(records[id] || defaultRecord) });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm(defaultRecord);
  };

  const saveRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingId) return;

    const quantity = Math.floor(Number(form.quantity));

    if (!Number.isFinite(quantity) || quantity < 1) {
      alert("Please enter a quantity of at least 1.");
      return;
    }

    setRecords((previous) => ({
      ...previous,
      [editingId]: {
        ...form,
        quantity,
      },
    }));

    cancelEditing();
  };

  const resetRecord = (id: string) => {
    if (!window.confirm("Reset this furniture inventory record?")) return;

    setRecords((previous) => {
      const updated = { ...previous };
      delete updated[id];
      return updated;
    });

    if (editingId === id) {
      cancelEditing();
    }
  };

  const exportCSV = () => {
    const headers = [
      "Furniture Name",
      "Category",
      "Quantity",
      "Condition",
      "Location",
      "Purchase Date",
      "Notes",
    ];

    const escapeCSV = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const rows = inventory.map(({ item, record }) => [
      item.name,
      item.category,
      record.quantity,
      record.condition,
      record.location,
      record.purchaseDate,
      record.notes,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "furniture-inventory.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        padding: "24px",
        marginTop: "24px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        color: "#1f2937",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Furniture Inventory Tracker</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Manage furniture quantities, condition, and storage details.
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={inventory.length === 0}
          style={buttonStyle}
        >
          Export CSV
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          margin: "22px 0",
        }}
      >
        <SummaryCard label="Furniture Types" value={inventory.length} />
        <SummaryCard label="Total Quantity" value={totalItems} />
        <SummaryCard label="Needs Repair" value={needsRepair} />
      </div>

      {furniture.length === 0 ? (
        <p style={{ color: "#6b7280" }}>
          Add furniture to your design to start tracking your inventory.
        </p>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search furniture, category, or location..."
              style={{ ...inputStyle, flex: "1 1 220px" }}
            />

            <select
              value={conditionFilter}
              onChange={(event) => setConditionFilter(event.target.value)}
              style={{ ...inputStyle, flex: "0 1 190px" }}
            >
              <option value="All">All Conditions</option>
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Needs Repair">Needs Repair</option>
            </select>
          </div>

          {editingId && (
            <form
              onSubmit={saveRecord}
              style={{
                padding: "18px",
                marginBottom: "20px",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Edit inventory:{" "}
                {furniture.find((item) => String(item.id) === editingId)?.name}
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                }}
              >
                <label style={labelStyle}>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.quantity}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        quantity: Number(event.target.value),
                      })
                    }
                    style={inputStyle}
                    required
                  />
                </label>

                <label style={labelStyle}>
                  Condition
                  <select
                    value={form.condition}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        condition: event.target.value as InventoryRecord["condition"],
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Needs Repair">Needs Repair</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Room / Storage Location
                  <input
                    type="text"
                    value={form.location}
                    onChange={(event) =>
                      setForm({ ...form, location: event.target.value })
                    }
                    placeholder="Example: Living Room"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Purchase Date
                  <input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(event) =>
                      setForm({ ...form, purchaseDate: event.target.value })
                    }
                    style={inputStyle}
                  />
                </label>
              </div>

              <label style={{ ...labelStyle, marginTop: "12px" }}>
                Notes
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Add any details about this furniture..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button type="submit" style={buttonStyle}>
                  Save Inventory
                </button>

                <button
                  type="button"
                  onClick={cancelEditing}
                  style={secondaryButtonStyle}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div style={{ display: "grid", gap: "12px" }}>
            {filteredInventory.map(({ item, id, record }) => (
              <div
                key={id}
                style={{
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "14px",
                }}
              >
                <div style={{ flex: "1 1 220px" }}>
                  <h3 style={{ margin: "0 0 5px" }}>{item.name}</h3>

                  <p style={{ margin: "0 0 8px", color: "#6b7280" }}>
                    {item.category}
                  </p>

                  <div style={{ fontSize: "14px", lineHeight: 1.7 }}>
                    <div>Quantity: {record.quantity}</div>
                    <div>Condition: {record.condition}</div>
                    <div>Location: {record.location || "Not specified"}</div>
                    <div>
                      Purchase Date: {record.purchaseDate || "Not specified"}
                    </div>
                    {record.notes && <div>Notes: {record.notes}</div>}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => startEditing(id)}
                    style={buttonStyle}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => resetRecord(id)}
                    style={secondaryButtonStyle}
                  >
                    Reset
                  </button>
                </div>
              </div>
            ))}

            {filteredInventory.length === 0 && (
              <p style={{ color: "#6b7280" }}>
                No furniture matches your search or condition filter.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        padding: "16px",
        background: "#f3f4f6",
        borderRadius: "10px",
      }}
    >
      <div style={{ color: "#6b7280", fontSize: "13px" }}>{label}</div>
      <div style={{ fontSize: "25px", fontWeight: 700, marginTop: "5px" }}>
        {value}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  fontSize: "14px",
  background: "#ffffff",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "6px",
  fontSize: "14px",
  fontWeight: 600,
};

const buttonStyle = {
  padding: "9px 14px",
  border: "none",
  borderRadius: "7px",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#e5e7eb",
  color: "#374151",
};

export default FurnitureInventoryTracker;
