export const inviteMockData = [
  {
    id: "invite-1",
    email: "newuser1@codeit.com",
    name: "김신입",
    invitedById: "user-1", // 최고관리자가 초대
    expiresAt: new Date("2025-02-15"), // 7일 후 만료
    isUsed: false,
    role: "USER",
  },
  {
    id: "invite-2",
    email: "newuser2@codeit.com",
    name: "박사원",
    invitedById: "user-2", // 관리자가 초대
    expiresAt: new Date("2025-02-10"), // 5일 후 만료
    isUsed: false,
    role: "USER",
  },
  {
    id: "invite-3",
    email: "newadmin@codeit.com",
    name: "이관리자",
    invitedById: "user-1", // 최고관리자가 관리자로 초대
    expiresAt: new Date("2025-02-20"), // 10일 후 만료
    isUsed: false,
    role: "ADMIN",
  },

  // validation 테스트용
  // 1. 이미 가입된 유저
  {
    id: "invite-4",
    email: "user4@codeit.com",
    name: "유저4",
    invitedById: "user-1",
    expiresAt: new Date("2025-07-14"), // 만료는 아직 안됨
    isUsed: true, // 이미 사용됨
    role: "USER",
  },

  // 2. 만료된 초대
  {
    id: "invite-5",
    email: "expireduser@codeit.com",
    name: "만료된초대",
    invitedById: "user-2",
    expiresAt: new Date("2025-01-30"), // 이미 만료됨
    isUsed: false,
    role: "USER",
  },
];
