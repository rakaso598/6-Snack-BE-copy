import favoriteRepository from "../repositories/favorite.repository";
import { BadRequestError } from "../types/error";

const getFavorites = async (userId: string) => {
  return await favoriteRepository.getFavorites(userId);
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
