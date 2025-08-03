export const orderMockData = [
  // 토쓰(주) (companyId: 1) 주문들
  {
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
  {
    companyId: 1,
    userId: "user-4",
    approver: "관리자",
    adminMessage: "스낵 주문이 승인되었습니다.",
    requestMessage: "팀 미팅용 스낵입니다.",
    totalPrice: 3200, // 포카칩 2개(3200)
    status: "APPROVED",
    createdAt: new Date("2025-07-10"),
    updatedAt: new Date("2025-07-10"),
  },
  {
    companyId: 1,
    userId: "user-5",
    adminMessage: null,
    requestMessage: "개발팀 야근용 스낵 부탁드립니다.",
    totalPrice: 1800, // 고래밥 2개(1800)
    status: "PENDING",
    createdAt: new Date("2025-07-12"),
    updatedAt: new Date("2025-07-12"),
  },
  {
    companyId: 1,
    userId: "user-6",
    approver: "관리자",
    adminMessage: "스낵 주문이 승인되었습니다.",
    requestMessage: "디자인팀 회의용 스낵입니다.",
    totalPrice: 2800, // 마가렛트 2개(2800)
    status: "APPROVED",
    createdAt: new Date("2025-07-15"),
    updatedAt: new Date("2025-07-15"),
  },
  // 쿠빵(주) (companyId: 2) 주문
  {
    companyId: 2,
    userId: "user-1-2",
    approver: "최고관리자 2",
    adminMessage: "쿠빵(주) 첫 주문이 승인되었습니다.",
    requestMessage: "회사 오픈 기념 스낵입니다.",
    totalPrice: 5500, // 초코파이 3개(4500) + 칸쵸 1개(1000)
    status: "APPROVED",
    createdAt: new Date("2025-07-20"),
    updatedAt: new Date("2025-07-20"),
  },
];
