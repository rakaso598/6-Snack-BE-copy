export type TApprovedOrderQueryDto = {
  offset: string;
  limit: string;
  orderBy: "latest" | "priceLow" | "priceHigh";
};

export type TOrderParamsDto = {
  orderId: string;
};
