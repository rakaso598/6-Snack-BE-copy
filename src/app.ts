import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import indexRouter from "./routes/index.route";
import errorHandler from "./middlewares/errorHandler.middleware";
import cookieParser from "cookie-parser";
import autoCreateMonthlyBudget from "./cron/autoCreateMonthlyBudget";

const app: Application = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
