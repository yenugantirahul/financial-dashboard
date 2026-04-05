"use client";

import { useEffect, useMemo, useState } from "react";

type HeatmapDay = {
  date: string;
  income: number;
  expense: number;
  net: number;
  count: number;
};

type SpendingHeatmapProps = {
  data: HeatmapDay[];
  loading?: boolean;
};

const CELL_SIZE = 14;
const CELL_GAP = 3;
const CELL_RADIUS = 3;
const DAY_LABEL_WIDTH = 28;
const MONTH_LABEL_HEIGHT = 18;
const WEEKS_TO_SHOW = 52;
const DAYS = ["Mon", "", "Wed", "", "Fri", "", ""];

const EXPENSE_LEVELS = [
  "var(--surface-soft)",      // L0: no data
  "rgba(15,118,110,0.18)",    // L1: low
  "rgba(15,118,110,0.38)",    // L2: medium-low
  "rgba(229,117,57,0.45)",    // L3: medium-high
  "rgba(199,58,33,0.55)",     // L4: high
  "rgba(199,58,33,0.82)",     // L5: very high
];

function getLevel(expense: number, maxExpense: number): number {
  if (expense === 0) return 0;
  if (maxExpense === 0) return 0;
  const ratio = expense / maxExpense;
  if (ratio <= 0.15) return 1;
  if (ratio <= 0.35) return 2;
  if (ratio <= 0.55) return 3;
  if (ratio <= 0.80) return 4;
  return 5;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function getMonthLabels(startDate: Date): { label: string; weekIndex: number }[] {
  const labels: { label: string; weekIndex: number }[] = [];
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  let lastMonth = -1;

  for (let w = 0; w < WEEKS_TO_SHOW; w++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + w * 7);
    const month = weekStart.getMonth();
    if (month !== lastMonth) {
      labels.push({ label: months[month], weekIndex: w });
      lastMonth = month;
    }
  }
  return labels;
}

