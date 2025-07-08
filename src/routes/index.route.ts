import { Router } from "express";
import authRouter from "./auth.route";
import cartRouter from "./cart.route";
import orderRequestRouter from "./orderRequest.route";
import adminRouter from "./admin.route";
import superAdminRouter from "./superAdmin.route";

const indexRouter = Router();

indexRouter.use("/auth", authRouter);
indexRouter.use("/cart", cartRouter);
indexRouter.use("/orders", orderRequestRouter);
indexRouter.use("/admin", adminRouter);
indexRouter.use("/super-admin", superAdminRouter);

export default indexRouter;
