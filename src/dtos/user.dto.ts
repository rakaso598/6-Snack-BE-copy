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

// Path Parameters DTOs
export type TUserIdParamsDto = {
  userId: string;
};
