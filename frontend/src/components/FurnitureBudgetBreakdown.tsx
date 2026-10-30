
import { useEffect, useMemo, useState } from "react";
import type { FurnitureItem } from "../types/Project";

interface FurnitureBudgetBreakdownProps {
  furniture: FurnitureItem[];
}

type PriceMap = Record<string, string>;

const STORAGE_KEY = "interior-ai-day69-budget-breakdown";

function readSavedData(): {
  prices: PriceMap;
  budget: string;
} {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      return {
        prices:
          parsed.prices && typeof parsed.prices === "object"
            ? parsed.prices
            : {},
        budget:
          typeof parsed.budget === "string" ? parsed.budget : "50000",
      };
    }
  } catch {
    // Use default values if saved data cannot be read.
  }

  return { prices: {}, budget: "50000" };
}

function getCategory(item: FurnitureItem): string {
  return item.category?.trim() || "Uncategorized";
}

function getPrice(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function escapeCsv(value: string | number): string {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default function FurnitureBudgetBreakdown({
  furniture,
}: FurnitureBudgetBreakdownProps) {
  const [savedData] = useState(readSavedData);
  const [prices, setPrices] = useState<PriceMap>(savedData.prices);
  const [budget, setBudget] = useState(savedData.budget);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ prices, budget })
      );
    } catch {
      // The feature remains usable if browser storage is unavailable.
    }
  }, [prices, budget]);

  const items = useMemo(() => {
    return furniture.map((item) => ({
      ...item,
      price: getPrice(prices[String(item.id)]),
      categoryName: getCategory(item),
    }));
  }, [furniture, prices]);

  const categoryTotals = useMemo(() => {
    const totals = new Map<
      string,
      { count: number; total: number }
    >();

    items.forEach((item) => {
      const current = totals.get(item.categoryName) ?? {
        count: 0,
        total: 0,
      };

      current.count += 1;
      current.total += item.price;

      totals.set(item.categoryName, current);
    });

    return Array.from(totals.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [items]);

  const totalCost = items.reduce((sum, item) => sum + item.price, 0);
  const budgetAmount = getPrice(budget);
  const remaining = budgetAmount - totalCost;
  const pricedCount = items.filter(
    (item) => prices[String(item.id)]?.trim() !== ""
      && prices[String(item.id)] !== undefined
      && Number.isFinite(Number(prices[String(item.id)]))
      && Number(prices[String(item.id)]) >= 0
  ).length;

  const unpricedCount = furniture.length - pricedCount;

  function updatePrice(id: string | number, value: string) {
    setPrices((current) => ({
      ...current,
      [String(id)]: value,
    }));
  }

  function exportCsv() {
    const rows: (string | number)[][] = [
      ["Furniture Budget Breakdown"],
      ["Budget (INR)", budgetAmount],
      ["Total furniture cost (INR)", totalCost],
      ["Remaining budget (INR)", remaining],
      [],
      ["Category", "Furniture count", "Category cost (INR)", "Share of total (%)"],
      ...categoryTotals.map((category) => [
        category.category,
        category.count,
        category.total.toFixed(2),
        totalCost > 0
          ? ((category.total / totalCost) * 100).toFixed(2)
          : "0.00",
      ]),
      [],
      ["Furniture item", "Category", "Price (INR)"],
      ...items.map((item) => [
        item.name,
        item.categoryName,
        item.price.toFixed(2),
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
    link.download = "interior-ai-budget-breakdown.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
    field: {
      width: "100%",
      boxSizing: "border-box" as const,
      padding: "10px 12px",
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
      padding: "16px",
      border: "1px solid #e1e4ea",
      borderRadius: "10px",
      minWidth: "0",
    } as const,
  };

  return (
    <section style={styles.panel}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 6px" }}>
            Furniture Budget Breakdown
          </h2>
          <p style={{ margin: 0, color: "#666b76", fontSize: "14px" }}>
            Track furniture costs by category and compare them with your budget.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          style={styles.button}
        >
          Export CSV
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div style={styles.card}>
          <p style={{ margin: "0 0 8px", color: "#666b76", fontSize: "13px" }}>
            Total furniture cost
          </p>
          <strong style={{ fontSize: "21px" }}>
            {formatMoney(totalCost)}
          </strong>
        </div>

        <div style={styles.card}>
          <p style={{ margin: "0 0 8px", color: "#666b76", fontSize: "13px" }}>
            Planned budget
          </p>
          <strong style={{ fontSize: "21px" }}>
            {formatMoney(budgetAmount)}
          </strong>
        </div>

        <div style={styles.card}>
          <p style={{ margin: "0 0 8px", color: "#666b76", fontSize: "13px" }}>
            {remaining >= 0 ? "Budget remaining" : "Over budget"}
          </p>
          <strong style={{ fontSize: "21px", color: remaining < 0 ? "#c62828" : "#247342" }}>
            {formatMoney(Math.abs(remaining))}
          </strong>
        </div>

        <div style={styles.card}>
          <p style={{ margin: "0 0 8px", color: "#666b76", fontSize: "13px" }}>
            Furniture items priced
          </p>
          <strong style={{ fontSize: "21px" }}>
            {pricedCount} / {furniture.length}
          </strong>
        </div>
      </div>

      <div style={{ marginBottom: "22px", maxWidth: "360px" }}>
        <label
          htmlFor="day69-budget"
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "7px",
          }}
        >
          Total budget (₹)
        </label>

        <input
          id="day69-budget"
          type="number"
          min="0"
          step="0.01"
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          style={styles.field}
        />
      </div>

      <h3>Enter furniture prices</h3>

      {furniture.length === 0 ? (
        <p style={{ color: "#666b76" }}>
          No furniture items found. Add furniture to your project first.
        </p>
      ) : (
        <div style={{ overflowX: "auto", marginBottom: "24px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr>
                {["Furniture", "Category", "Price (₹)"].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "11px 8px",
                      borderBottom: "2px solid #e1e4ea",
                      fontSize: "13px",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {furniture.map((item) => (
                <tr key={String(item.id)}>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #eceef2" }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #eceef2" }}>
                    {getCategory(item)}
                  </td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #eceef2", minWidth: "140px" }}>
                    <input
                      aria-label={`Price for ${item.name}`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter price"
                      value={prices[String(item.id)] ?? ""}
                      onChange={(event) =>
                        updatePrice(item.id, event.target.value)
                      }
                      style={styles.field}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>Category-wise spending</h3>

      {categoryTotals.length === 0 ? (
        <p style={{ color: "#666b76" }}>
          Add furniture to see your category breakdown.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {categoryTotals.map((category) => {
            const percentage =
              totalCost > 0 ? (category.total / totalCost) * 100 : 0;

            return (
              <div key={category.category}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "7px",
                  }}
                >
                  <div>
                    <strong>{category.category}</strong>
                    <span style={{ color: "#666b76", fontSize: "13px" }}>
                      {" "}({category.count} item{category.count === 1 ? "" : "s"})
                    </span>
                  </div>

                  <strong>{formatMoney(category.total)}</strong>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "10px",
                    borderRadius: "99px",
                    background: "#e9ebf0",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(percentage, 100)}%`,
                      background: "#6479c8",
                      borderRadius: "99px",
                    }}
                  />
                </div>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: "12px",
                    color: "#666b76",
                  }}
                >
                  {percentage.toFixed(1)}% of total priced furniture cost
                </p>
              </div>
            );
          })}
        </div>
      )}

      {unpricedCount > 0 && (
        <p
          style={{
            marginTop: "20px",
            padding: "12px",
            borderRadius: "8px",
            background: "#fff6df",
            color: "#72530b",
            fontSize: "14px",
          }}
        >
          {unpricedCount} furniture item{unpricedCount === 1 ? " has" : "s have"} no price entered. The total includes only prices entered above.
        </p>
      )}

      <p style={{ color: "#666b76", fontSize: "12px", marginTop: "18px" }}>
        Prices are estimates in Indian rupees (INR). Budget and prices are saved
        in this browser for this feature.
      </p>
    </section>
  );
}
