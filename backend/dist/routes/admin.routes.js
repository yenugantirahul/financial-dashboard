import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middlewares/authmiddleware.js";
import { authorize } from "../middlewares/authorizemiddleware.js";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation.js";
import { adminUpdateUserSchema, adminUsersQuerySchema, recordIdParamSchema } from "../validators/schemas.js";
const router = Router();
router.use(authenticate, authorize("ADMIN"));
router.get("/users", validateQuery(adminUsersQuerySchema), async (req, res) => {
    try {
        const { search, role, status, page, limit } = adminUsersQuerySchema.parse(req.query);
        const pageNumber = page;
        const pageSize = limit;
        const skip = (pageNumber - 1) * pageSize;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: "insensitive" } },
                { email: { contains: String(search), mode: "insensitive" } },
            ];
        }
        if (role) {
            where.role = role;
        }
        if (status) {
            where.status = status;
        }
        const [total, users] = await prisma.$transaction([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    image: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);
        return res.json({
            success: true,
            data: users,
            meta: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    }
    catch (error) {
        console.error("List users error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
});
router.get("/users/:id", validateParams(recordIdParamSchema), async (req, res) => {
    try {
        const userId = String(req.params.id);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                image: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        return res.json({ success: true, data: user });
    }
    catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user",
        });
    }
});
router.patch("/users/:id", validateParams(recordIdParamSchema), validateBody(adminUpdateUserSchema), async (req, res) => {
    try {
        const userId = String(req.params.id);
        const { name, email, role, status, image } = req.body;
        const data = {};
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "name cannot be empty",
                });
            }
            data.name = name.trim();
        }
        if (email !== undefined) {
            if (!email.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "email cannot be empty",
                });
            }
            data.email = email.trim();
        }
        if (role !== undefined) {
            data.role = role;
        }
        if (status !== undefined) {
            data.status = status;
        }
        if (image !== undefined) {
            data.image = image;
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                image: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return res.json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    }
    catch (error) {
        console.error("Update user error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update user",
        });
    }
});
router.delete("/users/:id", validateParams(recordIdParamSchema), async (req, res) => {
    try {
        const userId = String(req.params.id);
        const existing = await prisma.user.findUnique({ where: { id: userId } });
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        await prisma.user.delete({ where: { id: userId } });
        return res.json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete user",
        });
    }
});
export default router;
