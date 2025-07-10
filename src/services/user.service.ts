import { TUpdatePasswordDto, UserRole } from "../dtos/user.dto";
import userRepository from "../repositories/user.repository";
import { BadRequestError, NotFoundError } from "../types/error";
import { TCurrentUser } from "../types/user.types";
import bcrypt from "bcrypt";

// 유저 탈퇴
const deleteUser = async (userId: string, currentUser: TCurrentUser) => {
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
  return await userRepository.deleteUser(userId);
};

// 유저 권한 변경
const updateRole = async (userId: string, role: UserRole, currentUser: TCurrentUser) => {
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

  return await userRepository.updateUserRole(userId, role);
};

// 유저 비밀번호 변경
const updatePassword = async (userId: string, passwordData: TUpdatePasswordDto, currentUser: TCurrentUser) => {
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

  return await userRepository.updatePassword(userId, hashedPassword);
};

export default { deleteUser, updateRole, updatePassword };
