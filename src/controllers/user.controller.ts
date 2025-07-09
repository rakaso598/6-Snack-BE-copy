import { TDeleteUserResponse } from "../dtos/user.dto";
import userService from "../services/user.service";
import { RequestHandler } from "express";

const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const currentUser = req.user!;

    await userService.deleteUser(userId, currentUser);

    const response: TDeleteUserResponse = {
      message: "사용자가 성공적으로 삭제되었습니다.",
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export default { deleteUser };
