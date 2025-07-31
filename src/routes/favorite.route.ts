import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import favoriteController from "../controllers/favorite.controller";

const favoritRouter = Router();

favoritRouter.get("/", authenticateToken, favoriteController.getFavorites);
favoritRouter.post("/:productId", authenticateToken, favoriteController.createFavorite);
favoritRouter.delete("/:productId", authenticateToken, favoriteController.deleteFavorite);

export default favoritRouter;
