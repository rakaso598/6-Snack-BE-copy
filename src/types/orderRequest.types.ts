export type TCreateOrderRequest = {
  userId: string;
  adminMessage?: string;
  requestMessage?: string;
  cartItemIds: number[];
};

export type TCreateOrderResponse = {
  id: number;
  userId: string;
  approver?: string;
  adminMessage?: string;
  requestMessage?: string;
  totalPrice: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
  createdAt: Date;
  updatedAt: Date;
  orderedItems: Array<{
    id: number;
    receipt: {
      id: number;
      productName: string;
      price: number;
      imageUrl: string;
      quantity: number;
    };
  }>;
}; 