import { Router } from "express";
import productController from "../controllers/product.controller";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import optionalAuthenticateToken from "../middlewares/optionalAuth.middleware";
import upload from "../middlewares/upload.middleware";

const productRouter = Router();

// 카테고리 조회 (선택적 인증) - 구체적인 경로를 먼저
productRouter.get("/category", optionalAuthenticateToken, productController.getCategoryTree);

// 상품 리스트 조회 (선택적 인증 - 로그인하지 않아도 접근 가능)
productRouter.get("/", optionalAuthenticateToken, productController.getProducts);

// 상품 등록 (인증 필요)
productRouter.post(
  "/",
  authenticateToken,
  upload.single("image"),
  productController.createProduct,
);

// 상품 상세 조회 (선택적 인증) - 동적 경로는 나중에
productRouter.get(
  "/:id",
  optionalAuthenticateToken,
  productController.getProductDetail,
);

// 상품 수정 (인증 필요)
productRouter.patch(
  "/:id",
  authenticateToken,
  productController.updateProduct,
);

// 상품 삭제 (인증 필요)
productRouter.delete(
  "/:id",
  authenticateToken,
  productController.deleteProduct,
);

export default productRouter;
