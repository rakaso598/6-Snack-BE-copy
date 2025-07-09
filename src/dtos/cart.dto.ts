export type TAddToCartDto = {
  productId: number;
  quantity: number;
};

export type TDeleteCartItemsDto = {
  itemIds: number[];
};

export type TToggleCheckDto = {
  isChecked: boolean;
};

export type TToggleParamsDto = {
  item: string;
};
