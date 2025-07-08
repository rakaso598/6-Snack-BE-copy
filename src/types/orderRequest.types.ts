export type TCreateOrderRequest = {
  userId: string;
  adminMessage?: string;
  requestMessage?: string;
  totalPrice: number;
  cartItemIds: number[];
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
};

export type TCreateOrderResponse = {
  id: number;
  userId: string;
  adminMessage?: string;
  requestMessage?: string;
  totalPrice: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
  createdAt: Date;
  updatedAt: Date;
  orderedItems: Array<{
    id: number;
    cartItem: {
      id: number;
      quantity: number;
      product: {
        id: number;
        name: string;
        price: number;
        imageUrl: string;
      };
    };
  }>;
}; 