"use client";

import { useMemo, useState } from "react";
import { RecordFilter, RecordItem, RecordsMeta, RecordType } from "@/lib/dashboard/types";

type RecordsSectionProps = {
  records: RecordItem[];
  recordFilter: RecordFilter;
  onFilterChange: (next: RecordFilter) => void;
  onApply: () => void;
  recordsMeta: RecordsMeta;
  onPageChange: (nextPage: number) => void;
  onLimitChange: (nextLimit: number) => void;
  canManage: boolean;
  loading: boolean;
  onUpdateRecord: (
    recordId: string,
    payload: {
      amount?: string;
      type?: RecordType;
      category?: string;
      date?: string;
      notes?: string;
    }
  ) => Promise<void>;
  onDeleteRecord: (recordId: string) => Promise<void>;
};

export function RecordsSection({
  records,
  recordFilter,
  onFilterChange,
  onApply,
  recordsMeta,
  onPageChange,
  onLimitChange,
  canManage,
  loading,
  onUpdateRecord,
  onDeleteRecord,
}: RecordsSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    amount: "",
    type: "INCOME" as RecordType,
    category: "",
    date: "",
    notes: "",
  });

  const editingRecord = useMemo(
    () => (editingId ? records.find((record) => record.id === editingId) ?? null : null),
    [editingId, records]
  );

  const startEditing = (record: RecordItem) => {
    setEditingId(record.id);
    setForm({
      amount: record.amount,
      type: record.type,
      category: record.category,
      date: record.date.slice(0, 10),
      notes: record.notes ?? "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm({ amount: "", type: "INCOME", category: "", date: "", notes: "" });
  };

  const saveEditing = async () => {
    if (!editingId || !editingRecord) return;

    const payload: {
      amount?: string;
      type?: RecordType;
      category?: string;
      date?: string;
      notes?: string;
    } = {};

    if (form.amount !== editingRecord.amount) payload.amount = form.amount;
    if (form.type !== editingRecord.type) payload.type = form.type;
    if (form.category.trim() !== editingRecord.category) payload.category = form.category.trim();
    if (form.date && form.date !== editingRecord.date.slice(0, 10)) payload.date = form.date;
    if ((form.notes || "") !== (editingRecord.notes || "")) payload.notes = form.notes;

    if (!Object.keys(payload).length) {
      cancelEditing();
      return;
    }

    await onUpdateRecord(editingId, payload);
    cancelEditing();
  };

  return (
    <div className="glass p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h3 className="text-xl font-semibold">Financial Records</h3>
        <div className="flex flex-wrap gap-2">
          <select
            className="field text-sm"
            value={recordFilter.type}
            onChange={(e) =>
              onFilterChange({
                ...recordFilter,
                type: e.target.value as "" | RecordType,
              })
            }
          >
            <option value="">All types</option>
            <option value="INCOME">INCOME</option>
            <option value="EXPENSE">EXPENSE</option>
          </select>
          <input
            className="field text-sm"
            placeholder="Category filter"
            value={recordFilter.category}
            onChange={(e) => onFilterChange({ ...recordFilter, category: e.target.value })}
          />
          <input
            className="field text-sm"
            placeholder="Search category, notes, user"
            value={recordFilter.search}
            onChange={(e) => onFilterChange({ ...recordFilter, search: e.target.value })}
          />
          <div className="flex items-center gap-1">
            <label className="text-xs muted whitespace-nowrap">From</label>
            <input
              id="filter-date-from"
              className="field text-sm"
              type="date"
              value={recordFilter.from}
              onChange={(e) => onFilterChange({ ...recordFilter, from: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs muted whitespace-nowrap">To</label>
            <input
              id="filter-date-to"
              className="field text-sm"
              type="date"
              value={recordFilter.to}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => onFilterChange({ ...recordFilter, to: e.target.value })}
            />
          </div>
          <button className="btn btn-ghost text-sm" onClick={onApply}>
            Apply
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-160 border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.12em] muted">
              <th className="px-3">Date</th>
              <th className="px-3">Category</th>
              <th className="px-3">Type</th>
              <th className="px-3">Amount</th>
              <th className="px-3">Notes</th>
              {canManage ? <th className="px-3">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="rounded-xl bg-white/60">
                <td className="rounded-l-xl px-3 py-2">
                  {editingId === record.id ? (
                    <input
                      className="field w-36 text-sm"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  ) : (
                    new Date(record.date).toLocaleDateString()
                  )}
                </td>
                <td className="px-3 py-2">
                  {editingId === record.id ? (
                    <input
                      className="field w-40 text-sm"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    />
                  ) : (
                    record.category
                  )}
                </td>
                <td className="px-3 py-2 font-mono">
                  {editingId === record.id ? (
                    <select
                      className="field text-sm"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as RecordType })}
                    >
                      <option value="INCOME">INCOME</option>
                      <option value="EXPENSE">EXPENSE</option>
                    </select>
                  ) : (
                    record.type
                  )}
                </td>
                <td className="px-3 py-2 font-semibold">
                  {editingId === record.id ? (
                    <input
                      className="field w-28 text-sm"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  ) : (
                    `$${Number(record.amount).toLocaleString()}`
                  )}
                </td>
                <td className="px-3 py-2 muted">
                  {editingId === record.id ? (
                    <input
                      className="field w-44 text-sm"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  ) : (
                    record.notes || "-"
                  )}
                </td>
                {canManage ? (
                  <td className="rounded-r-xl px-3 py-2">
                    <div className="flex gap-2">
                      {editingId === record.id ? (
                        <>
                          <button className="btn btn-primary text-xs" disabled={loading} onClick={saveEditing}>
                            Save
                          </button>
                          <button className="btn btn-ghost text-xs" disabled={loading} onClick={cancelEditing}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-ghost text-xs"
                            disabled={loading}
                            onClick={() => startEditing(record)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn text-xs"
                            disabled={loading}
                            onClick={async () => {
                              await onDeleteRecord(record.id);
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="muted">
            Page {recordsMeta.page} of {Math.max(recordsMeta.totalPages, 1)} | Total {recordsMeta.total}
          </p>
          <div className="flex items-center gap-2">
            <label className="muted" htmlFor="record-limit">
              Rows
            </label>
            <select
              id="record-limit"
              className="field text-sm"
              value={recordsMeta.limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <button
              className="btn btn-ghost text-sm"
              disabled={loading || recordsMeta.page <= 1}
              onClick={() => onPageChange(recordsMeta.page - 1)}
            >
              Prev
            </button>
            <button
              className="btn btn-ghost text-sm"
              disabled={loading || recordsMeta.page >= recordsMeta.totalPages}
              onClick={() => onPageChange(recordsMeta.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
        {!records.length ? <p className="mt-3 text-sm muted">No records loaded yet.</p> : null}
      </div>
    </div>
  );
}
