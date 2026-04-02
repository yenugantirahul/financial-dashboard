"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const prisma_js_1 = require("../lib/prisma.js");
const authenticate = async (req, res, next) => {
    var _a, _b, _c, _d;
    try {
        // Extract token from Authorization header or known session cookie names.
        const tokenFromHeader = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        const tokenFromCookies = ((_b = req.cookies) === null || _b === void 0 ? void 0 : _b.sessionToken) ||
            ((_c = req.cookies) === null || _c === void 0 ? void 0 : _c["better-auth.session_token"]) ||
            ((_d = req.cookies) === null || _d === void 0 ? void 0 : _d["__Secure-better-auth.session_token"]);
        const token = tokenFromHeader || tokenFromCookies;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }
        // Find session in database
        const session = await prisma_js_1.prisma.session.findUnique({
            where: { token },
            include: {
                user: true,
            },
        });
        if (!session) {
            return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }
        // Check if session has expired
        if (new Date() > session.expiresAt) {
            return res.status(401).json({ error: "Unauthorized: Token expired" });
        }
        // Check if user is active
        if (session.user.status !== "ACTIVE") {
            return res.status(403).json({ error: "Forbidden: User is inactive" });
        }
        // Attach user to request
        req.user = {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            status: session.user.status,
        };
        next();
    }
    catch (error) {
        console.error("Authentication error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.authenticate = authenticate;