export function SpendingHeatmap({ data, loading }: SpendingHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    day: HeatmapDay | null;
    dateStr: string;
  } | null>(null);

  const dataKey = data.length;
  const [animate, setAnimate] = useState(false);
  const [lastDataKey, setLastDataKey] = useState(-1);

  if (dataKey !== lastDataKey) {
    setAnimate(false);
    setLastDataKey(dataKey);
  }

  useEffect(() => {
    if (data.length > 0 && !animate) {
      const timer = setTimeout(() => {
        setAnimate(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [data.length, animate]);

  const dayMap = useMemo(() => {
    const map = new Map<string, HeatmapDay>();
    for (const d of data) map.set(d.date, d);
    return map;
  }, [data]);

  const maxExpense = useMemo(
    () => Math.max(...data.map((d) => d.expense), 1),
    [data]
  );

  const totalExpense = useMemo(() => data.reduce((s, d) => s + d.expense, 0), [data]);
  const totalIncome = useMemo(() => data.reduce((s, d) => s + d.income, 0), [data]);
  const activeDays = useMemo(() => data.filter((d) => d.count > 0).length, [data]);

  // Compute the grid start: the Sunday that begins our 52-week window
  const gridStart = useMemo(() => {
    const today = new Date();
    const d = new Date(today);
    d.setDate(d.getDate() - (WEEKS_TO_SHOW * 7 - 1));
    // Move back to Sunday
    const dayOfWeek = d.getDay();
    d.setDate(d.getDate() - dayOfWeek);
    return d;
  }, []);

  const monthLabels = useMemo(() => getMonthLabels(gridStart), [gridStart]);

  const svgWidth = DAY_LABEL_WIDTH + WEEKS_TO_SHOW * (CELL_SIZE + CELL_GAP);
  const svgHeight = MONTH_LABEL_HEIGHT + 7 * (CELL_SIZE + CELL_GAP);

  return (
    <div className="glass p-4 md:p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">Spending Pulse</h3>
          <p className="text-xs muted mt-0.5">
            Your daily spending intensity over the past year
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex flex-col items-end">
            <span className="muted">Total Spent</span>
            <span className="font-bold text-sm" style={{ color: "var(--danger)" }}>
              {formatCurrency(totalExpense)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="muted">Total Earned</span>
            <span className="font-bold text-sm" style={{ color: "var(--primary)" }}>
              {formatCurrency(totalIncome)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="muted">Active Days</span>
            <span className="font-bold text-sm">{activeDays}</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="muted text-sm">Loading spending data...</p>
        </div>
      ) : (
        <div className="overflow-x-auto" style={{ position: "relative" }}>
          <svg
            width={svgWidth}
            height={svgHeight}
            style={{ display: "block", margin: "0 auto" }}
            role="img"
            aria-label="Spending heatmap calendar showing daily expense intensity"
          >
            {/* Month labels */}
            {monthLabels.map((m) => (
              <text
                key={`${m.label}-${m.weekIndex}`}
                x={DAY_LABEL_WIDTH + m.weekIndex * (CELL_SIZE + CELL_GAP)}
                y={MONTH_LABEL_HEIGHT - 4}
                fill="var(--muted)"
                fontSize={10}
                fontFamily="var(--font-mono), monospace"
              >
                {m.label}
              </text>
            ))}

            {/* Day labels (Mon, Wed, Fri) */}
            {DAYS.map((label, dayIdx) =>
              label ? (
                <text
                  key={label}
                  x={0}
                  y={MONTH_LABEL_HEIGHT + dayIdx * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 2}
                  fill="var(--muted)"
                  fontSize={9}
                  fontFamily="var(--font-mono), monospace"
                >
                  {label}
                </text>
              ) : null
            )}

            {/* Cells */}
            {Array.from({ length: WEEKS_TO_SHOW }).map((_, weekIdx) =>
              Array.from({ length: 7 }).map((_, dayIdx) => {
                const cellDate = new Date(gridStart);
                cellDate.setDate(cellDate.getDate() + weekIdx * 7 + dayIdx);
                const dateKey = cellDate.toISOString().slice(0, 10);
                const today = new Date().toISOString().slice(0, 10);

                // Skip future dates
                if (dateKey > today) return null;

                const dayData = dayMap.get(dateKey);
                const level = dayData ? getLevel(dayData.expense, maxExpense) : 0;
                const x = DAY_LABEL_WIDTH + weekIdx * (CELL_SIZE + CELL_GAP);
                const y = MONTH_LABEL_HEIGHT + dayIdx * (CELL_SIZE + CELL_GAP);

                return (
                  <rect
                    key={dateKey}
                    x={x}
                    y={y}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={CELL_RADIUS}
                    ry={CELL_RADIUS}
                    fill={EXPENSE_LEVELS[level]}
                    stroke={dateKey === today ? "var(--primary)" : "none"}
                    strokeWidth={dateKey === today ? 1.5 : 0}
                    style={{
                      opacity: animate ? 1 : 0,
                      transition: `opacity 0.4s ease ${(weekIdx * 7 + dayIdx) * 1.2}ms`,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as SVGRectElement).getBoundingClientRect();
                      const parent = (e.target as SVGRectElement)
                        .closest("div")
                        ?.getBoundingClientRect();
                      if (parent) {
                        setTooltip({
                          x: rect.left - parent.left + CELL_SIZE / 2,
                          y: rect.top - parent.top - 8,
                          day: dayData ?? null,
                          dateStr: dateKey,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            )}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              style={{
                position: "absolute",
                left: tooltip.x,
                top: tooltip.y,
                transform: "translate(-50%, -100%)",
                pointerEvents: "none",
                zIndex: 20,
              }}
            >
              <div
                style={{
                  background: "var(--foreground)",
                  color: "var(--background)",
                  padding: "6px 10px",
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
                  lineHeight: 1.5,
                  textAlign: "center",
                }}
              >
                <div style={{ fontWeight: 500, opacity: 0.7 }}>
                  {new Date(tooltip.dateStr + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                {tooltip.day ? (
                  <>
                    <div>
                      Spent{" "}
                      <span style={{ color: "#ffa07a" }}>
                        {formatCurrency(tooltip.day.expense)}
                      </span>
                    </div>
                    <div>
                      Earned{" "}
                      <span style={{ color: "#7dcea0" }}>
                        {formatCurrency(tooltip.day.income)}
                      </span>
                    </div>
                    <div style={{ opacity: 0.6 }}>
                      {tooltip.day.count} transaction{tooltip.day.count !== 1 ? "s" : ""}
                    </div>
                  </>
                ) : (
                  <div style={{ opacity: 0.6 }}>No transactions</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs muted">
        <span>Less</span>
        {EXPENSE_LEVELS.map((color, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: 3,
              background: color,
              border:
                i === 0
                  ? "1px solid color-mix(in srgb, var(--foreground) 12%, transparent)"
                  : "none",
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
