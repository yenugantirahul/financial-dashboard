import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "./prisma.js";
const trustedOrigins = (process.env.CORS_ORIGIN ??
    "http://localhost:3000,https://financial-dashboard-rho-one.vercel.app")
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
                type: "string",
                required: false,
                defaultValue: "VIEWER",
            },
            status: {
                type: "string",
                required: false,
                defaultValue: "ACTIVE",
            },
        },
    },
});
