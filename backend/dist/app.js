"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const node_1 = require("better-auth/node");
const auth_js_1 = require("./lib/auth.js");
const ratelimit_js_1 = require("./middlewares/ratelimit.js");
const users_routes_js_1 = __importDefault(require("./routes/users.routes.js"));
const dashboard_routes_js_1 = __importDefault(require("./routes/dashboard.routes.js"));
const admin_routes_js_1 = __importDefault(require("./routes/admin.routes.js"));
const records_routes_js_1 = __importDefault(require("./routes/records.routes.js"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
// Express v5
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true, // important if using cookies
}));
app.use(express_1.default.json());
app.use("/api", ratelimit_js_1.apiRateLimiter);
app.all("/api/auth/*splat", ratelimit_js_1.authRateLimiter, (0, node_1.toNodeHandler)(auth_js_1.auth));
app.use("/api/users", users_routes_js_1.default);
app.use("/api/dashboard", dashboard_routes_js_1.default);
app.use("/api/admin", admin_routes_js_1.default);
app.use("/api/records", records_routes_js_1.default);
exports.default = app;
