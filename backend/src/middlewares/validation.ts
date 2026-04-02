import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type Source = "body" | "query" | "params";

const validate = <T>(source: Source, schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
      const query = req.query as Record<string, unknown>;
      Object.keys(query).forEach((key) => {
        delete query[key];
      });
      Object.assign(query, result.data as Record<string, unknown>);
    } else {
      (req as any)[source] = result.data;
    }

    next();
  };
};

export const validateBody = <T>(schema: ZodSchema<T>) => validate("body", schema);
export const validateQuery = <T>(schema: ZodSchema<T>) => validate("query", schema);
export const validateParams = <T>(schema: ZodSchema<T>) => validate("params", schema);
