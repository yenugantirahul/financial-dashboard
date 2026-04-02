import { z } from "zod";
const roleEnum = z.enum(["ADMIN", "ANALYST", "VIEWER"]);
const statusEnum = z.enum(["ACTIVE", "INACTIVE"]);
const recordTypeEnum = z.enum(["INCOME", "EXPENSE"]);
export const createUserSchema = z.object({
    name: z.string().trim().min(1).max(120),
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8).max(128),
    image: z.string().url().optional(),
    role: roleEnum.default("VIEWER"),
    status: statusEnum.default("ACTIVE"),
});
export const recordIdParamSchema = z.object({
    id: z.string().trim().min(1),
});
export const recordsQuerySchema = z.object({
    search: z.string().trim().min(1).optional(),
    type: recordTypeEnum.optional(),
    category: z.string().trim().min(1).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    userId: z.string().trim().min(1).optional(),
    deleted: z.enum(["exclude", "include", "only"]).default("exclude"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const createRecordSchema = z.object({
    amount: z.union([z.string(), z.number()]),
    type: recordTypeEnum,
    category: z.string().trim().min(1).max(100),
    date: z.string().optional(),
    notes: z.string().trim().max(1000).optional(),
    userId: z.string().trim().min(1).optional(),
});
export const updateRecordSchema = z
    .object({
    amount: z.union([z.string(), z.number()]).optional(),
    type: recordTypeEnum.optional(),
    category: z.string().trim().min(1).max(100).optional(),
    date: z.string().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
});
export const adminUsersQuerySchema = z.object({
    search: z.string().trim().min(1).optional(),
    role: roleEnum.optional(),
    status: statusEnum.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const adminUpdateUserSchema = z
    .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: z.email().trim().toLowerCase().optional(),
    role: roleEnum.optional(),
    status: statusEnum.optional(),
    image: z.string().url().nullable().optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
});
