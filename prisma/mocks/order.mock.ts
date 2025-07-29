export const orderMockData = [
  {
    id: 1,
    companyId: 1,
    userId: "user-1",
    approver: "최고관리자",
    adminMessage: "스낵 주문이 승인되었습니다. 오후 2시에 배송됩니다.",
    requestMessage: "오늘 오후중으로만 승인 부탁드려요",
    totalPrice: 4500, // 초코파이 2개(3000) + 칸쵸 1개(1500)
    status: "APPROVED",
    createdAt: new Date("2025-06-15"),
    updatedAt: new Date("2025-06-15"),
  },
  {
    id: 2,
    companyId: 1,
    userId: "user-2",
    adminMessage: null,
    requestMessage: "내일 아침 회의 전에 스낵 준비해주세요.",
    totalPrice: 2400, // 새우깡 3개(2400)
    status: "PENDING",
    createdAt: new Date("2025-07-01"),
    updatedAt: new Date("2025-07-01"),
  },
  {
    id: 3,
    companyId: 1,
    userId: "user-3",
    approver: "관리자",
    adminMessage: "일부 스낵 재고 부족으로 대체 상품으로 변경되었습니다.",
    requestMessage: "팀 회식용 스낵 주문합니다.",
    totalPrice: 4500, // 홈런볼 1개(2500) + 산도 1개(2000)
    status: "APPROVED",
    createdAt: new Date("2025-07-07"),
    updatedAt: new Date("2025-07-07"),
  },
];
