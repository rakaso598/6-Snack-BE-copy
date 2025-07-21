import prisma from "../config/prisma";
import { UserRole } from "../dtos/user.dto";

// 현재 존재하는 회원인지 확인
const findActiveUserById = async (id: string) => {
  return await prisma.user.findFirst({
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

// 유저리스트 조회
const findUsersByCompanyId = async (companyId: number, name?: string, cursor?: string, limit: number = 5) => {
  const whereClause = {
    companyId: companyId,
    role: {
      not: "SUPER_ADMIN" as const, // 최고 관리자는 유저 목록에서 제외함
    },
    deletedAt: null,
    ...(name && {
      name: {
        contains: name,
        mode: "insensitive" as const, // 대소문자 구분 x
      },
    }),
    ...(cursor && {
      id: {
        lt: cursor, // cursor보다 작은 ID (이전 페이지)
      },
    }),
  };

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    take: limit + 1,
  });

  // 다음 페이지 존재 여부 확인
  const hasNext = users.length > limit;
  const actualUsers = hasNext ? users.slice(0, limit) : users;

  return {
    users: actualUsers,
    hasNext,
    nextCursor: hasNext ? actualUsers[actualUsers.length - 1].id : undefined,
  };
};

// 이전 페이지 확인용 (현재 커서보다 큰 ID가 있는지)
const hasPreviousPage = async (companyId: number, cursor: string, name?: string) => {
  const count = await prisma.user.count({
    where: {
      companyId: companyId,
      role: {
        not: "SUPER_ADMIN" as const,
      },
      deletedAt: null,
      ...(name && {
        name: {
          contains: name,
          mode: "insensitive" as const,
        },
      }),
      id: {
        gt: cursor, // cursor보다 큰 ID
      },
    },
  });

  return count > 0;
};

// userId로 회사 포함 유저 조회
const findUserWithCompanyById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
    include: { company: true },
  });
};

// userId로 삭제되지 않은 cartItem 개수 조회
const getCartItemCountByUserId = async (userId: string) => {
  return await prisma.cartItem.count({
    where: {
      userId,
      deletedAt: null,
    },
  });
};

export default {
  findActiveUserById,
  deleteUser,
  updateUserRole,
  updatePassword,
  findUsersByCompanyId,
  hasPreviousPage,
  findUserWithCompanyById, // 추가
  getCartItemCountByUserId, // 추가
};
