"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { SummaryGrid } from "@/components/dashboard/SummaryGrid";
import { TrendsSection } from "@/components/dashboard/TrendsSection";
import { RecordsSection } from "@/components/dashboard/RecordsSection";
import { AdminPanels } from "@/components/dashboard/AdminPanels";
import { apiRequest, deleteRecord, getRecords, updateRecord } from "@/lib/dashboard/api";
import { clearStoredSession, getStoredSession } from "@/lib/auth/session";
import {
  AdminUser,
  DashboardSummary,
  MonthlyTrend,
  RecordFilter,
  RecordForm,
  RecordItem,
  RecordsMeta,
  Role,
  UserForm,
} from "@/lib/dashboard/types";

const DEFAULT_RECORD_LIMIT = 20;

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [role, setRole] = useState<Role>("VIEWER");
  const [userEmail, setUserEmail] = useState("");
  const [statusText, setStatusText] = useState("Checking session...");
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [recordFilter, setRecordFilter] = useState<RecordFilter>({
    type: "",
    category: "",
    search: "",
  });
  const [recordsMeta, setRecordsMeta] = useState<RecordsMeta>({
    page: 1,
    limit: DEFAULT_RECORD_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [recordForm, setRecordForm] = useState<RecordForm>({
    amount: "",
    type: "INCOME",
    category: "",
    date: "",
    notes: "",
  });
  const [userForm, setUserForm] = useState<UserForm>({
    name: "",
    email: "",
    password: "",
    role: "VIEWER",
    status: "ACTIVE",
  });

  const canManage = role === "ADMIN";

  const trendMax = useMemo(() => {
    if (!monthlyTrends.length) return 1;
    return Math.max(...monthlyTrends.map((item) => Math.max(item.income, item.expense, 1)));
  }, [monthlyTrends]);

  useEffect(() => {
    const session = getStoredSession();
    if (!session?.token) {
      router.replace("/auth");
      return;
    }

    setToken(session.token);
    setRole(session.user.role);
    setUserEmail(session.user.email);
    setStatusText("Session ready");
    setIsReady(true);
  }, [router]);

  const loadDashboard = async () => {
    if (!token) return;
    setLoading(true);
    setStatusText("Loading dashboard...");
    try {
      const dashboardRes = await apiRequest<{
        data: { summary: DashboardSummary; monthlyTrends: MonthlyTrend[] };
      }>("/api/dashboard", token);
      setSummary(dashboardRes.data.summary);
      setMonthlyTrends(dashboardRes.data.monthlyTrends);
      setStatusText("Dashboard loaded");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    if (!token) return;
    setLoading(true);
    setStatusText("Loading records...");
    try {
      const recordsRes = await getRecords<{ data: RecordItem[]; meta: RecordsMeta }>(token, {
        type: recordFilter.type || undefined,
        category: recordFilter.category,
        search: recordFilter.search,
        page: recordsMeta.page,
        limit: recordsMeta.limit,
      });
      setRecords(recordsRes.data);
      setRecordsMeta(recordsRes.meta);
      setStatusText("Records loaded");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!token || !canManage) return;
    setLoading(true);
    setStatusText("Loading users...");
    try {
      const usersRes = await apiRequest<{ data: AdminUser[] }>("/api/admin/users", token);
      setUsers(usersRes.data);
      setStatusText("Users loaded");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setLoading(true);
    setStatusText("Creating record...");
    try {
      await apiRequest("/api/records", token, {
        method: "POST",
        body: JSON.stringify({
          amount: recordForm.amount,
          type: recordForm.type,
          category: recordForm.category,
          date: recordForm.date || undefined,
          notes: recordForm.notes || undefined,
        }),
      });
      setRecordForm({ amount: "", type: "INCOME", category: "", date: "", notes: "" });
      setStatusText("Record created");
      await Promise.all([loadRecords(), loadDashboard()]);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to create record");
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setLoading(true);
    setStatusText("Creating user...");
    try {
      await apiRequest("/api/users/create", token, {
        method: "POST",
        body: JSON.stringify(userForm),
      });
      setUserForm({ name: "", email: "", password: "", role: "VIEWER", status: "ACTIVE" });
      setStatusText("User created");
      await loadUsers();
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const updateRecordById = async (
    recordId: string,
    payload: {
      amount?: string;
      type?: "INCOME" | "EXPENSE";
      category?: string;
      date?: string;
      notes?: string;
    }
  ) => {
    if (!token) return;
    setLoading(true);
    setStatusText("Updating record...");
    try {
      await updateRecord(token, recordId, payload);
      setStatusText("Record updated");
      await Promise.all([loadRecords(), loadDashboard()]);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to update record");
    } finally {
      setLoading(false);
    }
  };

  const deleteRecordById = async (recordId: string) => {
    if (!token) return;
    setLoading(true);
    setStatusText("Deleting record...");
    try {
      await deleteRecord(token, recordId);
      setStatusText("Record deleted");
      await Promise.all([loadRecords(), loadDashboard()]);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to delete record");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecordFilters = async () => {
    if (!token) return;
    setLoading(true);
    setStatusText("Loading records...");
    try {
      const recordsRes = await getRecords<{ data: RecordItem[]; meta: RecordsMeta }>(token, {
        type: recordFilter.type || undefined,
        category: recordFilter.category,
        search: recordFilter.search,
        page: 1,
        limit: recordsMeta.limit,
      });
      setRecords(recordsRes.data);
      setRecordsMeta(recordsRes.meta);
      setStatusText("Records loaded");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPageChange = async (nextPage: number) => {
    if (!token) return;
    const safePage = Math.max(1, nextPage);
    setLoading(true);
    setStatusText("Loading records...");
    try {
      const recordsRes = await getRecords<{ data: RecordItem[]; meta: RecordsMeta }>(token, {
        type: recordFilter.type || undefined,
        category: recordFilter.category,
        search: recordFilter.search,
        page: safePage,
        limit: recordsMeta.limit,
      });
      setRecords(recordsRes.data);
      setRecordsMeta(recordsRes.meta);
      setStatusText("Records loaded");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordLimitChange = async (nextLimit: number) => {
    if (!token) return;
    setLoading(true);
    setStatusText("Loading records...");
    try {
      const recordsRes = await getRecords<{ data: RecordItem[]; meta: RecordsMeta }>(token, {
        type: recordFilter.type || undefined,
        category: recordFilter.category,
        search: recordFilter.search,
        page: 1,
        limit: nextLimit,
      });
      setRecords(recordsRes.data);
      setRecordsMeta(recordsRes.meta);
      setStatusText("Records loaded");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const quickLoadAll = async () => {
    await Promise.all([loadDashboard(), loadRecords(), loadUsers()]);
  };

  const logout = () => {
    clearStoredSession();
    router.replace("/auth");
  };

  useEffect(() => {
    if (!isReady) return;
    const initialLoad = async () => {
      setLoading(true);
      setStatusText("Loading dashboard...");
      try {
        const [dashboardRes, recordsRes, usersRes] = await Promise.all([
          apiRequest<{
            data: { summary: DashboardSummary; monthlyTrends: MonthlyTrend[] };
          }>("/api/dashboard", token),
          getRecords<{ data: RecordItem[]; meta: RecordsMeta }>(token, {
            page: 1,
            limit: DEFAULT_RECORD_LIMIT,
          }),
          canManage
            ? apiRequest<{ data: AdminUser[] }>("/api/admin/users", token)
            : Promise.resolve({ data: [] as AdminUser[] }),
        ]);

        setSummary(dashboardRes.data.summary);
        setMonthlyTrends(dashboardRes.data.monthlyTrends);
        setRecords(recordsRes.data);
        setRecordsMeta(recordsRes.meta);
        setUsers(usersRes.data);
        setStatusText("Dashboard loaded");
      } catch (error) {
        setStatusText(error instanceof Error ? error.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    void initialLoad();
  }, [isReady, token, canManage]);

  if (!isReady) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center p-6">
        <section className="glass p-6">
          <p className="muted">Validating session...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <ControlPanel
        role={role}
        userEmail={userEmail}
        statusText={statusText}
        loading={loading}
        canManage={canManage}
        onLogout={logout}
        onRefreshAll={quickLoadAll}
        onLoadDashboard={loadDashboard}
        onLoadRecords={loadRecords}
        onLoadUsers={loadUsers}
      />

      <SummaryGrid summary={summary} />
      <TrendsSection monthlyTrends={monthlyTrends} trendMax={trendMax} />

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <RecordsSection
          records={records}
          recordFilter={recordFilter}
          onFilterChange={setRecordFilter}
          onApply={handleApplyRecordFilters}
          recordsMeta={recordsMeta}
          onPageChange={handleRecordPageChange}
          onLimitChange={handleRecordLimitChange}
          canManage={canManage}
          loading={loading}
          onUpdateRecord={updateRecordById}
          onDeleteRecord={deleteRecordById}
        />

        <AdminPanels
          loading={loading}
          canManage={canManage}
          recordForm={recordForm}
          userForm={userForm}
          users={users}
          onRecordFormChange={setRecordForm}
          onUserFormChange={setUserForm}
          onCreateRecord={createRecord}
          onCreateUser={createUser}
          onLoadUsers={loadUsers}
        />
      </section>
    </main>
  );
}
