import { TUpdatePasswordDto, TUpdateRoleDto, TUserIdParamsDto } from "../dtos/user.dto";
import userService from "../services/user.service";
import { RequestHandler } from "express";

// 유저 탈퇴
const deleteUser: RequestHandler<TUserIdParamsDto> = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const currentUser = req.user!;

    const result = await userService.deleteUser(userId, currentUser);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// 유저 권한 변경
const updateRole: RequestHandler<TUserIdParamsDto, any, TUpdateRoleDto> = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { role }: TUpdateRoleDto = req.body;
    const currentUser = req.user!;

    const result = await userService.updateRole(userId, role, currentUser);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const updatePassword: RequestHandler<TUserIdParamsDto, any, TUpdatePasswordDto> = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const passwordData: TUpdatePasswordDto = req.body;
    const currentUser = req.user!;

    const result = await userService.updatePassword(userId, passwordData, currentUser);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
export default { deleteUser, updateRole, updatePassword };
