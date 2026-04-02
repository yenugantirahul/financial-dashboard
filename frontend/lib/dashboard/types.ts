export type Role = "ADMIN" | "ANALYST" | "VIEWER";
export type Status = "ACTIVE" | "INACTIVE";
export type RecordType = "INCOME" | "EXPENSE";

export type DashboardSummary = {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  incomeCount: number;
  expenseCount: number;
};

export type MonthlyTrend = {
  month: string;
  income: number;
  expense: number;
  net: number;
};

export type RecordItem = {
  id: string;
  amount: string;
  type: RecordType;
  category: string;
  date: string;
  notes: string | null;
  userId: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  createdAt: string;
};

export type RecordFilter = {
  type: "" | RecordType;
  category: string;
  search: string;
};

export type RecordsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type RecordForm = {
  amount: string;
  type: RecordType;
  category: string;
  date: string;
  notes: string;
};

export type UserForm = {
  name: string;
  email: string;
  password: string;
  role: Role;
  status: Status;
};
