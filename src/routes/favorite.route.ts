import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import favoriteController from "../controllers/favorite.controller";
import { cacheMiddleware, invalidateCache } from "../middlewares/cacheMiddleware";

const favoriteRouter = Router();

favoriteRouter.get("/", authenticateToken, cacheMiddleware(), favoriteController.getFavorites);
favoriteRouter.post("/:productId", authenticateToken, invalidateCache(), favoriteController.createFavorite);
favoriteRouter.delete("/:productId", authenticateToken, invalidateCache(), favoriteController.deleteFavorite);

export default favoriteRouter;
