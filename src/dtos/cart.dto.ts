export type AddToCartDto = {
  productId: number;
  quantity: number;
};

export type DeleteCartItemsDto = {
  itemIds: number[];
};
