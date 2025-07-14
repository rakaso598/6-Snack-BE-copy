import {
  TUpdatePasswordDto,
  UserRole,
  TDeleteUserResponseDto,
  TUpdateRoleResponseDto,
  TUpdatePasswordResponseDto,
  TGetUsersQueryDto,
  TGetUsersResponseDto,
  TGetUserInfoResponseDto,
} from "../dtos/user.dto";
import userRepository from "../repositories/user.repository";
import { BadRequestError, NotFoundError } from "../types/error";
import { TCurrentUser } from "../types/user.types";
import bcrypt from "bcrypt";

const getUserInfo = async (userId: string, currentUser: TCurrentUser): Promise<TGetUserInfoResponseDto> => {
  if (userId !== currentUser.id) {
    throw new BadRequestError("자기 자신의 정보만 조회할 수 있습니다.");
  }

  if (currentUser.role === "USER") {
    return {
      message: "일반 유저 정보 조회 완료",
      user: {
        company: { name: currentUser.company!.name },
        name: currentUser.name,
        email: currentUser.email,
      },
    };
  } else {
    return {
      message: "관리자/최고 관리자 정보 조회 완료",
      user: {
        company: { name: currentUser.company!.name },
        role: currentUser.role as "ADMIN" | "SUPER_ADMIN",
        name: currentUser.name,
        email: currentUser.email,
      },
    };
  }
};

// 유저 탈퇴
const deleteUser = async (userId: string, currentUser: TCurrentUser): Promise<TDeleteUserResponseDto> => {
  // 삭제 하려는 유저 조회
  const userToDelete = await userRepository.findActiveUserById(userId);
  if (!userToDelete) {
    throw new NotFoundError("유저가 존재하지 않습니다");
  }

  // 최고 관리자가 자기 자신을 삭제할수 없음
  if (userToDelete.id === currentUser.id) {
    throw new BadRequestError("최고 관리자는 자기 자신을 삭제할 수 없습니다.");
  }

  // 단순히 User만 soft delete
  // 코드잇에 따르면 유저가 삭제되어도 삭제 이전에 남겨둔 구매 요청, 등록한 상품 등은 다 남아있어야함.
  await userRepository.deleteUser(userId);

  return {
    message: "사용자가 성공적으로 삭제되었습니다.",
  };
};

// 유저 권한 변경
const updateRole = async (
  userId: string,
  role: UserRole,
  currentUser: TCurrentUser,
): Promise<TUpdateRoleResponseDto> => {
  const userToUpdateRole = await userRepository.findActiveUserById(userId);
  if (!userToUpdateRole) {
    throw new NotFoundError("유저가 존재하지 않습니다");
  }
  if (role !== "ADMIN" && role !== "USER") {
    throw new BadRequestError("잘못된 Role 값입니다.");
  }
  if (userToUpdateRole.id === currentUser.id) {
    throw new BadRequestError("최고 관리자는 자기 자신의 권한을 변경할 수 없습니다.");
  }

  const updatedUser = await userRepository.updateUserRole(userId, role);

  return {
    message: "사용자 권한이 성공적으로 변경되었습니다.",
    role: updatedUser.role as "ADMIN" | "USER",
  };
};

// 유저 비밀번호 변경
const updatePassword = async (
  userId: string,
  passwordData: TUpdatePasswordDto,
  currentUser: TCurrentUser,
): Promise<TUpdatePasswordResponseDto> => {
  // 자기 자신만 변경 가능한지 확인
  if (userId !== currentUser.id) {
    throw new BadRequestError("자기 자신의 비밀번호만 변경할 수 있습니다.");
  }

  // 비밀번호와 확인 비밀번호 일치 체크
  if (passwordData.newPassword !== passwordData.newPasswordConfirm) {
    throw new BadRequestError("비밀번호가 일치하지 않습니다.");
  }

  // 비밀번호 유효성 검증 (최소 8자)
  if (passwordData.newPassword.length < 8) {
    throw new BadRequestError("비밀번호는 최소 8자 이상이어야 합니다.");
  }

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(passwordData.newPassword, 10);

  await userRepository.updatePassword(userId, hashedPassword);

  return {
    message: "비밀번호가 성공적으로 변경되었습니다.",
  };
};

// 회사 유저 목록 조회
const getUsersByCompany = async (
  currentUser: TCurrentUser,
  query: TGetUsersQueryDto,
): Promise<TGetUsersResponseDto> => {
  const limit = query.limit || 5;

  const result = await userRepository.findUsersByCompanyId(currentUser.companyId, query.name, query.cursor, limit);

  let hasPrev = false;
  if (query.cursor) {
    hasPrev = await userRepository.hasPreviousPage(currentUser.companyId, query.cursor, query.name);
  }

  const prevCursor = result.users.length > 0 ? result.users[0].id : undefined;

  return {
    message: query.name ? `"${query.name}" 검색 결과입니다.` : "회사 유저 목록 조회가 완료되었습니다.",
    users: result.users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "USER",
    })),
    pagination: {
      hasNext: result.hasNext,
      hasPrev: hasPrev,
      nextCursor: result.nextCursor,
      prevCursor: hasPrev ? prevCursor : undefined,
    },
  };
};

export default { deleteUser, updateRole, updatePassword, getUsersByCompany, getUserInfo };
