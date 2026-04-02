import { Router } from "express";
import { auth } from "../lib/auth.js";
import { authenticate } from "../middlewares/authmiddleware.js";
import { authorize } from "../middlewares/authorizemiddleware.js";
import { validateBody } from "../middlewares/validation.js";
import { createUserSchema } from "../validators/schemas.js";
const router = Router();
router.use(authenticate, authorize("ADMIN"));
router.post("/create", validateBody(createUserSchema), async (req, res) => {
    try {
        const { name, email, password, image, role, status } = req.body;
        const createdUser = await auth.api.signUpEmail({
            body: {
                name,
                email,
                password,
                image,
                role,
                status,
            },
        });
        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: createdUser.user,
            token: createdUser.token,
        });
    }
    catch (error) {
        console.error("Create user error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create user",
        });
    }
});
export default router;
