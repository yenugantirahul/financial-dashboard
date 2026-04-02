import { Role, Status } from "@/lib/dashboard/types";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type AuthResponse = {
  token: string | null;
  user: AuthUser;
};
