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
