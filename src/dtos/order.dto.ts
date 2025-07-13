export type TGetOrdersQueryDto = {
  offset: string;
  limit: string;
  orderBy: "latest" | "priceLow" | "priceHigh";
  status: "pending" | "approved";
};

export type TGetOrderParamsDto = {
  orderId: string;
};

export type TUpdateStatusOrderBodyDto = {
  adminMessage?: string;
  status: "APPROVED" | "REJECTED";
};
