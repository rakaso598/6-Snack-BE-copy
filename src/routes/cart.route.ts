import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import cartController from "../controllers/cart.controller";

const cartRouter = Router();

cartRouter.use(authenticateToken);

cartRouter.get("/", cartController.getMyCart);
cartRouter.post("/", cartController.addToCart);
cartRouter.delete("/", cartController.deleteSelectedItems);
cartRouter.delete("/:item", cartController.deleteCartItem);
cartRouter.patch("/:item/check", cartController.toggleCheckItem);

export default cartRouter;
