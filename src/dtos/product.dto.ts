export interface ProductDto {
  id: number;
  categoryId: number;
  creatorId: string;
  name: string;
  price: number;
  imageUrl: string;
  linkUrl: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateProductDto {
  categoryId: number;
  creatorId: string;
  name: string;
  price: number;
  imageUrl: string;
  linkUrl: string;
}

export interface UpdateProductDto {
  categoryId?: number;
  name?: string;
  price?: number;
  imageUrl?: string;
  linkUrl?: string;
  deletedAt?: Date | null;
}