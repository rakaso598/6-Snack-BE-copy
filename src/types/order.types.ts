import { Order } from "@prisma/client";

export type TGetOrdersQuery = {
  page: number;
  limit: number;
  orderBy: "latest" | "priceLow" | "priceHigh";
  status: "pending" | "approved";
};

export type TGetOrdersRepositoryQuery = {
  offset: number;
  limit: number;
  orderBy: "latest" | "priceLow" | "priceHigh";
  status: "pending" | "approved";
};

export type TGetOrderStatus = {
  pending: "PENDING";
  approved: "APPROVED";
};

export type TOrderWithBudget = Order & {
  requester: string;
  products: {
    id: number;
    quantity: number;
    price: number;
    imageUrl: string;
    productName: string;
  }[];
  budget: {
    currentMonthBudget: number | null;
    currentMonthExpense: number | null;
  };
};
