import { prisma } from "../lib/prisma.js";
export const authenticate = async (req, res, next) => {
    try {
        // Extract token from Authorization header or known session cookie names.
        const tokenFromHeader = req.headers.authorization?.replace("Bearer ", "");
        const tokenFromCookies = req.cookies?.sessionToken ||
            req.cookies?.["better-auth.session_token"] ||
            req.cookies?.["__Secure-better-auth.session_token"];
        const token = tokenFromHeader || tokenFromCookies;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }
        // Find session in database
        const session = await prisma.session.findUnique({
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
