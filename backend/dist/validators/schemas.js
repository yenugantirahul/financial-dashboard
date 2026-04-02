"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUpdateUserSchema = exports.adminUsersQuerySchema = exports.updateRecordSchema = exports.createRecordSchema = exports.recordsQuerySchema = exports.recordIdParamSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const roleEnum = zod_1.z.enum(["ADMIN", "ANALYST", "VIEWER"]);
const statusEnum = zod_1.z.enum(["ACTIVE", "INACTIVE"]);
const recordTypeEnum = zod_1.z.enum(["INCOME", "EXPENSE"]);
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(120),
    email: zod_1.z.email().trim().toLowerCase(),
    password: zod_1.z.string().min(8).max(128),
    image: zod_1.z.string().url().optional(),
    role: roleEnum.default("VIEWER"),
    status: statusEnum.default("ACTIVE"),
});
exports.recordIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().trim().min(1),
});
exports.recordsQuerySchema = zod_1.z.object({
    search: zod_1.z.string().trim().min(1).optional(),
    type: recordTypeEnum.optional(),
    category: zod_1.z.string().trim().min(1).optional(),
    from: zod_1.z.string().optional(),
    to: zod_1.z.string().optional(),
    userId: zod_1.z.string().trim().min(1).optional(),
    deleted: zod_1.z.enum(["exclude", "include", "only"]).default("exclude"),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.createRecordSchema = zod_1.z.object({
    amount: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    type: recordTypeEnum,
    category: zod_1.z.string().trim().min(1).max(100),
    date: zod_1.z.string().optional(),
    notes: zod_1.z.string().trim().max(1000).optional(),
    userId: zod_1.z.string().trim().min(1).optional(),
});
exports.updateRecordSchema = zod_1.z
    .object({
    amount: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    type: recordTypeEnum.optional(),
    category: zod_1.z.string().trim().min(1).max(100).optional(),
    date: zod_1.z.string().optional(),
    notes: zod_1.z.string().trim().max(1000).nullable().optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
});
exports.adminUsersQuerySchema = zod_1.z.object({
    search: zod_1.z.string().trim().min(1).optional(),
    role: roleEnum.optional(),
    status: statusEnum.optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.adminUpdateUserSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(1).max(120).optional(),
    email: zod_1.z.email().trim().toLowerCase().optional(),
    role: roleEnum.optional(),
    status: statusEnum.optional(),
    image: zod_1.z.string().url().nullable().optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
});
