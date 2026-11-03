
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type DeliveryStatus =
  | "Ordered"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

interface DeliveryOrder {
  id: string;
  furnitureName: string;
  supplier: string;
  orderDate: string;
  expectedDate: string;
  trackingNumber: string;
  status: DeliveryStatus;
  notes: string;
}

const STORAGE_KEY = "interior-ai-day75-delivery-orders";

const statuses: DeliveryStatus[] = [
  "Ordered",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const emptyForm = {
  furnitureName: "",
  supplier: "",
  orderDate: new Date().toISOString().slice(0, 10),
  expectedDate: "",
  trackingNumber: "",
  status: "Ordered" as DeliveryStatus,
  notes: "",
};

function FurnitureDeliveryTracker() {
  const [orders, setOrders] = useState<DeliveryOrder[]>(() => {
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const today = new Date().toISOString().slice(0, 10);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        order.furnitureName.toLowerCase().includes(searchText) ||
        order.supplier.toLowerCase().includes(searchText) ||
        order.trackingNumber.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const deliveredCount = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const activeCount = orders.filter(
    (order) =>
      order.status !== "Delivered" && order.status !== "Cancelled"
  ).length;

  const overdueCount = orders.filter(
    (order) =>
      order.expectedDate &&
      order.expectedDate < today &&
      order.status !== "Delivered" &&
      order.status !== "Cancelled"
  ).length;

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.furnitureName.trim()) {
      alert("Please enter a furniture name.");
      return;
    }

    if (
      form.expectedDate &&
      form.orderDate &&
      form.expectedDate < form.orderDate
    ) {
      alert("Expected delivery date cannot be before the order date.");
      return;
    }

    if (editingId) {
      setOrders((previous) =>
        previous.map((order) =>
          order.id === editingId
            ? {
                ...order,
                ...form,
                furnitureName: form.furnitureName.trim(),
                supplier: form.supplier.trim(),
                trackingNumber: form.trackingNumber.trim(),
                notes: form.notes.trim(),
              }
            : order
        )
      );
    } else {
      const newOrder: DeliveryOrder = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...form,
        furnitureName: form.furnitureName.trim(),
        supplier: form.supplier.trim(),
        trackingNumber: form.trackingNumber.trim(),
        notes: form.notes.trim(),
      };

      setOrders((previous) => [...previous, newOrder]);
    }

    resetForm();
  };

  const startEditing = (order: DeliveryOrder) => {
    setEditingId(order.id);

    setForm({
      furnitureName: order.furnitureName,
      supplier: order.supplier,
      orderDate: order.orderDate,
      expectedDate: order.expectedDate,
      trackingNumber: order.trackingNumber,
      status: order.status,
      notes: order.notes,
    });
  };

  const updateStatus = (id: string, status: DeliveryStatus) => {
    setOrders((previous) =>
      previous.map((order) =>
        order.id === id ? { ...order, status } : order
      )
    );
  };

  const deleteOrder = (id: string) => {
    if (!window.confirm("Delete this delivery record?")) return;

    setOrders((previous) =>
      previous.filter((order) => order.id !== id)
    );

    if (editingId === id) {
      resetForm();
    }
  };

  const exportCSV = () => {
    const headers = [
      "Furniture",
      "Supplier",
      "Order Date",
      "Expected Delivery",
      "Tracking Number",
      "Status",
      "Notes",
    ];

    const escapeCSV = (value: string) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const rows = orders.map((order) => [
      order.furnitureName,
      order.supplier,
      order.orderDate,
      order.expectedDate,
      order.trackingNumber,
      order.status,
      order.notes,
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
    link.download = "furniture-delivery-orders.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const getDeliveryLabel = (order: DeliveryOrder) => {
    if (order.status === "Delivered") return "Delivered";
    if (order.status === "Cancelled") return "Cancelled";

    if (order.expectedDate && order.expectedDate < today) {
      return "Overdue";
    }

    return "On Schedule";
  };

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case "Delivered":
        return "#15803d";
      case "Cancelled":
        return "#6b7280";
      case "Out for Delivery":
        return "#2563eb";
      case "Shipped":
        return "#7c3aed";
      default:
        return "#b45309";
    }
  };

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
          <h2 style={{ margin: "0 0 6px" }}>Furniture Delivery Tracker</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Manage furniture orders and monitor delivery progress.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCSV}
          disabled={orders.length === 0}
          style={buttonStyle}
        >
          Export CSV
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
          gap: "12px",
          margin: "22px 0",
        }}
      >
        <SummaryCard label="Total Orders" value={orders.length} />
        <SummaryCard label="Active Orders" value={activeCount} />
        <SummaryCard label="Delivered" value={deliveredCount} />
        <SummaryCard label="Overdue" value={overdueCount} />
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
          {editingId ? "Edit Delivery Order" : "Add New Delivery Order"}
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
              value={form.furnitureName}
              onChange={(event) =>
                setForm({ ...form, furnitureName: event.target.value })
              }
              placeholder="Example: Sofa"
              style={inputStyle}
              required
            />
          </label>

          <label style={labelStyle}>
            Supplier / Store
            <input
              value={form.supplier}
              onChange={(event) =>
                setForm({ ...form, supplier: event.target.value })
              }
              placeholder="Store name"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Order Date
            <input
              type="date"
              value={form.orderDate}
              onChange={(event) =>
                setForm({ ...form, orderDate: event.target.value })
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Expected Delivery Date
            <input
              type="date"
              value={form.expectedDate}
              min={form.orderDate || undefined}
              onChange={(event) =>
                setForm({ ...form, expectedDate: event.target.value })
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Tracking Number
            <input
              value={form.trackingNumber}
              onChange={(event) =>
                setForm({ ...form, trackingNumber: event.target.value })
              }
              placeholder="Enter tracking ID"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Delivery Status
            <select
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as DeliveryStatus,
                })
              }
              style={inputStyle}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ ...labelStyle, marginTop: "12px" }}>
          Delivery Notes
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) =>
              setForm({ ...form, notes: event.target.value })
            }
            placeholder="Add delivery instructions or other details..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>

        <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
          <button type="submit" style={buttonStyle}>
            {editingId ? "Update Order" : "Add Order"}
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
          placeholder="Search furniture, supplier, or tracking number..."
          style={{ ...inputStyle, flex: "1 1 220px" }}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          style={{ ...inputStyle, flex: "0 1 190px" }}
        >
          <option value="All">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        {filteredOrders.map((order) => (
          <div
            key={order.id}
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
            <div style={{ flex: "1 1 240px" }}>
              <h3 style={{ margin: "0 0 6px" }}>
                {order.furnitureName}
              </h3>

              <div style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.8 }}>
                <div>Supplier: {order.supplier || "Not specified"}</div>
                <div>Order Date: {order.orderDate || "Not specified"}</div>
                <div>
                  Expected Delivery: {order.expectedDate || "Not specified"}
                </div>
                <div>
                  Tracking Number: {order.trackingNumber || "Not specified"}
                </div>

                {order.notes && <div>Notes: {order.notes}</div>}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "10px",
                }}
              >
                <span
                  style={{
                    padding: "5px 9px",
                    borderRadius: "20px",
                    background: "#f3f4f6",
                    color: getStatusColor(order.status),
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {order.status}
                </span>

                <span
                  style={{
                    padding: "5px 9px",
                    borderRadius: "20px",
                    background:
                      getDeliveryLabel(order) === "Overdue"
                        ? "#fee2e2"
                        : "#f3f4f6",
                    color:
                      getDeliveryLabel(order) === "Overdue"
                        ? "#b91c1c"
                        : "#374151",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {getDeliveryLabel(order)}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <select
                aria-label={`Update status for ${order.furnitureName}`}
                value={order.status}
                onChange={(event) =>
                  updateStatus(order.id, event.target.value as DeliveryStatus)
                }
                style={{ ...inputStyle, width: "auto", minWidth: "150px" }}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => startEditing(order)}
                style={buttonStyle}
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => deleteOrder(order.id)}
                style={deleteButtonStyle}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <p style={{ color: "#6b7280", textAlign: "center" }}>
            {orders.length === 0
              ? "No delivery orders yet. Add your first order above."
              : "No orders match your search or selected status."}
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
      <div style={{ fontSize: "25px", fontWeight: 700, marginTop: "6px" }}>
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

export default FurnitureDeliveryTracker;
