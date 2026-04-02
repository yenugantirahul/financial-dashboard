"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authmiddleware_js_1 = require("../middlewares/authmiddleware.js");
const authorizemiddleware_js_1 = require("../middlewares/authorizemiddleware.js");
const router = (0, express_1.Router)();
router.get("/", authmiddleware_js_1.authenticate, (0, authorizemiddleware_js_1.authorize)("ADMIN", "ANALYST"), (req, res) => {
    res.json({ message: "Analytics data" });
});
router.get("/filter", authmiddleware_js_1.authenticate, (0, authorizemiddleware_js_1.authorize)("ADMIN", "ANALYST"), (req, res) => {
    res.json({ message: "Filtered analytics data" });
});
exports.default = router;
