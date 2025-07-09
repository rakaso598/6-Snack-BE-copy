import { Router } from "express";
import productController from "../controllers/product.controller";
import authenticateToken from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.post(
  "/",
  authenticateToken,
  upload.single("image"), 
  productController.createProduct
);
router.get("/", productController.getProducts)


export default router;
