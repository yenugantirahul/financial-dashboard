import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: "ADMIN" | "ANALYST" | "VIEWER";
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // later this will come from better auth session/token
  const mockUser = {
    id: "user_123",
    role: "ADMIN" as "ADMIN" | "ANALYST" | "VIEWER",
  };

  req.user = mockUser;
  next();
};