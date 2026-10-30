
import { useMemo, useState } from "react";
import type { FurnitureItem } from "../types/Project";

interface FurnitureBudgetEstimatorProps {
  furniture: FurnitureItem[];
}

type CurrencyCode = "INR" | "USD" | "GBP" | "EUR";

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

function readSavedPrices(): Record<string, string> {
  try {
    const saved = localStorage.getItem("interior-ai-furniture-prices");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function readSavedBudget(): string {
  try {
    return localStorage.getItem("interior-ai-furniture-budget") || "50000";
  } catch {
    return "50000";
  }
}

function FurnitureBudgetEstimator({
  furniture,
}: FurnitureBudgetEstimatorProps) {
  const [prices, setPrices] =
    useState<Record<string, string>>(readSavedPrices);

  const [budget, setBudget] = useState<string>(readSavedBudget);

  const [currency, setCurrency] = useState<CurrencyCode>("INR");

  const [showHidden, setShowHidden] = useState(false);

  const [includeUnpriced, setIncludeUnpriced] = useState(false);

  const visibleFurniture = useMemo(
    () =>
      showHidden
        ? furniture
        : furniture.filter((item) => item.visible),
    [furniture, showHidden]
  );

  const budgetValue = Number(budget);

  const validBudget =
    budget.trim() !== "" &&
    Number.isFinite(budgetValue) &&
    budgetValue >= 0;

  const symbol = CURRENCY_SYMBOLS[currency];

  const formatMoney = (amount: number) =>
    `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const updatePrice = (id: string | number, value: string) => {
    const key = String(id);

    const nextPrices = {
      ...prices,
      [key]: value,
    };

    setPrices(nextPrices);

    try {
      localStorage.setItem(
        "interior-ai-furniture-prices",
        JSON.stringify(nextPrices)
      );
    } catch {
      // The estimator continues to work if browser storage is unavailable.
    }
  };

  const updateBudget = (value: string) => {
    setBudget(value);

    try {
      localStorage.setItem("interior-ai-furniture-budget", value);
    } catch {
      // The budget remains available for the current session.
    }
  };

  const pricedItems = visibleFurniture.filter((item) => {
    const value = prices[String(item.id)];

    return (
      value !== undefined &&
      value.trim() !== "" &&
      Number.isFinite(Number(value)) &&
      Number(value) >= 0
    );
  });

  const invalidPriceItems = visibleFurniture.filter((item) => {
    const value = prices[String(item.id)];

    if (value === undefined || value.trim() === "") {
      return false;
    }

    return !Number.isFinite(Number(value)) || Number(value) < 0;
  });

  const unpricedItems = visibleFurniture.filter((item) => {
    const value = prices[String(item.id)];

    return (
      value === undefined ||
      value.trim() === "" ||
      !Number.isFinite(Number(value)) ||
      Number(value) < 0
    );
  });

  const pricedTotal = pricedItems.reduce(
    (sum, item) => sum + Number(prices[String(item.id)]),
    0
  );

  const estimatedTotal = includeUnpriced
    ? pricedTotal
    : unpricedItems.length === 0
      ? pricedTotal
      : null;

  const remainingBudget =
    validBudget && estimatedTotal !== null
      ? budgetValue - estimatedTotal
      : null;

  const overBudget =
    validBudget &&
    estimatedTotal !== null &&
    estimatedTotal > budgetValue;

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 7,
    fontSize: 14,
    background: "#ffffff",
    color: "#1f2937",
  };

  const buttonStyle = {
    padding: "9px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 7,
    background: "#ffffff",
    color: "#1f2937",
    cursor: "pointer",
    fontSize: 13,
  };

  const exportBudget = () => {
    const lines = [
      "INTERIOR AI - FURNITURE BUDGET ESTIMATE",
      `Currency: ${currency}`,
      `Budget limit: ${validBudget ? formatMoney(budgetValue) : "Invalid"}`,
      "",
      "FURNITURE ITEMS",
      ...visibleFurniture.map((item) => {
        const value = prices[String(item.id)];
        const valid =
          value !== undefined &&
          value.trim() !== "" &&
          Number.isFinite(Number(value)) &&
          Number(value) >= 0;

        return `${item.name || "Unnamed furniture"}: ${
          valid ? formatMoney(Number(value)) : "Price not entered"
        }`;
      }),
      "",
      `Priced items subtotal: ${formatMoney(pricedTotal)}`,
      `Unpriced items: ${unpricedItems.length}`,
      `Invalid price entries: ${invalidPriceItems.length}`,
      `Estimated total: ${
        estimatedTotal === null
          ? "Incomplete - enter all prices"
          : formatMoney(estimatedTotal)
      }`,
      `Budget result: ${
        remainingBudget === null
          ? "Cannot calculate"
          : remainingBudget < 0
            ? `Over budget by ${formatMoney(Math.abs(remainingBudget))}`
            : `Under budget by ${formatMoney(remainingBudget)}`
      }`,
      "",
      "Note: Prices are estimates entered by the user, not live market prices.",
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "interior-ai-furniture-budget.txt";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <section
      style={{
        padding: 20,
        margin: "20px 0",
        border: "1px solid #d1d5db",
        borderRadius: 12,
        background: "#ffffff",
        color: "#1f2937",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 8px", fontSize: 21 }}>
            Furniture Budget Estimator
          </h2>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Enter estimated prices for your furniture and track your
            project budget.
          </p>
        </div>

        <button
          type="button"
          onClick={exportBudget}
          style={{
            ...buttonStyle,
            background: "#2563eb",
            color: "#ffffff",
            borderColor: "#2563eb",
          }}
        >
          Export budget report
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginTop: 22,
        }}
      >
        <div>
          <label
            htmlFor="furniture-budget-currency"
            style={{
              display: "block",
              marginBottom: 7,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Currency
          </label>

          <select
            id="furniture-budget-currency"
            value={currency}
            onChange={(event) =>
              setCurrency(event.target.value as CurrencyCode)
            }
            style={inputStyle}
          >
            <option value="INR">INR — Indian Rupee (₹)</option>
            <option value="USD">USD — US Dollar ($)</option>
            <option value="GBP">GBP — British Pound (£)</option>
            <option value="EUR">EUR — Euro (€)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="furniture-budget-limit"
            style={{
              display: "block",
              marginBottom: 7,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Total budget limit
          </label>

          <input
            id="furniture-budget-limit"
            type="number"
            min="0"
            step="0.01"
            value={budget}
            onChange={(event) => updateBudget(event.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginTop: 16,
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
          }}
        >
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(event) => setShowHidden(event.target.checked)}
          />
          Include hidden furniture
        </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
          }}
        >
          <input
            type="checkbox"
            checked={includeUnpriced}
            onChange={(event) =>
              setIncludeUnpriced(event.target.checked)
            }
          />
          Calculate subtotal using priced items only
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 10,
          marginTop: 22,
        }}
      >
        <div
          style={{
            padding: 14,
            borderRadius: 9,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <p style={{ margin: "0 0 6px", color: "#6b7280", fontSize: 12 }}>
            Items in estimate
          </p>
          <strong style={{ fontSize: 23 }}>{visibleFurniture.length}</strong>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 9,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <p style={{ margin: "0 0 6px", color: "#6b7280", fontSize: 12 }}>
            Priced items
          </p>
          <strong style={{ fontSize: 23 }}>{pricedItems.length}</strong>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 9,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <p style={{ margin: "0 0 6px", color: "#6b7280", fontSize: 12 }}>
            Priced subtotal
          </p>
          <strong style={{ fontSize: 20 }}>{formatMoney(pricedTotal)}</strong>
        </div>
      </div>

      {validBudget && (
        <div
          style={{
            marginTop: 16,
            padding: 15,
            borderRadius: 9,
            background: overBudget ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${overBudget ? "#fecaca" : "#bbf7d0"}`,
          }}
        >
          <strong
            style={{
              color: overBudget ? "#b91c1c" : "#15803d",
              fontSize: 15,
            }}
          >
            {estimatedTotal === null
              ? "Add the missing prices to compare your full budget"
              : overBudget
                ? "Estimated total exceeds your budget"
                : "Estimated total is within your budget"}
          </strong>

          <p
            style={{
              margin: "7px 0 0",
              fontSize: 14,
              lineHeight: 1.5,
              color: "#374151",
            }}
          >
            {estimatedTotal === null
              ? `${unpricedItems.length} item(s) still need a valid price.`
              : remainingBudget !== null && remainingBudget < 0
                ? `Over budget by ${formatMoney(Math.abs(remainingBudget))}.`
                : `Budget remaining: ${formatMoney(remainingBudget ?? 0)}.`}
          </p>
        </div>
      )}

      {!validBudget && (
        <p style={{ marginTop: 16, color: "#b91c1c", fontSize: 13 }}>
          Enter a valid budget amount greater than or equal to zero.
        </p>
      )}

      <h3 style={{ margin: "24px 0 12px", fontSize: 16 }}>
        Furniture prices
      </h3>

      {visibleFurniture.length === 0 ? (
        <p
          style={{
            padding: 14,
            background: "#f9fafb",
            borderRadius: 8,
            fontSize: 14,
            color: "#6b7280",
          }}
        >
          No furniture is included in the estimate. Add furniture to
          your project or enable hidden furniture.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {visibleFurniture.map((item: FurnitureItem) => {
            const value = prices[String(item.id)] ?? "";
            const priceIsValid =
              value.trim() !== "" &&
              Number.isFinite(Number(value)) &&
              Number(value) >= 0;

            return (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(130px, 200px)",
                  alignItems: "center",
                  gap: 14,
                  padding: 13,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                }}
              >
                <div>
                  <strong style={{ fontSize: 14 }}>
                    {item.name || "Unnamed furniture"}
                  </strong>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#6b7280",
                      fontSize: 12,
                    }}
                  >
                    {item.category || "Uncategorized"}
                    {!item.visible ? " · Hidden" : ""}
                  </p>

                  {value.trim() !== "" && !priceIsValid && (
                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#b91c1c",
                        fontSize: 12,
                      }}
                    >
                      Enter a valid non-negative price.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`furniture-price-${String(item.id)}`}
                    style={{
                      display: "block",
                      marginBottom: 5,
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    Estimated price ({currency})
                  </label>

                  <input
                    id={`furniture-price-${String(item.id)}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter price"
                    value={value}
                    onChange={(event) =>
                      updatePrice(item.id, event.target.value)
                    }
                    style={inputStyle}
                  />

                  {priceIsValid && (
                    <p
                      style={{
                        margin: "5px 0 0",
                        fontSize: 12,
                        color: "#15803d",
                        textAlign: "right",
                      }}
                    >
                      {formatMoney(Number(value))}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unpricedItems.length > 0 && (
        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 8,
            background: "#fff7ed",
            color: "#9a3412",
          }}
        >
          <strong style={{ fontSize: 14 }}>
            {unpricedItems.length} item(s) need a price
          </strong>

          <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.5 }}>
            Enter prices for all included items to calculate a complete
            estimated total. Until then, the priced subtotal only includes
            items with valid prices.
          </p>
        </div>
      )}

      <p
        style={{
          margin: "20px 0 0",
          color: "#6b7280",
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        Prices are estimates you enter yourself. The currency selector
        changes the displayed symbol only; it does not convert between
        currencies. Prices and the budget limit are saved in this
        browser's local storage.
      </p>
    </section>
  );
}

export default FurnitureBudgetEstimator;
