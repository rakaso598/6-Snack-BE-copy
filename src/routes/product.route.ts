import { Router } from "express";
import productController from "../controllers/product.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import upload from "../middlewares/upload.middleware";

const router = Router();

router.post(
  "/",
  authenticateToken,
  upload.single("image"), 
  productController.createProduct
);
router.get("/:id", authenticateToken, productController.getProductDetail);
router.get("/", productController.getProducts);

export default router;
