"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = void 0;
const validate = (source, schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.issues.map((issue) => ({
                    path: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }
        if (source === "query") {
            const query = req.query;
            Object.keys(query).forEach((key) => {
                delete query[key];
            });
            Object.assign(query, result.data);
        }
        else {
            req[source] = result.data;
        }
        next();
    };
};
const validateBody = (schema) => validate("body", schema);
exports.validateBody = validateBody;
const validateQuery = (schema) => validate("query", schema);
exports.validateQuery = validateQuery;
const validateParams = (schema) => validate("params", schema);
exports.validateParams = validateParams;
