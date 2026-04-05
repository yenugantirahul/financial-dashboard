"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { getApiBaseUrl } from "@/lib/api-base";

export const authClient = createAuthClient({
  baseURL: `${getApiBaseUrl()}/api/auth`,
  plugins: [
    inferAdditionalFields({
      user: {
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
    }),
  ],
});
