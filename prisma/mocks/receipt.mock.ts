export const receiptMockData = [
  // Order 1의 Receipt들 (user-1의 주문: 포카칩 2개 + 콜라 1개 = 4500원)
  {
    productId: 1,
    orderId: 1,
    productName: "오리온 초코파이",
    price: 1500,
    imageUrl: "https://team3-snack-s3.s3.amazonaws.com/products/orion-chocopie.png",
    quantity: 2,
    createdAt: new Date("2025-07-15T10:30:00Z"),
  },
  {
    productId: 6,
    orderId: 1,
    productName: "롯데 칸쵸",
    price: 1500,
    imageUrl: "https://team3-snack-s3.s3.amazonaws.com/products/lotte-kancho.png",
    quantity: 1,
    createdAt: new Date("2025-07-15T10:30:00Z"),
  },

  // Order 2의 Receipt들 (user-2의 주문: 새우깡 3개 = 2400원)
  {
    productId: 3,
    orderId: 2,
    productName: "농심 새우깡",
    price: 800,
    imageUrl: "https://team3-snack-s3.s3.amazonaws.com/products/nongshim-saewookang.png",
    quantity: 3,
    createdAt: new Date("2025-07-16T14:15:00Z"),
  },

  // Order 3의 Receipt들 (user-3의 주문: 홈런볼 1개 + 산도 1개 = 4500원)
  {
    productId: 4,
    orderId: 3,
    productName: "해태 홈런볼",
    price: 2500,
    imageUrl: "https://team3-snack-s3.s3.amazonaws.com/products/haetae-homerunball.png",
    quantity: 1,
    createdAt: new Date("2025-07-17T09:45:00Z"),
  },
  {
    productId: 7,
    orderId: 3,
    productName: "크라운 산도",
    price: 2000,
    imageUrl: "https://team3-snack-s3.s3.amazonaws.com/products/crown-sando.png",
    quantity: 1,
    createdAt: new Date("2025-07-17T09:45:00Z"),
  },
];
