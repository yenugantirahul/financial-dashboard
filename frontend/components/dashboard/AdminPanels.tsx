import { FormEvent } from "react";
import { AdminUser, RecordForm, RecordType, Role, Status, UserForm } from "@/lib/dashboard/types";

type AdminPanelsProps = {
  loading: boolean;
  canManage: boolean;
  recordForm: RecordForm;
  userForm: UserForm;
  users: AdminUser[];
  onRecordFormChange: (next: RecordForm) => void;
  onUserFormChange: (next: UserForm) => void;
  onCreateRecord: (event: FormEvent) => void;
  onCreateUser: (event: FormEvent) => void;
  onLoadUsers: () => void;
};

export function AdminPanels({
  loading,
  canManage,
  recordForm,
  userForm,
  users,
  onRecordFormChange,
  onUserFormChange,
  onCreateRecord,
  onCreateUser,
  onLoadUsers,
}: AdminPanelsProps) {
  if (!canManage) {
    return (
      <div className="space-y-4">
        <div className="glass p-4">
          <p className="text-sm muted">Record and user management are only available to ADMIN users.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <form className="glass space-y-3 p-4 md:p-5" onSubmit={onCreateRecord}>
          <h3 className="text-lg font-semibold">Create Record</h3>
          <input
            className="field w-full"
            placeholder="Amount"
            value={recordForm.amount}
            onChange={(e) => onRecordFormChange({ ...recordForm, amount: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="field"
              value={recordForm.type}
              onChange={(e) => onRecordFormChange({ ...recordForm, type: e.target.value as RecordType })}
            >
              <option value="INCOME">INCOME</option>
              <option value="EXPENSE">EXPENSE</option>
            </select>
            <input
              className="field"
              placeholder="Category"
              value={recordForm.category}
              onChange={(e) => onRecordFormChange({ ...recordForm, category: e.target.value })}
              required
            />
          </div>
          <input
            className="field w-full"
            type="date"
            value={recordForm.date}
            onChange={(e) => onRecordFormChange({ ...recordForm, date: e.target.value })}
          />
          <textarea
            className="field min-h-22.5 w-full"
            placeholder="Notes"
            value={recordForm.notes}
            onChange={(e) => onRecordFormChange({ ...recordForm, notes: e.target.value })}
          />
          <button className="btn btn-primary w-full" disabled={loading}>
            Save Record
          </button>
        </form>

        <form className="glass space-y-3 p-4 md:p-5" onSubmit={onCreateUser}>
          <h3 className="text-lg font-semibold">Create User</h3>
          <input
            className="field w-full"
            placeholder="Full name"
            value={userForm.name}
            onChange={(e) => onUserFormChange({ ...userForm, name: e.target.value })}
            required
          />
          <input
            className="field w-full"
            type="email"
            placeholder="Email"
            value={userForm.email}
            onChange={(e) => onUserFormChange({ ...userForm, email: e.target.value })}
            required
          />
          <input
            className="field w-full"
            type="password"
            placeholder="Password"
            minLength={8}
            value={userForm.password}
            onChange={(e) => onUserFormChange({ ...userForm, password: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="field"
              value={userForm.role}
              onChange={(e) => onUserFormChange({ ...userForm, role: e.target.value as Role })}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="ANALYST">ANALYST</option>
              <option value="VIEWER">VIEWER</option>
            </select>
            <select
              className="field"
              value={userForm.status}
              onChange={(e) => onUserFormChange({ ...userForm, status: e.target.value as Status })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <button className="btn btn-accent w-full" disabled={loading}>
            Create User
          </button>
        </form>
      </div>

      <section className="glass p-4 md:p-5 xl:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xl font-semibold">User Directory</h3>
          <button className="btn btn-ghost" onClick={onLoadUsers}>
            Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.12em] muted">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Role</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-black/10">
                  <td className="px-2 py-2">{user.name}</td>
                  <td className="px-2 py-2 font-mono text-xs">{user.email}</td>
                  <td className="px-2 py-2">{user.role}</td>
                  <td className="px-2 py-2">{user.status}</td>
                  <td className="px-2 py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length ? <p className="mt-2 text-sm muted">No users loaded yet.</p> : null}
        </div>
      </section>
    </>
  );
}
