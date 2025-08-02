export type TFavoriteParamsDto = {
  productId: string;
};

export type TGetFavoritesQueryDto = {
  cursor: string | undefined;
  limit: string;
};
