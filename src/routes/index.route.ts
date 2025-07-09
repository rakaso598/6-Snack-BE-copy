import { Router } from "express";
import authRouter from "./auth.route";
import cartRouter from "./cart.route";
import orderRequestRouter from "./orderRequest.route";
import adminRouter from "./admin.route";
import superAdminRouter from "./superAdmin.route";
<<<<<<< HEAD
import cartRouter from "./cart.route";
import authRouter from "./auth.route";
import inviteRouter from "./invite.route";
import userRouter from "./user.route";
=======
import productRouter from './product.route'
import myRouter from './my.route';
>>>>>>> 912d7162c0fed2cfa798108dd27170693f91e7f8

const indexRouter = Router();

indexRouter.use("/super-admin", superAdminRouter);
indexRouter.use("/admin", adminRouter);
indexRouter.use("/products", productRouter);
indexRouter.use("/cart", cartRouter);
indexRouter.use("/orders", orderRouter);
indexRouter.use("/my", myRouter);
indexRouter.use("/auth", authRouter);
indexRouter.use("/invite", inviteRouter);
indexRouter.use("/users", userRouter);


export default indexRouter;