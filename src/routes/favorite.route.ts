import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import favoriteController from "../controllers/favorite.controller";
import { cacheMiddleware, invalidateCache } from "../middlewares/cacheMiddleware";

const favoriteRouter = Router();

// 찜 목록 조회
favoriteRouter.get("/", authenticateToken, cacheMiddleware("/favorites"), favoriteController.getFavorites);

// 찜하기
favoriteRouter.post(
  "/:productId",
  authenticateToken,
  invalidateCache(["/favorites", "/products", "/products/:productId"]),
  favoriteController.createFavorite,
);

// 찜 해제하기
favoriteRouter.delete(
  "/:productId",
  authenticateToken,
  invalidateCache(["/favorites", "/products", "/products/:productId"]),
  favoriteController.deleteFavorite,
);

export default favoriteRouter;
