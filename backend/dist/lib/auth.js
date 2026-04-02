"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_adapter_1 = require("@better-auth/prisma-adapter");
const prisma_js_1 = require("./prisma.js");
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, prisma_adapter_1.prismaAdapter)(prisma_js_1.prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        autoSignIn: true,
    },
    trustedOrigins: ["http://localhost:3000"],
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
