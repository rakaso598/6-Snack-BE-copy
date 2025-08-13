import { Router } from "express";
import productController from "../controllers/product.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import upload from "../middlewares/upload.middleware";

const productRouter = Router();

productRouter.get("/category", productController.getCategoryTree);

// 상품 등록
productRouter.post(
  "/",
  authenticateToken,
  upload.single("image"),
  productController.createProduct,
);

// 상품 상세 조회
productRouter.get(
  "/:id",
  authenticateToken,
  productController.getProductDetail,
);

// 상품 수정
productRouter.patch(
  "/:id",
  authenticateToken,
  productController.updateProduct,
);

// 상품 삭제
productRouter.delete(
  "/:id",
  authenticateToken,
  productController.deleteProduct,
);

// 상품 리스트 조회
productRouter.get("/", authenticateToken, productController.getProducts);

export default productRouter;
