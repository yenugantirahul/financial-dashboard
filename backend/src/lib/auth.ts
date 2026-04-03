import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "./prisma.js";

const trustedOrigins = (
  process.env.CORS_ORIGIN ?? "http://localhost:3000"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  trustedOrigins,

  user: {
    additionalFields: {
      role: {
        type: ["ADMIN", "ANALYST", "VIEWER"],
        required: false,
        defaultValue: "VIEWER",
      },
      status: {
        type: ["ACTIVE", "INACTIVE"],
        required: false,
        defaultValue: "ACTIVE",
      },
    },
  },
});