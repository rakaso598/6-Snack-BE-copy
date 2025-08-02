import favoriteRepository from "../repositories/favorite.repository";
import { BadRequestError } from "../types/error";
import { TGetFavoritesQuery } from "../types/favorite.types";

const getFavorites = async (userId: string, params: TGetFavoritesQuery) => {
  const { limit, page } = params;
  const offset = (page - 1) * limit;

  const favorites = await favoriteRepository.getFavorites(userId, { offset, limit });

  const totalCount = await favoriteRepository.getFavoritesTotalCount(userId);

  const formattedFavorites = favorites.map(({ product, ...favorite }) => {
    return { ...product };
  });

  return {
    products: formattedFavorites,
    meta: { totalCount, itemsPerPage: limit, totalPage: Math.ceil(totalCount / limit), currentPage: page },
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
