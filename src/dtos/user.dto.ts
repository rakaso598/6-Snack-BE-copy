export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  companyId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  role: Role;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  companyId: number;
  role: Role;
}

export interface UpdateUserDto {
  name?: string;
  password?: string;
  role?: Role;
  deletedAt?: Date | null;
}