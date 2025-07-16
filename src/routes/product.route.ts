import { Router } from "express";
import productController from "../controllers/product.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import upload from "../middlewares/upload.middleware";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";

const router = Router();

router.get("/category", productController.getCategoryTree);
router.post(
  "/",
  authenticateToken,
  upload.single("image"), 
  productController.createProduct
);
router.get("/:id", authenticateToken, productController.getProductDetail);
router.patch("/:id", authenticateToken, productController.updateProduct)
router.delete("/:id", authenticateToken, productController.deleteProduct);
router.get("/", productController.getProducts);

export default router;
