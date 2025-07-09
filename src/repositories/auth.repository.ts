import { Prisma, Role } from '@prisma/client';
import prisma from "../config/prisma";

/**
 * 주어진 이메일로 사용자를 조회하고, 회사 정보를 포함합니다.
 * @param email - 조회할 사용자의 이메일
 * @returns 사용자 및 회사 정보 또는 null
 */
const findUserByEmailWithCompany = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });
};

/**
 * 주어진 ID로 사용자를 조회합니다.
 * @param id - 조회할 사용자의 ID
 * @returns 사용자 정보 또는 null
 */
const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

/**
 * 주어진 사업자 등록 번호로 회사를 조회합니다.
 * @param bizNumber - 조회할 회사의 사업자 등록 번호
 * @returns 회사 정보 또는 null
 */
const findCompanyByBizNumber = async (bizNumber: string) => {
  return prisma.company.findUnique({
    where: { bizNumber },
  });
};

/**
 * 주어진 ID로 초대 정보를 조회합니다.
 * @param inviteId - 조회할 초대 ID
 * @returns 초대 정보 또는 null
 */
const findInviteById = async (inviteId: string) => {
  return prisma.invite.findUnique({
    where: { id: inviteId },
  });
};

/**
 * 새로운 회사를 생성합니다.
 * @param data - 생성할 회사 데이터 (이름, 사업자 등록 번호)
 * @param prismaTransaction - 트랜잭션 내에서 사용할 Prisma 트랜잭션 클라이언트
 * @returns 생성된 회사 정보
 */
const createCompany = async (data: { name: string; bizNumber: string }, prismaTransaction: Prisma.TransactionClient) => {
  return prismaTransaction.company.create({
    data: {
      name: data.name,
      bizNumber: data.bizNumber,
    },
  });
};

/**
 * 새로운 사용자를 생성합니다.
 * @param data - 생성할 사용자 데이터 (이메일, 이름, 비밀번호, 역할, 회사 ID)
 * @param prismaTransaction - 트랜잭션 내에서 사용할 Prisma 트랜잭션 클라이언트
 * @returns 생성된 사용자 정보 (선택된 필드만)
 */
const createUser = async (data: { email: string; name: string; password: string; role: Role; companyId: number }, prismaTransaction: Prisma.TransactionClient) => {
  return prismaTransaction.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: data.password,
      role: data.role,
      companyId: data.companyId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyId: true,
    },
  });
};

/**
 * 사용자의 리프레시 토큰 해시를 업데이트합니다.
 * @param userId - 사용자 ID
 * @param hashedRefreshToken - 새로운 리프레시 토큰 해시 (null 가능)
 * @returns 업데이트된 사용자 정보
 */
const updateUserRefreshToken = async (userId: string, hashedRefreshToken: string | null) => {
  return prisma.user.update({
    where: { id: userId },
    data: { hashedRefreshToken },
  });
};

/**
 * 초대 상태를 사용 완료로 업데이트합니다.
 * @param inviteId - 초대 ID
 * @param prismaTransaction - 트랜잭션 내에서 사용할 Prisma 트랜잭션 클라이언트
 */
const updateInviteToUsed = async (inviteId: string, prismaTransaction: Prisma.TransactionClient) => {
  return prismaTransaction.invite.update({
    where: { id: inviteId },
    data: { isUsed: true },
  });
};

/**
 * Prisma 트랜잭션을 실행합니다.
 * @param callback - 트랜잭션 내에서 실행될 비동기 콜백 함수
 * @returns 콜백 함수의 결과
 */
const runInTransaction = async <T>(callback: (prismaTransaction: Prisma.TransactionClient) => Promise<T>): Promise<T> => {
  return prisma.$transaction(callback);
};

export default {
  findUserByEmailWithCompany,
  findUserById,
  findCompanyByBizNumber,
  findInviteById,
  createCompany,
  createUser,
  updateUserRefreshToken,
  updateInviteToUsed,
  runInTransaction,
};
