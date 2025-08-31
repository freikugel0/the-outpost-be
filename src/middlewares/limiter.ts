import rateLimit from "express-rate-limit";
import { AppError } from "./error.js";

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  handler: () => {
    throw new AppError(429, "Request limit exceeded, try again later");
  },
});

export default limiter;
