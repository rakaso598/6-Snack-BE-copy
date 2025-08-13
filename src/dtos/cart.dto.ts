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

export type TToggleAllCheckDto = {
  isChecked: boolean;
};

export type TUpdateQuantityDto = {
  quantity: number;
};
