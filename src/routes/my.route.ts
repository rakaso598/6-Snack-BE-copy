import { Router } from "express";
import productController from "../controllers/product.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";

const myRouter = Router();
myRouter.get("/products", cacheMiddleware("/my/products"), authenticateToken, productController.getMyProducts);

export default myRouter;
