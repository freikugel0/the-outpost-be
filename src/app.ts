import "dotenv/config";
import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import limiter from "./middlewares/limiter.js";
import {
  multerErrorHandler,
  notFound,
  serverError,
} from "./middlewares/error.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import productRoutes from "./routes/product.js";
import orderRoutes from "./routes/order.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

const app = express();
const port = process.env.PORT;

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST"],
  }),
);
app.use(limiter);

app.use(express.json());
app.use(cookieParser());

app.use("/images", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/v1", authRoutes);
app.use("/api/v1", userRoutes);
app.use("/api/v1", productRoutes);
app.use("/api/v1", orderRoutes);

const swaggerDocs = swaggerJsDoc({
  definition: {
    openapi: "3.1.0",
    info: {
      title: "The Outpost API",
      version: "1.0.0",
      description: "API docs for final task backend",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: "http://localhost:3000/api/v1",
      },
    ],
  },
  apis: ["**/*.ts"],
});
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs, {
    explorer: true,
  }),
);

app.use(notFound);
app.use(multerErrorHandler);
app.use(serverError);

app.listen(port, () => {
  console.log(`Running on :${port}`);
});
