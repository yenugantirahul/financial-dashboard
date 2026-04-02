"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../lib/prisma.js");
const authmiddleware_js_1 = require("../middlewares/authmiddleware.js");
const authorizemiddleware_js_1 = require("../middlewares/authorizemiddleware.js");
const ratelimit_js_1 = require("../middlewares/ratelimit.js");
const validation_js_1 = require("../middlewares/validation.js");
const schemas_js_1 = require("../validators/schemas.js");
const router = (0, express_1.Router)();
const recordTypes = ["INCOME", "EXPENSE"];
const serializeRecord = (record) => ({
    ...record,
    amount: record.amount.toString(),
    date: record.date.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
});
const parseAmount = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value.toFixed(2);
    }
    if (typeof value === "string" && value.trim() !== "") {
        const amount = Number(value);
        if (Number.isFinite(amount)) {
            return amount.toFixed(2);
        }
    }
    return null;
};
router.use(authmiddleware_js_1.authenticate);
router.get("/", (0, authorizemiddleware_js_1.authorize)("ADMIN", "ANALYST"), (0, validation_js_1.validateQuery)(schemas_js_1.recordsQuerySchema), async (req, res) => {
    var _a;
    try {
        const { search, type, category, from, to, userId, deleted, page, limit } = schemas_js_1.recordsQuerySchema.parse(req.query);
        const pageNumber = page;
        const pageSize = limit;
        const skip = (pageNumber - 1) * pageSize;
        if (userId && ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Only admins can filter by userId",
            });
        }
        const andConditions = [];
        if (deleted === "exclude") {
            andConditions.push({ deletedAt: null });
        }
        else if (deleted === "only") {
            andConditions.push({ deletedAt: { not: null } });
        }
        if (type) {
            if (!recordTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: "type must be INCOME or EXPENSE",
                });
            }
            andConditions.push({ type });
        }
        if (category) {
            andConditions.push({ category: { contains: category, mode: "insensitive" } });
        }
        if (search) {
            andConditions.push({
                OR: [
                    { category: { contains: search, mode: "insensitive" } },
                    { notes: { contains: search, mode: "insensitive" } },
                    { user: { name: { contains: search, mode: "insensitive" } } },
                    { user: { email: { contains: search, mode: "insensitive" } } },
                ],
            });
        }
        if (from || to) {
            const dateFilter = {};
            if (from) {
                const fromDate = new Date(from);
                if (Number.isNaN(fromDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "from must be a valid date",
                    });
                }
                dateFilter.gte = fromDate;
            }
            if (to) {
                const toDate = new Date(to);
                if (Number.isNaN(toDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "to must be a valid date",
                    });
                }
                dateFilter.lte = toDate;
            }
            andConditions.push({ date: dateFilter });
        }
        if (userId) {
            andConditions.push({ userId });
        }
        const where = andConditions.length ? { AND: andConditions } : {};
        const [total, records] = await prisma_js_1.prisma.$transaction([
            prisma_js_1.prisma.financialRecord.count({ where }),
            prisma_js_1.prisma.financialRecord.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            status: true,
                        },
                    },
                },
                orderBy: { date: "desc" },
                skip,
                take: pageSize,
            }),
        ]);
        return res.json({
            success: true,
            data: records.map(serializeRecord),
            meta: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    }
    catch (error) {
        console.error("List records error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch records",
        });
    }
});
router.get("/:id", (0, authorizemiddleware_js_1.authorize)("ADMIN", "ANALYST"), (0, validation_js_1.validateParams)(schemas_js_1.recordIdParamSchema), async (req, res) => {
    try {
        const recordId = String(req.params.id);
        const record = await prisma_js_1.prisma.financialRecord.findFirst({
            where: { id: recordId, deletedAt: null },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        status: true,
                    },
                },
            },
        });
        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Record not found",
            });
        }
        return res.json({ success: true, data: serializeRecord(record) });
    }
    catch (error) {
        console.error("Get record error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch record",
        });
    }
});
router.post("/", ratelimit_js_1.recordsWriteRateLimiter, (0, authorizemiddleware_js_1.authorize)("ADMIN"), (0, validation_js_1.validateBody)(schemas_js_1.createRecordSchema), async (req, res) => {
    var _a;
    try {
        const { amount, type, category, date, notes, userId } = req.body;
        const parsedAmount = parseAmount(amount);
        if (!parsedAmount) {
            return res.status(400).json({
                success: false,
                message: "amount must be a valid number",
            });
        }
        if (!recordTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "type must be INCOME or EXPENSE",
            });
        }
        const recordDate = date ? new Date(date) : new Date();
        if (Number.isNaN(recordDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "date must be valid",
            });
        }
        const targetUserId = userId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }
        const targetUser = await prisma_js_1.prisma.user.findUnique({ where: { id: String(targetUserId) } });
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "Target user not found",
            });
        }
        const record = await prisma_js_1.prisma.financialRecord.create({
            data: {
                amount: parsedAmount,
                type,
                category: category.trim(),
                date: recordDate,
                notes: (notes === null || notes === void 0 ? void 0 : notes.trim()) || null,
                userId: String(targetUserId),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        status: true,
                    },
                },
            },
        });
        return res.status(201).json({
            success: true,
            message: "Record created successfully",
            data: serializeRecord(record),
        });
    }
    catch (error) {
        console.error("Create record error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create record",
        });
    }
});
router.patch("/:id", ratelimit_js_1.recordsWriteRateLimiter, (0, authorizemiddleware_js_1.authorize)("ADMIN"), (0, validation_js_1.validateParams)(schemas_js_1.recordIdParamSchema), (0, validation_js_1.validateBody)(schemas_js_1.updateRecordSchema), async (req, res) => {
    try {
        const recordId = String(req.params.id);
        const existing = await prisma_js_1.prisma.financialRecord.findFirst({
            where: { id: recordId, deletedAt: null },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Record not found",
            });
        }
        const { amount, type, category, date, notes } = req.body;
        const data = {};
        if (amount !== undefined) {
            const parsedAmount = parseAmount(amount);
            if (!parsedAmount) {
                return res.status(400).json({
                    success: false,
                    message: "amount must be a valid number",
                });
            }
            data.amount = parsedAmount;
        }
        if (type !== undefined) {
            if (!recordTypes.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: "type must be INCOME or EXPENSE",
                });
            }
            data.type = type;
        }
        if (category !== undefined) {
            if (!category.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "category cannot be empty",
                });
            }
            data.category = category.trim();
        }
        if (date !== undefined) {
            const parsedDate = new Date(date);
            if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "date must be valid",
                });
            }
            data.date = parsedDate;
        }
        if (notes !== undefined) {
            data.notes = (notes === null || notes === void 0 ? void 0 : notes.trim()) || null;
        }
        const updatedRecord = await prisma_js_1.prisma.financialRecord.update({
            where: { id: recordId },
            data,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        status: true,
                    },
                },
            },
        });
        return res.json({
            success: true,
            message: "Record updated successfully",
            data: serializeRecord(updatedRecord),
        });
    }
    catch (error) {
        console.error("Update record error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update record",
        });
    }
});
router.delete("/:id", ratelimit_js_1.recordsWriteRateLimiter, (0, authorizemiddleware_js_1.authorize)("ADMIN"), (0, validation_js_1.validateParams)(schemas_js_1.recordIdParamSchema), async (req, res) => {
    try {
        const recordId = String(req.params.id);
        const existing = await prisma_js_1.prisma.financialRecord.findFirst({
            where: { id: recordId, deletedAt: null },
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Record not found",
            });
        }
        await prisma_js_1.prisma.financialRecord.update({
            where: { id: recordId },
            data: { deletedAt: new Date() },
        });
        return res.json({
            success: true,
            message: "Record deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete record error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete record",
        });
    }
});
router.patch("/:id/restore", ratelimit_js_1.recordsWriteRateLimiter, (0, authorizemiddleware_js_1.authorize)("ADMIN"), (0, validation_js_1.validateParams)(schemas_js_1.recordIdParamSchema), async (req, res) => {
    try {
        const recordId = String(req.params.id);
        const existing = await prisma_js_1.prisma.financialRecord.findUnique({
            where: { id: recordId },
        });
        if (!existing || !existing.deletedAt) {
            return res.status(404).json({
                success: false,
                message: "Deleted record not found",
            });
        }
        const restored = await prisma_js_1.prisma.financialRecord.update({
            where: { id: recordId },
            data: { deletedAt: null },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        status: true,
                    },
                },
            },
        });
        return res.json({
            success: true,
            message: "Record restored successfully",
            data: serializeRecord(restored),
        });
    }
    catch (error) {
        console.error("Restore record error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to restore record",
        });
    }
});
exports.default = router;
