import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import userController from "../controllers/user.controller";

const userRouter = Router();

/**
 * 현재 로그인된 사용자 정보 조회 라우트
 * @route GET /users/me
 * @middleware authenticateToken - Access Token 유효성 검사
 * @returns {object} - 현재 로그인된 사용자 정보 (ID, 이메일, 이름, 역할, 회사 정보 포함)
 * @throws {AppError} - 사용자 정보를 찾을 수 없거나 인증되지 않은 경우
 */
userRouter.get("/me", authenticateToken, userController.getMe);

// 유저 정보 확인
userRouter.get("/:userId/", authenticateToken, userController.getUserInfo);

// 유저 비밀번호 변경
userRouter.patch(
  "/:userId/password",
  authenticateToken,
  userController.updatePassword,
);
export default userRouter;
