import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import cartController from "../controllers/cart.controller";
import { cacheMiddleware, invalidateCache } from "../middlewares/cacheMiddleware";

const cartRouter = Router();

cartRouter.use(authenticateToken);

cartRouter.get("/", cacheMiddleware("/cartItems"), cartController.getMyCart);
cartRouter.post("/", invalidateCache("/cartItems"), cartController.addToCart);
cartRouter.delete("/", invalidateCache("/cartItems"), cartController.deleteSelectedItems);
cartRouter.delete("/:item", invalidateCache("/cartItems"), cartController.deleteCartItem);
cartRouter.patch("/:item/check", invalidateCache("/cartItems"), cartController.toggleCheckItem);
cartRouter.patch("/check", invalidateCache("/cartItems"), cartController.toggleAllItems);
cartRouter.patch("/:item/quantity", invalidateCache("/cartItems"), cartController.updateQuantity);

export default cartRouter;
