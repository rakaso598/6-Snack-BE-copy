import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import favoriteController from "../controllers/favorite.controller";

const favoriteRouter = Router();

// 찜 목록 조회
favoriteRouter.get("/", authenticateToken, favoriteController.getFavorites);

// 찜하기
favoriteRouter.post(
  "/:productId",
  authenticateToken,
  favoriteController.createFavorite,
);

// 찜 해제하기
favoriteRouter.delete(
  "/:productId",
  authenticateToken,
  favoriteController.deleteFavorite,
);

export default favoriteRouter;
