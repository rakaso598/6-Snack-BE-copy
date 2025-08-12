import { Router } from "express";
import productController from "../controllers/product.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import upload from "../middlewares/upload.middleware";
import { cacheMiddleware, invalidateCache } from "../middlewares/cacheMiddleware";

const router = Router();

router.get("/category", cacheMiddleware(), productController.getCategoryTree);
router.post("/", invalidateCache(), authenticateToken, upload.single("image"), productController.createProduct);
router.get("/:id", authenticateToken, cacheMiddleware(), productController.getProductDetail);
router.patch("/:id", authenticateToken, invalidateCache(), productController.updateProduct);
router.delete("/:id", authenticateToken, invalidateCache(), productController.deleteProduct);
router.get("/", authenticateToken, cacheMiddleware(), productController.getProducts);

export default router;
