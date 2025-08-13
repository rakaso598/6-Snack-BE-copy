import { Router } from "express";
import productController from "../controllers/product.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";

const myRouter = Router();
myRouter.get("/products", authenticateToken, productController.getMyProducts);

export default myRouter;
