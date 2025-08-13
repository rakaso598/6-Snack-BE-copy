export type TGetOrdersQueryDto = {
  page: string;
  limit: string;
  orderBy: "latest" | "priceLow" | "priceHigh";
  status: "pending" | "approved";
};

export type TGetOrderQueryDto = {
  page: string;
  limit: string;
  orderBy: "latest" | "priceLow" | "priceHigh";
  status?: "pending" | "approved";
};

export type TGetOrderParamsDto = {
  orderId: string;
};

export type TUpdateStatusOrderBodyDto = {
  adminMessage?: string;
  status: "APPROVED" | "REJECTED";
};
