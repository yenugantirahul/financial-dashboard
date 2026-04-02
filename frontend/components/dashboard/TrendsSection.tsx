import { MonthlyTrend } from "@/lib/dashboard/types";

type TrendsSectionProps = {
  monthlyTrends: MonthlyTrend[];
  trendMax: number;
};

export function TrendsSection({ monthlyTrends, trendMax }: TrendsSectionProps) {
  return (
    <section className="glass p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold">Monthly Trend</h3>
        <p className="text-sm muted">Last 6 months</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {monthlyTrends.map((item) => {
          const incomeHeight = Math.max((item.income / trendMax) * 96, 3);
          const expenseHeight = Math.max((item.expense / trendMax) * 96, 3);
          return (
            <div key={item.month} className="rounded-xl bg-white/55 p-3">
              <div className="mb-2 flex h-28 items-end gap-2">
                <div
                  className="w-1/2 rounded-t-md bg-(--primary)"
                  style={{ height: `${incomeHeight}px` }}
                  title={`Income ${item.income}`}
                />
                <div
                  className="w-1/2 rounded-t-md bg-(--accent)"
                  style={{ height: `${expenseHeight}px` }}
                  title={`Expense ${item.expense}`}
                />
              </div>
              <p className="text-xs font-mono muted">{item.month}</p>
              <p className="text-sm font-semibold">Net ${item.net.toLocaleString()}</p>
            </div>
          );
        })}
        {!monthlyTrends.length ? <p className="text-sm muted">No trend data yet.</p> : null}
      </div>
    </section>
  );
}
