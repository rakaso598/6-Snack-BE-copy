export type CreateProductDto = {
  categoryId: number;
  creatorId: string;
  name: string;
  price: number;
  imageUrl: string;
  linkUrl: string;
};

export type CreateProductInput = {
  name: string;
  price: string; 
  categoryId: string;
  imageUrl?: string;
  linkUrl: string;
};