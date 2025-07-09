export const receiptMockData = [
  // Order 1의 Receipt들 (user-1의 주문: 포카칩 2개 + 콜라 1개 = 4500원)
  {
    id: 1,
    productName: "오리지널 포카칩",
    price: 1500,
    imageUrl: "https://example.com/pocachip.jpg",
    quantity: 2,
  },
  {
    id: 2,
    productName: "코카콜라 500ml",
    price: 1500,
    imageUrl: "https://example.com/coke.jpg",
    quantity: 1,
  },

  // Order 2의 Receipt들 (user-2의 주문: 킷캣 3개 = 2400원)
  {
    id: 3,
    productName: "킷캣 미니",
    price: 800,
    imageUrl: "https://example.com/kitkat.jpg",
    quantity: 3,
  },

  // Order 3의 Receipt들 (user-3의 주문: 신라면 1개 + 아몬드 1개 = 3300원)
  {
    id: 4,
    productName: "신라면 컵",
    price: 800,
    imageUrl: "https://example.com/shinramyun.jpg",
    quantity: 1,
  },
  {
    id: 5,
    productName: "아몬드 믹스",
    price: 2500,
    imageUrl: "https://example.com/almond.jpg",
    quantity: 1,
  },
];