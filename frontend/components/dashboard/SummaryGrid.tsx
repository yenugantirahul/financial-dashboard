import { DashboardSummary } from "@/lib/dashboard/types";

type SummaryGridProps = {
  summary: DashboardSummary | null;
};

export function SummaryGrid({ summary }: SummaryGridProps) {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      <article className="glass p-4">
        <p className="text-xs uppercase tracking-[0.16em] muted">Total Income</p>
        <h2 className="mt-2 text-2xl font-semibold text-(--primary-strong)">
          ${summary?.totalIncome.toLocaleString() ?? "0"}
        </h2>
      </article>
      <article className="glass p-4">
        <p className="text-xs uppercase tracking-[0.16em] muted">Total Expenses</p>
        <h2 className="mt-2 text-2xl font-semibold text-(--danger)">
          ${summary?.totalExpense.toLocaleString() ?? "0"}
        </h2>
      </article>
      <article className="glass p-4">
        <p className="text-xs uppercase tracking-[0.16em] muted">Net Balance</p>
        <h2 className="mt-2 text-2xl font-semibold">${summary?.netBalance.toLocaleString() ?? "0"}</h2>
      </article>
      <article className="glass p-4">
        <p className="text-xs uppercase tracking-[0.16em] muted">Record Volume</p>
        <h2 className="mt-2 text-2xl font-semibold">
          {(summary?.incomeCount ?? 0) + (summary?.expenseCount ?? 0)}
        </h2>
      </article>
    </section>
  );
}
