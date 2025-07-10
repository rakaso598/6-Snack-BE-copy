export type UserRole = "ADMIN" | "USER";

export type TDeleteUserResponseDto = {
  message: string;
};

export type TUpdateRoleDto = {
  role: UserRole;
};

export type TUpdateRoleResponseDto = {
  message: string;
  role: UserRole;
};

export type TUpdatePasswordDto = {
  newPassword: string;
  newPasswordConfirm: string;
};

export type TUpdatePasswordResponseDto = {
  message: string;
};

export type TUserIdParamsDto = {
  userId: string;
};

export type TGetUsersQueryDto = {
  name?: string; // 쿼리 파라미터
  cursor?: string; // 페이지네이션 커서 (마지막 유저 ID)
  limit?: number; // 한 번에 가져올 개수 (기본값: 5)
};

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
