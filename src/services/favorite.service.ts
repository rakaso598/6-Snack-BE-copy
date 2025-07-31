import favoriteRepository from "../repositories/favorite.repository";

const getFavorites = async (userId: string) => {
  return await favoriteRepository.getFavorites(userId);
};

const createFavorite = async (userId: string, productId: number) => {
  return await favoriteRepository.createFavorite(userId, productId);
};

const deleteFavorite = async (userId: string, productId: number) => {
  return await favoriteRepository.deleteFavorite(userId, productId);
};

export default {
  getFavorites,
  createFavorite,
  deleteFavorite,
};
