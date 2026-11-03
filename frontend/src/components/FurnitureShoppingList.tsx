
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type Priority = "Low" | "Medium" | "High";
type PurchaseStatus = "Pending" | "Purchased";

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  estimatedPrice: number;
  priority: Priority;
  status: PurchaseStatus;
  notes: string;
}

const STORAGE_KEY = "interior-ai-day74-shopping-list";

const emptyForm = {
  name: "",
  category: "",
  quantity: 1,
  estimatedPrice: 0,
  priority: "Medium" as Priority,
  notes: "",
};

function FurnitureShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || item.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [items, search, statusFilter, priorityFilter]);

  const totalEstimated = items.reduce(
    (total, item) => total + item.quantity * item.estimatedPrice,
    0
  );

  const purchasedTotal = items
    .filter((item) => item.status === "Purchased")
    .reduce(
      (total, item) => total + item.quantity * item.estimatedPrice,
      0
    );

  const pendingCount = items.filter(
    (item) => item.status === "Pending"
  ).length;

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const quantity = Math.floor(Number(form.quantity));
    const price = Number(form.estimatedPrice);

    if (!form.name.trim()) {
      alert("Please enter a furniture name.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      alert("Quantity must be at least 1.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      alert("Please enter a valid estimated price.");
      return;
    }

    if (editingId) {
      setItems((previous) =>
        previous.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name: form.name.trim(),
                category: form.category.trim(),
                quantity,
                estimatedPrice: price,
                priority: form.priority,
                notes: form.notes.trim(),
              }
            : item
        )
      );
    } else {
      const newItem: ShoppingItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: form.name.trim(),
        category: form.category.trim(),
        quantity,
        estimatedPrice: price,
        priority: form.priority,
        status: "Pending",
        notes: form.notes.trim(),
      };

      setItems((previous) => [...previous, newItem]);
    }

    resetForm();
  };

  const startEditing = (item: ShoppingItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      estimatedPrice: item.estimatedPrice,
      priority: item.priority,
      notes: item.notes,
    });
  };

  const toggleStatus = (id: string) => {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              status:
                item.status === "Pending" ? "Purchased" : "Pending",
            }
          : item
      )
    );
  };

  const deleteItem = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setItems((previous) => previous.filter((item) => item.id !== id));

    if (editingId === id) {
      resetForm();
    }
  };

  const exportCSV = () => {
    const headers = [
      "Furniture",
      "Category",
      "Quantity",
      "Estimated Unit Price",
      "Estimated Total",
      "Priority",
      "Status",
      "Notes",
    ];

    const escapeCSV = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const rows = items.map((item) => [
      item.name,
      item.category,
      item.quantity,
      item.estimatedPrice,
      item.quantity * item.estimatedPrice,
      item.priority,
      item.status,
      item.notes,
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
    link.download = "furniture-shopping-list.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const formatPrice = (price: number) =>
    `₹${price.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  return (
    <div
      style={{
        marginTop: "24px",
        padding: "24px",
        background: "#ffffff",
        color: "#1f2937",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
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
          <h2 style={{ margin: "0 0 6px" }}>Furniture Shopping List</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Plan furniture purchases and track your shopping budget.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          disabled={items.length === 0}
          style={buttonStyle}
        >
          Export CSV
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          margin: "22px 0",
        }}
      >
        <SummaryCard label="Shopping Items" value={items.length} />
        <SummaryCard label="Pending Items" value={pendingCount} />
        <SummaryCard
          label="Estimated Budget"
          value={formatPrice(totalEstimated)}
        />
        <SummaryCard
          label="Purchased Value"
          value={formatPrice(purchasedTotal)}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          padding: "18px",
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          marginBottom: "22px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {editingId ? "Edit Shopping Item" : "Add Furniture to Shopping List"}
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          <label style={labelStyle}>
            Furniture Name *
            <input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Example: Sofa"
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            Category
            <input
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
              placeholder="Example: Living Room"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Quantity *
            <input
              type="number"
              min="1"
              step="1"
              value={form.quantity}
              onChange={(event) =>
                setForm({ ...form, quantity: Number(event.target.value) })
              }
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            Estimated Unit Price (₹)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.estimatedPrice}
              onChange={(event) =>
                setForm({
                  ...form,
                  estimatedPrice: Number(event.target.value),
                })
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Priority
            <select
              value={form.priority}
              onChange={(event) =>
                setForm({
                  ...form,
                  priority: event.target.value as Priority,
                })
              }
              style={inputStyle}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
        </div>

        <label style={{ ...labelStyle, marginTop: "12px" }}>
          Notes
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) =>
              setForm({ ...form, notes: event.target.value })
            }
            placeholder="Add size, colour, material, store, or other details..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>

        <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
          <button type="submit" style={buttonStyle}>
            {editingId ? "Update Item" : "Add to Shopping List"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search furniture..."
          style={{ ...inputStyle, flex: "1 1 200px" }}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          style={{ ...inputStyle, flex: "0 1 160px" }}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Purchased">Purchased</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          style={{ ...inputStyle, flex: "0 1 160px" }}
        >
          <option value="All">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
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
                {item.category || "Uncategorized"}
              </p>

              <div style={{ fontSize: "14px", lineHeight: 1.8 }}>
                <div>Quantity: {item.quantity}</div>
                <div>Unit price: {formatPrice(item.estimatedPrice)}</div>
                <div>
                  Estimated total:{" "}
                  <strong>
                    {formatPrice(item.quantity * item.estimatedPrice)}
                  </strong>
                </div>
                <div>Priority: {item.priority}</div>
                <div>
                  Status:{" "}
                  <strong
                    style={{
                      color:
                        item.status === "Purchased" ? "#15803d" : "#b45309",
                    }}
                  >
                    {item.status}
                  </strong>
                </div>
                {item.notes && <div>Notes: {item.notes}</div>}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => toggleStatus(item.id)}
                style={secondaryButtonStyle}
              >
                {item.status === "Pending"
                  ? "Mark Purchased"
                  : "Mark Pending"}
              </button>

              <button
                type="button"
                onClick={() => startEditing(item)}
                style={buttonStyle}
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => deleteItem(item.id)}
                style={deleteButtonStyle}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <p style={{ color: "#6b7280", textAlign: "center" }}>
            {items.length === 0
              ? "Your shopping list is empty. Add your first furniture item above."
              : "No items match your search or filters."}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
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
      <div
        style={{
          fontSize: "22px",
          fontWeight: 700,
          marginTop: "6px",
          overflowWrap: "anywhere",
        }}
      >
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

const deleteButtonStyle = {
  ...buttonStyle,
  background: "#dc2626",
};

export default FurnitureShoppingList;
