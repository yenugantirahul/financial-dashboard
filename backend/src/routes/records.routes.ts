import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthenticatedRequest } from "../middlewares/authmiddleware.js";
import { authorize } from "../middlewares/authorizemiddleware.js";
import { recordsWriteRateLimiter } from "../middlewares/ratelimit.js";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation.js";
import {
  createRecordSchema,
  recordIdParamSchema,
  recordsQuerySchema,
  updateRecordSchema,
} from "../validators/schemas.js";

const router = Router();

const recordTypes = ["INCOME", "EXPENSE"] as const;

type RecordType = (typeof recordTypes)[number];

const serializeRecord = (record: {
  id: string;
  amount: { toString: () => string };
  type: RecordType;
  category: string;
  date: Date;
  notes: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  user?: { id: string; name: string; email: string; role: string; status: string };
}) => ({
  ...record,
  amount: record.amount.toString(),
  date: record.date.toISOString(),
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
  deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
});

const parseAmount = (value: unknown) => {
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

router.use(authenticate);

router.get("/", authorize("ADMIN", "ANALYST"), validateQuery(recordsQuerySchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { search, type, category, from, to, userId, deleted, page, limit } = recordsQuerySchema.parse(req.query);

    const pageNumber = page;
    const pageSize = limit;
    const skip = (pageNumber - 1) * pageSize;

    if (userId && req.user?.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admins can filter by userId",
      });
    }

    const andConditions: any[] = [];

    if (deleted === "exclude") {
      andConditions.push({ deletedAt: null });
    } else if (deleted === "only") {
      andConditions.push({ deletedAt: { not: null } });
    }

    if (type) {
      if (!recordTypes.includes(type as RecordType)) {
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
      const dateFilter: Record<string, Date> = {};
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

    const [total, records] = await prisma.$transaction([
      prisma.financialRecord.count({ where }),
      prisma.financialRecord.findMany({
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
  } catch (error) {
    console.error("List records error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch records",
    });
  }
});

router.get("/:id", authorize("ADMIN", "ANALYST"), validateParams(recordIdParamSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const recordId = String(req.params.id);
    const record = await prisma.financialRecord.findFirst({
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
  } catch (error) {
    console.error("Get record error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch record",
    });
  }
});

router.post("/", recordsWriteRateLimiter, authorize("ADMIN"), validateBody(createRecordSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { amount, type, category, date, notes, userId } = req.body as {
      amount: unknown;
      type: RecordType;
      category: string;
      date?: string;
      notes?: string;
      userId?: string;
    };

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

    const targetUserId = userId || req.user?.id;
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: String(targetUserId) } });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    const record = await prisma.financialRecord.create({
      data: {
        amount: parsedAmount,
        type,
        category: category.trim(),
        date: recordDate,
        notes: notes?.trim() || null,
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
  } catch (error) {
    console.error("Create record error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create record",
    });
  }
});

router.patch("/:id", recordsWriteRateLimiter, authorize("ADMIN"), validateParams(recordIdParamSchema), validateBody(updateRecordSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const recordId = String(req.params.id);
    const existing = await prisma.financialRecord.findFirst({
      where: { id: recordId, deletedAt: null },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    const { amount, type, category, date, notes } = req.body as {
      amount?: unknown;
      type?: RecordType;
      category?: string;
      date?: string;
      notes?: string | null;
    };

    const data: any = {};

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
      data.notes = notes?.trim() || null;
    }

    const updatedRecord = await prisma.financialRecord.update({
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
  } catch (error) {
    console.error("Update record error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update record",
    });
  }
});

router.delete("/:id", recordsWriteRateLimiter, authorize("ADMIN"), validateParams(recordIdParamSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const recordId = String(req.params.id);
    const existing = await prisma.financialRecord.findFirst({
      where: { id: recordId, deletedAt: null },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    await prisma.financialRecord.update({
      where: { id: recordId },
      data: { deletedAt: new Date() },
    });

    return res.json({
      success: true,
      message: "Record deleted successfully",
    });
  } catch (error) {
    console.error("Delete record error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete record",
    });
  }
});

router.patch("/:id/restore", recordsWriteRateLimiter, authorize("ADMIN"), validateParams(recordIdParamSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const recordId = String(req.params.id);
    const existing = await prisma.financialRecord.findUnique({
      where: { id: recordId },
    });

    if (!existing || !existing.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Deleted record not found",
      });
    }

    const restored = await prisma.financialRecord.update({
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
  } catch (error) {
    console.error("Restore record error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to restore record",
    });
  }
});

export default router;
