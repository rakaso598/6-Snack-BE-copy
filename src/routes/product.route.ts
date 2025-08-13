import { Router } from "express";
import productController from "../controllers/product.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import upload from "../middlewares/upload.middleware";
import { cacheMiddleware, invalidateCache } from "../middlewares/cacheMiddleware";

const productRouter = Router();

productRouter.get("/category", productController.getCategoryTree);

// 상품 등록
productRouter.post(
  "/",
  authenticateToken,
  invalidateCache(["/products", "/my/products"]),
  upload.single("image"),
  productController.createProduct,
);

// 상품 상세 조회
productRouter.get(
  "/:id",
  authenticateToken,
  cacheMiddleware("/products/:productId"),
  productController.getProductDetail,
);

// 상품 수정
productRouter.patch(
  "/:id",
  authenticateToken,
  invalidateCache(["/products", "/my/products", "/products/:productId", "/cartItems", "/favorites"]),
  productController.updateProduct,
);

// 상품 삭제
productRouter.delete(
  "/:id",
  authenticateToken,
  invalidateCache(["/products", "/my/products", "/products/:productId", "/cartItems", "/favorites"]),
  productController.deleteProduct,
);

// 상품 리스트 조회
productRouter.get("/", authenticateToken, cacheMiddleware("/products"), productController.getProducts);

export default productRouter;
