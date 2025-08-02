import { RequestHandler } from "express";
import favoriteService from "../services/favorite.service";
import { AuthenticationError } from "../types/error";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";
import { TFavoriteParamsDto, TGetFavoritesQueryDto } from "../dtos/favorite.dto";

const getFavorites: RequestHandler<{}, {}, {}, TGetFavoritesQueryDto> = async (req, res, next) => {
  const user = req.user;
  const page = parseNumberOrThrow(req.query.page ?? "1", "page");
  const limit = parseNumberOrThrow(req.query.limit ?? "6", "limit");

  if (!user) throw new AuthenticationError("유저 정보가 존재하지 않습니다.");

  const favorites = await favoriteService.getFavorites(user.id, { limit, page });

  res.status(200).json(favorites);
};

const createFavorite: RequestHandler<TFavoriteParamsDto> = async (req, res, next) => {
  const user = req.user;
  const productId = parseNumberOrThrow(req.params.productId, "productId");

  if (!user) throw new AuthenticationError("유저 정보가 존재하지 않습니다.");

  const favorite = await favoriteService.createFavorite(user.id, productId);

  res.status(200).json(favorite);
};

const deleteFavorite: RequestHandler<TFavoriteParamsDto> = async (req, res, next) => {
  const user = req.user;
  const productId = parseNumberOrThrow(req.params.productId, "productId");

  if (!user) throw new AuthenticationError("유저 정보가 존재하지 않습니다.");

  await favoriteService.deleteFavorite(user.id, productId);

  res.status(204).send();
};

export default {
  getFavorites,
  createFavorite,
  deleteFavorite,
};
