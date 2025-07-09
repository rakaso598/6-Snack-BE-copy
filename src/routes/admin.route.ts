import { Router } from "express";
import adminOrderRouter from "./adminOrder.route";

const adminRouter = Router();

adminRouter.use("/orders", adminOrderRouter);

export default adminRouter;
