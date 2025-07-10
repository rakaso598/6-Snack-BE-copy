import { UserRole } from "../dtos/user.dto";
import userRepository from "../repositories/user.repository";
import { BadRequestError, NotFoundError } from "../types/error";
import { TCurrentUser } from "../types/user.types";

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

export default { deleteUser, updateRole };
