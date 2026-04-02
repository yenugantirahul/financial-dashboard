"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../lib/auth.js");
const authmiddleware_js_1 = require("../middlewares/authmiddleware.js");
const authorizemiddleware_js_1 = require("../middlewares/authorizemiddleware.js");
const validation_js_1 = require("../middlewares/validation.js");
const schemas_js_1 = require("../validators/schemas.js");
const router = (0, express_1.Router)();
router.use(authmiddleware_js_1.authenticate, (0, authorizemiddleware_js_1.authorize)("ADMIN"));
router.post("/create", (0, validation_js_1.validateBody)(schemas_js_1.createUserSchema), async (req, res) => {
    try {
        const { name, email, password, image, role, status } = req.body;
        const createdUser = await auth_js_1.auth.api.signUpEmail({
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
exports.default = router;
