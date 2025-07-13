export type TCreateOrderRequestDto = {
  adminMessage?: string;
  requestMessage?: string;
  cartItemIds: number[];
};

export type TCreateInstantOrderRequestDto = {
  cartItemIds: number[];
};

export type TUpdateOrderStatusDto = {
  status: 'CANCELED';
}; 