export type TFavoriteParamsDto = {
  productId: string;
};

export type TGetFavoritesQueryDto = {
  page: string;
  limit: string;
  orderBy: "latest";
};
