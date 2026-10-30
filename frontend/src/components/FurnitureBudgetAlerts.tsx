
import { useEffect, useMemo, useState } from "react";
import type { FurnitureItem } from "../types/Project";

interface FurnitureBudgetAlertsProps {
  furniture: FurnitureItem[];
}

interface SavedBudgetData {
  prices: Record<string, string>;
  budget: string;
}

const STORAGE_KEY = "interior-ai-day70-budget-alerts";

const DEFAULT_BUDGET = "50000";

function loadSavedData(): SavedBudgetData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      return {
        prices:
          parsed.prices &&
          typeof parsed.prices === "object" &&
          !Array.isArray(parsed.prices)
            ? parsed.prices
            : {},
        budget:
          typeof parsed.budget === "string"
            ? parsed.budget
            : DEFAULT_BUDGET,
      };
    }
  } catch {
    // Use defaults if saved data is unavailable.
  }

  return {
    prices: {},
    budget: DEFAULT_BUDGET,
  };
}

function parsePrice(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return number;
}

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function FurnitureBudgetAlerts({
  furniture,
}: FurnitureBudgetAlertsProps) {
  const [savedData] = useState<SavedBudgetData>(loadSavedData);
  const [prices, setPrices] = useState<Record<string, string>>(
    savedData.prices
  );
  const [budget, setBudget] = useState(savedData.budget);
  const [alertThreshold, setAlertThreshold] = useState(80);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ prices, budget })
      );
    } catch {
      // The feature still works while the page is open.
    }
  }, [prices, budget]);

  const budgetAmount = parsePrice(budget);
  const validBudget = budgetAmount !== null && budgetAmount > 0;

  const items = useMemo(() => {
    return furniture.map((item) => ({
      id: String(item.id),
      name: item.name,
      category: item.category || "Uncategorized",
      price: parsePrice(prices[String(item.id)]),
    }));
  }, [furniture, prices]);

  const pricedItems = items.filter(
    (item) => item.price !== null
  );

  const totalCost = pricedItems.reduce(
    (sum, item) => sum + (item.price ?? 0),
    0
  );

  const missingCount = items.length - pricedItems.length;

  const percentage = validBudget
    ? (totalCost / budgetAmount!) * 100
    : 0;

  const remaining = validBudget
    ? budgetAmount! - totalCost
    : 0;

  const sortedItems = [...pricedItems].sort(
    (a, b) => (b.price ?? 0) - (a.price ?? 0)
  );

  const mostExpensive = sortedItems.slice(0, 5);

  const status = !validBudget
    ? "invalid"
    : percentage >= 100
      ? "over"
      : percentage >= alertThreshold
        ? "warning"
        : "good";

  const colors = {
    good: "#247342",
    warning: "#a56800",
    over: "#c62828",
    invalid: "#555b66",
  };

  const statusMessages = {
    good: "Your furniture spending is within the target range.",
    warning: `You have used ${percentage.toFixed(
      1
    )}% of your budget. Review your remaining purchases.`,
    over: `Your spending exceeds the budget by ${formatINR(
      Math.abs(remaining)
    )}. Consider reducing costs.`,
    invalid: "Enter a budget greater than zero to activate budget alerts.",
  };

  function updatePrice(id: string, value: string) {
    setPrices((current) => ({
      ...current,
      [id]: value,
    }));
  }

  function exportReport() {
    const lines = [
      "INTERIOR AI - FURNITURE BUDGET ALERT REPORT",
      "===========================================",
      "",
      `Budget: ${
        validBudget ? formatINR(budgetAmount!) : "Not set"
      }`,
      `Total priced furniture: ${formatINR(totalCost)}`,
      `Furniture items: ${furniture.length}`,
      `Items without a valid price: ${missingCount}`,
      `Budget used: ${
        validBudget ? `${percentage.toFixed(1)}%` : "Unavailable"
      }`,
      `Budget status: ${status.toUpperCase()}`,
      `Remaining budget: ${
        validBudget
          ? remaining >= 0
            ? formatINR(remaining)
            : `Over budget by ${formatINR(Math.abs(remaining))}`
          : "Unavailable"
      }`,
      "",
      "FURNITURE PRICE DETAILS",
      "-----------------------",
      ...items.map(
        (item) =>
          `${item.name} | ${item.category} | ${
            item.price === null
              ? "Price not entered"
              : formatINR(item.price)
          }`
      ),
      "",
      "MOST EXPENSIVE ITEMS",
      "--------------------",
      ...(mostExpensive.length
        ? mostExpensive.map(
            (item, index) =>
              `${index + 1}. ${item.name}: ${formatINR(item.price ?? 0)}`
          )
        : ["No priced furniture items yet."]),
      "",
      "RECOMMENDATIONS",
      "---------------",
      ...getRecommendations(),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "interior-ai-budget-alert-report.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function getRecommendations(): string[] {
    if (!validBudget) {
      return ["Set a budget greater than zero."];
    }

    const recommendations: string[] = [];

    if (missingCount > 0) {
      recommendations.push(
        `${missingCount} item(s) still need a valid price. Add prices for a more complete estimate.`
      );
    }

    if (totalCost > budgetAmount!) {
      recommendations.push(
        `Reduce estimated spending by at least ${formatINR(
          totalCost - budgetAmount!
        )} to meet your budget.`
      );

      if (mostExpensive.length > 0) {
        recommendations.push(
          `Review high-cost items first, starting with ${mostExpensive[0].name}.`
        );
      }
    } else if (percentage >= alertThreshold) {
      recommendations.push(
        `Only ${formatINR(
          remaining
        )} remains. Compare prices before adding more furniture.`
      );
    } else {
      recommendations.push(
        `You have ${formatINR(
          remaining
        )} remaining. Keep future purchases within this amount.`
      );
    }

    if (pricedItems.length === 0) {
      recommendations.push(
        "Enter furniture prices to receive more useful cost recommendations."
      );
    }

    return recommendations;
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
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 6px" }}>
            Furniture Budget Alerts
          </h2>
          <p style={{ margin: 0, color: "#666b76", fontSize: "14px" }}>
            Monitor spending and find opportunities to save.
          </p>
        </div>

        <button
          type="button"
          onClick={exportReport}
          style={styles.button}
        >
          Export Report
        </button>
      </div>

      <div style={{ marginBottom: "20px", maxWidth: "400px" }}>
        <label
          htmlFor="day70-budget"
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "7px",
          }}
        >
          Planned budget (₹)
        </label>

        <input
          id="day70-budget"
          type="number"
          min="0"
          step="0.01"
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          style={styles.input}
        />
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
            Estimated cost
          </p>
          <strong style={{ fontSize: "20px" }}>
            {formatINR(totalCost)}
          </strong>
        </div>

        <div style={styles.card}>
          <p style={{ margin: "0 0 8px", color: "#666b76", fontSize: "13px" }}>
            Budget used
          </p>
          <strong style={{ fontSize: "20px" }}>
            {validBudget ? `${percentage.toFixed(1)}%` : "—"}
          </strong>
        </div>

        <div style={styles.card}>
          <p style={{ margin: "0 0 8px", color: "#666b76", fontSize: "13px" }}>
            {remaining < 0 ? "Over budget" : "Budget remaining"}
          </p>
          <strong
            style={{
              fontSize: "20px",
              color: validBudget && remaining < 0 ? "#c62828" : "#247342",
            }}
          >
            {validBudget ? formatINR(Math.abs(remaining)) : "—"}
          </strong>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="day70-threshold"
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Alert threshold: {alertThreshold}%
        </label>

        <input
          id="day70-threshold"
          type="range"
          min="50"
          max="95"
          step="5"
          value={alertThreshold}
          onChange={(event) =>
            setAlertThreshold(Number(event.target.value))
          }
          style={{ width: "100%", maxWidth: "400px" }}
        />

        <p style={{ color: "#666b76", fontSize: "12px", margin: "4px 0 0" }}>
          Choose when to receive a warning before reaching your budget.
        </p>
      </div>

      <div
        role="status"
        style={{
          padding: "15px",
          borderRadius: "10px",
          border: `1px solid ${colors[status]}`,
          background: status === "good" ? "#f0f8f2" : "#fff8e9",
          marginBottom: "22px",
        }}
      >
        <strong style={{ color: colors[status] }}>
          {status === "good"
            ? "Budget looks good"
            : status === "warning"
              ? "Budget warning"
              : status === "over"
                ? "Budget exceeded"
                : "Budget required"}
        </strong>

        <p style={{ margin: "7px 0 0", fontSize: "14px" }}>
          {statusMessages[status]}
        </p>
      </div>

      <h3>Budget usage</h3>

      <div
        role="progressbar"
        aria-label="Furniture budget used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={validBudget ? Math.min(percentage, 100) : 0}
        style={{
          width: "100%",
          height: "16px",
          background: "#e9ebf0",
          borderRadius: "99px",
          overflow: "hidden",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            width: `${validBudget ? Math.min(percentage, 100) : 0}%`,
            height: "100%",
            background: colors[status],
            borderRadius: "99px",
            transition: "width 0.2s ease",
          }}
        />
      </div>

      {validBudget && percentage > 100 && (
        <p style={{ color: "#c62828", fontSize: "13px" }}>
          Spending is {percentage.toFixed(1)}% of the planned budget.
        </p>
      )}

      <h3 style={{ marginTop: "26px" }}>
        Furniture prices
      </h3>

      {furniture.length === 0 ? (
        <p style={{ color: "#666b76" }}>
          No furniture items found. Add furniture to your project first.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
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
                  <td
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #eceef2",
                    }}
                  >
                    {item.name}
                  </td>

                  <td
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #eceef2",
                    }}
                  >
                    {item.category || "Uncategorized"}
                  </td>

                  <td
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #eceef2",
                      minWidth: "140px",
                    }}
                  >
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label={`Price for ${item.name}`}
                      placeholder="Enter price"
                      value={prices[String(item.id)] ?? ""}
                      onChange={(event) =>
                        updatePrice(String(item.id), event.target.value)
                      }
                      style={styles.input}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 style={{ marginTop: "26px" }}>
        Most expensive furniture
      </h3>

      {mostExpensive.length === 0 ? (
        <p style={{ color: "#666b76" }}>
          Enter valid prices to identify the most expensive items.
        </p>
      ) : (
        <ol style={{ paddingLeft: "22px" }}>
          {mostExpensive.map((item) => (
            <li
              key={item.id}
              style={{ marginBottom: "10px", paddingLeft: "4px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span>{item.name}</span>
                <strong>{formatINR(item.price ?? 0)}</strong>
              </div>
              <span style={{ color: "#666b76", fontSize: "12px" }}>
                {item.category}
              </span>
            </li>
          ))}
        </ol>
      )}

      <h3 style={{ marginTop: "26px" }}>
        Smart recommendations
      </h3>

      <ul style={{ paddingLeft: "22px" }}>
        {getRecommendations().map((recommendation, index) => (
          <li key={index} style={{ marginBottom: "9px", lineHeight: 1.5 }}>
            {recommendation}
          </li>
        ))}
      </ul>

      <p style={{ color: "#666b76", fontSize: "12px", marginTop: "22px" }}>
        Prices are estimates in INR. Budget alerts use the prices entered in
        this component and are saved separately in this browser.
      </p>
    </section>
  );
}
