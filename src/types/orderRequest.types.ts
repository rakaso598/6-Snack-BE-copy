import { Prisma } from '@prisma/client';

export type TCreateOrderRequest = {
  userId?: string; // 인증된 사용자의 ID는 컨트롤러에서 설정
  adminMessage?: string;
  requestMessage?: string;
  cartItemIds: number[];
};

// Prisma Payload 유틸을 사용한 타입 정의
export type TCreateOrderResponse = Prisma.OrderGetPayload<{
  include: {
    orderedItems: {
      include: {
        receipt: {
          select: {
            id: true;
            productName: true;
            price: true;
            imageUrl: true;
            quantity: true;
          };
        };
      };
    };
  };
}>; 