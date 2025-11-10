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

// CSP 설정을 통해 API 도메인으로의 연결을 허용
const cspConfig = process.env.NODE_ENV === "production"
  ? {
    defaultSrc: ["'self'"],
    connectSrc: [
      "'self'",
      "https://api.snackk.store",
      "https://*.snackk.store" // 모든 서브도메인 허용 (필요시)
    ],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'", "https:", "data:"],
  }
  : {
    defaultSrc: ["'self'"],
    connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:", "http:"],
    fontSrc: ["'self'", "https:", "data:"],
  };

app.use(helmet({
  contentSecurityPolicy: {
    directives: cspConfig,
  },
}));

let corsOrigins: string[];
if (process.env.NODE_ENV === "production") {
  corsOrigins = [
    "https://snackk.store",
    "https://www.snackk.store"
  ];
} else {
  corsOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:8080",
  ];
}

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Cache-Control",
      "X-Forwarded-For"
    ],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  }),
);

// OPTIONS 요청을 명시적으로 처리
app.options('*', cors());

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
