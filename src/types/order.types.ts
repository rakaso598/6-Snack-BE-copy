export type TApprovedOrderQuery = {
  offset: number;
  limit: number;
  orderBy: "latest" | "priceLow" | "priceHigh";
};
