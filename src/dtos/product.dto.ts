export type TCreateProductDto = {
  categoryId: string;
  creatorId: string;
  name: string;
  price: string;
  imageUrl: string;
  linkUrl: string;
};

export type TGetProductsQueryDto = {
  sort: string;
  category: string;
  cursor: string;
  limit: string;
};

export type TGetMyProductsDto = {
  creatorId: string;
  page: number;
  limit: number;
  skip: number;
};

export type TGetMyProductsQueryDto = {
  page: string;
  limit: string;
};

export type TProductIdParamsDto = {
  id: string; 
};

export type TUpdateProductDto = {
  name: string;
  price: string;
  linkUrl: string;
  categoryId: string;
};