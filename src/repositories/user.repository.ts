import prisma from "../config/prisma";
import { UserRole } from "../dtos/user.dto";

const findActiveUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id, deletedAt: null },
    // 비밀번호, refreshToken 정보 제외
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// 유저 삭제 (soft delete)
const deleteUser = async (id: string) => {
  return await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

// 유저 권한 업데이트
const updateUserRole = async (id: string, role: UserRole) => {
  return await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// 유저 비밀번호 업데이트
const updatePassword = async (id: string, hashedPassword: string) => {
  return await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export default { findActiveUserById, deleteUser, updateUserRole, updatePassword };
