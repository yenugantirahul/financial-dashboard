import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middlewares/authmiddleware.js";
import { authorize } from "../middlewares/authorizemiddleware.js";
const router = Router();
const toNumber = (value) => Number(String(value ?? 0));
const formatMonthKey = (date) => date.toISOString().slice(0, 7);
router.get("/", authenticate, authorize("ADMIN", "ANALYST", "VIEWER"), async (req, res) => {
    try {
        const [income, expense, recentRecords, categoryTotals, trendRecords] = await prisma.$transaction([
            prisma.financialRecord.aggregate({
                where: { type: "INCOME", deletedAt: null },
                _sum: { amount: true },
                _count: { _all: true },
            }),
            prisma.financialRecord.aggregate({
                where: { type: "EXPENSE", deletedAt: null },
                _sum: { amount: true },
                _count: { _all: true },
            }),
            prisma.financialRecord.findMany({
                where: { deletedAt: null },
                orderBy: { date: "desc" },
                take: 5,
                select: {
                    id: true,
                    amount: true,
                    type: true,
                    category: true,
                    date: true,
                    notes: true,
                    userId: true,
                },
            }),
            prisma.financialRecord.groupBy({
                by: ["category", "type"],
                where: { deletedAt: null },
                _sum: { amount: true },
                orderBy: [{ category: "asc" }, { type: "asc" }],
            }),
            prisma.financialRecord.findMany({
                where: {
                    deletedAt: null,
                    date: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
                    },
                },
                select: {
                    amount: true,
                    type: true,
                    date: true,
                },
            }),
        ]);
        const monthlyMap = new Map();
        for (let offset = 5; offset >= 0; offset -= 1) {
            const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
            const month = formatMonthKey(monthDate);
            monthlyMap.set(month, { month, income: 0, expense: 0, net: 0 });
        }
        for (const record of trendRecords) {
            const month = formatMonthKey(new Date(record.date));
            const bucket = monthlyMap.get(month);
            if (!bucket) {
                continue;
            }
            const amount = toNumber(record.amount);
            if (record.type === "INCOME") {
                bucket.income += amount;
            }
            else {
                bucket.expense += amount;
            }
            bucket.net = bucket.income - bucket.expense;
        }
        const categoryWiseTotals = categoryTotals.map((entry) => ({
            category: entry.category,
            type: entry.type,
            total: toNumber(entry._sum?.amount ?? 0),
        }));
        const totalIncome = toNumber(income._sum.amount);
        const totalExpense = toNumber(expense._sum.amount);
        return res.json({
            success: true,
            data: {
                summary: {
                    totalIncome,
                    totalExpense,
                    netBalance: totalIncome - totalExpense,
                    incomeCount: income._count._all,
                    expenseCount: expense._count._all,
                },
                categoryWiseTotals,
                recentActivity: recentRecords.map((record) => ({
                    ...record,
                    amount: record.amount.toString(),
                    date: record.date.toISOString(),
                })),
                monthlyTrends: Array.from(monthlyMap.values()),
                role: req.user?.role,
            },
        });
    }
    catch (error) {
        console.error("Dashboard summary error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard data",
        });
    }
});
router.get("/trends", authenticate, authorize("ADMIN", "ANALYST", "VIEWER"), async (_req, res) => {
    try {
        const records = await prisma.financialRecord.findMany({
            where: {
                deletedAt: null,
                date: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1),
                },
            },
            select: {
                amount: true,
                type: true,
                date: true,
            },
        });
        const monthlyMap = new Map();
        for (let offset = 11; offset >= 0; offset -= 1) {
            const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
            const month = formatMonthKey(monthDate);
            monthlyMap.set(month, { month, income: 0, expense: 0, net: 0 });
        }
        for (const record of records) {
            const month = formatMonthKey(new Date(record.date));
            const bucket = monthlyMap.get(month);
            if (!bucket) {
                continue;
            }
            const amount = toNumber(record.amount);
            if (record.type === "INCOME") {
                bucket.income += amount;
            }
            else {
                bucket.expense += amount;
            }
            bucket.net = bucket.income - bucket.expense;
        }
        return res.json({
            success: true,
            data: Array.from(monthlyMap.values()),
        });
    }
    catch (error) {
        console.error("Dashboard trends error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load trends",
        });
    }
});
export default router;
