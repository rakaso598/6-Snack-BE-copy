// import { Prisma } from '@prisma/client';

// export type TCreateOrderRequest = {
//   userId?: string; // 인증된 사용자의 ID는 컨트롤러에서 설정
//   adminMessage?: string;
//   requestMessage?: string;
//   cartItemIds: number[];
// };

// export type TCreateInstantOrderRequest = {
//   userId?: string;
//   cartItemIds: number[];
// };

// export type TCreateOrderResponse = Prisma.OrderGetPayload<{
//   include: {
//     orderedItems: {
//       include: {
//         receipt: {
//           select: {
//             id: true;
//             productName: true;
//             price: true;
//             imageUrl: true;
//             quantity: true;
//           };
//         };
//       };
//     };
//   };
// }>;

// OrderRequest 관련 타입이 Order 모델로 통합되어 주석 처리됨
export {}; 