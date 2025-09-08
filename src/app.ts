import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import indexRouter from "./routes/index.route";
import errorHandler from "./middlewares/errorHandler.middleware";
import cookieParser from "cookie-parser";
import autoCreateMonthlyBudget from "./cron/autoCreateMonthlyBudget";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "./instrument";
import * as Sentry from "@sentry/node";

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://snackk.store"]
        : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:8080"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (req: Request, res: Response) => {
  res.send("Health Check Success");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/", indexRouter);

autoCreateMonthlyBudget.start();

Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);



export default app;
