import express from "express";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { apiRateLimiter, authRateLimiter } from "./middlewares/ratelimit.js";
import userRouter from "./routes/users.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import adminRouter from "./routes/admin.routes.js";
import recordsRouter from "./routes/records.routes.js";
import cors from "cors";

const app = express();
const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cookieParser());

// Express v5

app.use(
  cors({
    origin: corsOrigins,
    credentials: true, // important if using cookies
  })
);

app.use(express.json());

app.use("/api", apiRateLimiter);
app.all("/api/auth/*splat", authRateLimiter, toNodeHandler(auth));
app.use("/api/users", userRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/admin", adminRouter);
app.use("/api/records", recordsRouter);
export default app;
