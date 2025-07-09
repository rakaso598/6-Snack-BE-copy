import { Router } from "express";
import productController from "../controllers/product.controller";
import authenticateToken from "../middlewares/auth.middleware"; 
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.post(
  "/products",
  authenticateToken,          
  upload.single("image"),     
  productController.createProduct
);

router.get("/products", productController.getMyProducts);

export default router;
