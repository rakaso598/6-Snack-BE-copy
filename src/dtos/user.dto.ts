export type UserRole = "ADMIN" | "USER";

// 유저탈퇴
export type TDeleteUserResponseDto = {
  message: string;
};

// 유저 권한 변경  - request
export type TUpdateRoleDto = {
  role: UserRole;
};

// 유저 권한 변경 - response
export type TUpdateRoleResponseDto = {
  message: string;
  role: UserRole;
};

// 유저 비밀번호 변경 관련 - request
export type TUpdatePasswordDto = {
  newPassword: string;
  newPasswordConfirm: string;
};

// 유저 비밀번호 변경 관련 - response
export type TUpdatePasswordResponseDto = {
  message: string;
};

// 유저 userId 파라미터로 올때 dto
export type TUserIdParamsDto = {
  userId: string;
};

// 유저 프로필 조회 - response dto
export type TGetUserInfoResponseDto = {
  message: string;
  user: {
    company: {
      name: string;
    };
    name: string;
    email: string;
    role?: "ADMIN" | "SUPER_ADMIN";
  };
};

// 유저 목록 조회 - query dto
export type TGetUsersQueryDto = {
  name?: string; // 쿼리 파라미터
  cursor?: string; // 페이지네이션 커서 (마지막 유저 ID)
  limit?: number; // 한 번에 가져올 개수 (기본값: 5)
};

// 유저 목록 조회 - response dto
export type TGetUsersResponseDto = {
  message: string;
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "USER";
  }>;
  pagination: {
    hasNext: boolean; // 다음 페이지 존재 여부
    hasPrev: boolean; // 이전 페이지 존재 여부
    nextCursor?: string; // 다음 페이지 커서
    prevCursor?: string; // 이전 페이지 커서
  };
};
