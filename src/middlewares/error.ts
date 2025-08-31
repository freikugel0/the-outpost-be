import type { Request, Response, NextFunction } from "express";
import multer from "multer";

export class AppError extends Error {
  status: number;
  details?: any;

  constructor(status: number, message: string, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  throw new AppError(404, "Not found", {
    path: req.originalUrl,
    method: req.method,
  });
};

export const multerErrorHandler = (
  err: any,
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError(413, "File too large, max 3MB"));
    }
    return next(new AppError(400, `Failed to upload image: ${err.message}`));
  }
  next(err);
};

export const serverError = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(err);

  if (err instanceof AppError) {
    const details = err.details
      ? !Array.isArray(err.details)
        ? [err.details]
        : err.details
      : [];
    return res.status(err.status).json({ error: err.message, details });
  }

  return res.status(500).json({ error: err.message, details: [] });
};
