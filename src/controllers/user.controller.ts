import { TGetUsersQueryDto, TUpdatePasswordDto, TUpdateRoleDto, TUserIdParamsDto } from "../dtos/user.dto";
import userService from "../services/user.service";
import { RequestHandler } from "express";

// 유저 프로필 조회
const getUserInfo: RequestHandler<TUserIdParamsDto> = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const currentUser = req.user!;

    const result = await userService.getUserInfo(userId, currentUser);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

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

//  유저 조회
const getUsersByCompany: RequestHandler<{}, any, {}, TGetUsersQueryDto> = async (req, res, next) => {
  try {
    const currentUser = req.user!;
    const result = await userService.getUsersByCompany(currentUser, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// 내 정보 조회
const getMe: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error("사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.");
    }
    const user = await userService.getMe(req.user.id);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
export default { deleteUser, updateRole, updatePassword, getUsersByCompany, getUserInfo, getMe };
