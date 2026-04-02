import { Role } from "@/lib/dashboard/types";

type ControlPanelProps = {
  role: Role;
  statusText: string;
  loading: boolean;
  canManage: boolean;
  userEmail: string;
  onLogout: () => void;
  onRefreshAll: () => void;
  onLoadDashboard: () => void;
  onLoadRecords: () => void;
  onLoadUsers: () => void;
};

export function ControlPanel({
  role,
  statusText,
  loading,
  canManage,
  userEmail,
  onLogout,
  onRefreshAll,
  onLoadDashboard,
  onLoadRecords,
  onLoadUsers,
}: ControlPanelProps) {
  return (
    <section className="glass relative overflow-hidden p-5 md:p-7">
      <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-(--accent)/20 blur-2xl" />
      <div className="absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-(--primary)/20 blur-2xl" />
      <div className="relative grid gap-4 md:grid-cols-[1.4fr_1fr_1fr] md:items-end">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.24em] muted">Zorvyn Finance</p>
          <h1 className="mt-1 text-3xl font-semibold md:text-4xl">Operational Dashboard</h1>
          <p className="mt-2 max-w-xl muted">
            Monitor income and expenses, manage financial records, and administer users through role-based backend APIs.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Signed In Role</span>
          <div className="field flex items-center justify-between gap-3 bg-white/60">
            <span className="font-mono text-sm">{role}</span>
            <span className="text-xs muted">{canManage ? "Admin access" : "Read-only access"}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Active User</span>
          <div className="field flex items-center justify-between gap-3 bg-white/60">
            <span className="truncate text-xs font-mono">{userEmail}</span>
            <button className="btn btn-ghost py-1 text-xs" type="button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-3">
        <button className="btn btn-primary" onClick={onRefreshAll} disabled={loading}>
          Refresh All Data
        </button>
        <button className="btn btn-ghost" onClick={onLoadDashboard} disabled={loading}>
          Dashboard
        </button>
        <button className="btn btn-ghost" onClick={onLoadRecords} disabled={loading}>
          Records
        </button>
        {canManage ? (
          <button className="btn btn-ghost" onClick={onLoadUsers} disabled={loading}>
            Users
          </button>
        ) : null}
        <span className="self-center text-sm muted">{statusText}</span>
      </div>
    </section>
  );
}
