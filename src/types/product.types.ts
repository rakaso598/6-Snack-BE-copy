import { Product } from "@prisma/client";

export type SortOption = "latest" | "popular" | "low" | "high";

export type ProductQueryOptions = {
  sort?: SortOption;
  category?: number;
  skip?: number;
  take?: number;
  creatorId?: string;
  cursor?: { id: number } | undefined;
  orderBy?: any;
  
};
export type ProductSaleCount = Product & {
  saleCount: number;
};

export type CreatorQueryOptions = {
  creatorId: string;
  skip?: number;
  take?: number;
};

export type CreateProductParams = {
  name: string;
  price: number;
  linkUrl: string;
  imageUrl: string; 
  categoryId: number;
  creatorId: string;
};
