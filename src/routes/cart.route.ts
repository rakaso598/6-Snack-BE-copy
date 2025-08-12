import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import cartController from "../controllers/cart.controller";
import { cacheMiddleware, invalidateCache } from "../middlewares/cacheMiddleware";

const cartRouter = Router();

cartRouter.use(authenticateToken);

cartRouter.get("/", cacheMiddleware(), cartController.getMyCart);
cartRouter.post("/", invalidateCache(), cartController.addToCart);
cartRouter.delete("/", invalidateCache(), cartController.deleteSelectedItems);
cartRouter.delete("/:item", invalidateCache(), cartController.deleteCartItem);
cartRouter.patch("/:item/check", invalidateCache(), cartController.toggleCheckItem);
cartRouter.patch("/check", invalidateCache(), cartController.toggleAllItems);
cartRouter.patch("/:item/quantity", invalidateCache(), cartController.updateQuantity);

export default cartRouter;
