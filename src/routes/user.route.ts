import { Router, Request, Response, NextFunction } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import { AppError } from "../types/error";
import authorizeRoles from "../middlewares/authorizeRoles.middleware";
import userController from "../controllers/user.controller";

const JWT_SECRET: string =
  process.env.JWT_SECRET || "your_very_strong_and_secret_jwt_key_please_change_this_in_production";
const REFRESH_TOKEN_SECRET: string =
  process.env.REFRESH_TOKEN_SECRET || "your_very_strong_and_secret_refresh_jwt_key_please_change_this_in_production";

if (JWT_SECRET === "your_very_strong_and_secret_jwt_key_please_change_this_in_production") {
  console.warn(
    "[경고]: JWT_SECRET 환경 변수가 설정되지 않았거나 기본값이 사용되고 있습니다. 프로덕션 환경에서는 반드시 변경하세요!",
  );
}
if (REFRESH_TOKEN_SECRET === "your_very_strong_and_secret_refresh_jwt_key_please_change_this_in_production") {
  console.warn(
    "[경고]: REFRESH_TOKEN_SECRET 환경 변수가 설정되지 않았거나 기본값이 사용되고 있습니다. 프로덕션 환경에서는 반드시 변경하세요!",
  );
}

const userRouter = Router();

/**
 * 현재 로그인된 사용자 정보 조회 라우트
 * @route GET /users/me
 * @middleware authenticateToken - Access Token 유효성 검사
 * @returns {object} - 현재 로그인된 사용자 정보 (ID, 이메일, 이름, 역할, 회사 정보 포함)
 * @throws {AppError} - 사용자 정보를 찾을 수 없거나 인증되지 않은 경우
 */
userRouter.get("/me", authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError("사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.", 401));
  }

  res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      company: {
        id: req.user.company.id,
        name: req.user.company.name,
      },
    },
  });
});

// 유저 비밀번호 변경
userRouter.patch(
  "/:userId/password",
  authenticateToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN", "USER"),
  userController.updatePassword,
);
export default userRouter;
