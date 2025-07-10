import {
  TDeleteUserResponseDto,
  TUpdatePasswordDto,
  TUpdatePasswordResponseDto,
  TUpdateRoleDto,
  TUpdateRoleResponseDto,
} from "../dtos/user.dto";
import userService from "../services/user.service";
import { RequestHandler } from "express";

// 유저 탈퇴
const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const currentUser = req.user!;

    await userService.deleteUser(userId, currentUser);

    const response: TDeleteUserResponseDto = {
      message: "사용자가 성공적으로 삭제되었습니다.",
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// 유저 권한 변경
const updateRole: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { role }: TUpdateRoleDto = req.body;
    const currentUser = req.user!;

    const updatedUser = await userService.updateRole(userId, role, currentUser);

    const response: TUpdateRoleResponseDto = {
      message: "사용자 권한이 성공적으로 변경되었습니다.",
      role: updatedUser.role as "ADMIN" | "USER",
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const updatePassword: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const passwordData: TUpdatePasswordDto = req.body;
    const currentUser = req.user!;

    const updatedUser = await userService.updatePassword(userId, passwordData, currentUser);

    const response: TUpdatePasswordResponseDto = {
      message: "비밀번호가 성공적으로 변경되었습니다.",
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
export default { deleteUser, updateRole, updatePassword };
