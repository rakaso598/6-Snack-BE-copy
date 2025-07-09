import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

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
const deleteUser = async (id: string ) => {
  return await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

export default { findActiveUserById, deleteUser };
