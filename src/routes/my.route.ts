import { Router } from "express";
import productController from "../controllers/product.controller";
import authenticateToken from "../middlewares/auth.middleware"; 

const router = Router();
router.get("/products", authenticateToken,productController.getMyProducts);

export default router;
