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

const app: Application = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// CORS 설정
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://5nack.site"] // 프로덕션에서는 실제 프론트엔드 도메인으로 변경
        : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:8080"], // 개발 환경
    credentials: true, // 쿠키 포함 허용
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req: Request, res: Response) => {
  res.send("Health Check Success");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/", indexRouter);

// node-cron 실행
autoCreateMonthlyBudget.start();

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});

export default app;
