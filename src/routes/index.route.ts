import { Router } from "express";
import adminRouter from "./admin.route";
import superAdminRouter from "./superAdmin.route";
import cartRouter from "./cart.route";

const indexRouter = Router();

indexRouter.use("/super-admin", superAdminRouter);
indexRouter.use("/admin", adminRouter);
// indexRouter.use("/products", productRouter);
indexRouter.use("/cart", cartRouter);
// indexRouter.use("/orders", orderRouter);
// indexRouter.use("/my", myRouter);

export default indexRouter;
