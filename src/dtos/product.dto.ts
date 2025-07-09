export type TCreateProductDto = {
  categoryId: number;
  creatorId: string;
  name: string;
  price: number;
  imageUrl: string;
  linkUrl: string;
};

export type TCreateProductInput = {
  name: string;
  price: string; 
  categoryId: string;
  imageUrl?: string;
  linkUrl: string;
};