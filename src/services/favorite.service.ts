import favoriteRepository from "../repositories/favorite.repository";
import { BadRequestError } from "../types/error";
import { TGetFavoritesQuery } from "../types/favorite.types";

const getFavorites = async (userId: string, params: TGetFavoritesQuery) => {
  const { cursor, limit } = params;

  const favorites = await favoriteRepository.getFavorites(userId, { cursor, limit });

  const totalCount = await favoriteRepository.getFavoritesTotalCount(userId);

  const formattedFavorites = favorites.map((favorite) => ({
    id: favorite.id,
    product: favorite.product,
  }));

  const nextCursor = favorites.length === Number(limit) ? favorites[favorites.length - 1].id : undefined;

  return {
    favorites: formattedFavorites,
    meta: { totalCount, itemsPerPage: limit, totalPages: Math.ceil(totalCount / limit), nextCursor },
  };
};

const createFavorite = async (userId: string, productId: number) => {
  const favorite = await favoriteRepository.getFavorite(userId, productId);

  if (favorite) throw new BadRequestError("이미 찜한 상품입니다.");

  return await favoriteRepository.createFavorite(userId, productId);
};

const deleteFavorite = async (userId: string, productId: number) => {
  const favorite = await favoriteRepository.getFavorite(userId, productId);

  if (!favorite) throw new BadRequestError("이미 찜 해제한 상품입니다.");

  return await favoriteRepository.deleteFavorite(userId, productId);
};

export default {
  getFavorites,
  createFavorite,
  deleteFavorite,
};
