import { Router } from "express";
import productController from "../controllers/product.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import { cacheMiddleware } from '../middlewares/cacheMiddleware';

const router = Router();
router.get("/products", cacheMiddleware(), authenticateToken, productController.getMyProducts);

export default router;
