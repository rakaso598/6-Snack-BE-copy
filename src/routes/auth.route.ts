import { Router } from "express";
import authenticateToken from "../middlewares/jwtAuth.middleware";
import authController from "../controllers/auth.controller";
import { invalidateCache } from "../middlewares/cacheMiddleware";

const authRouter = Router();

/**
 * 최고 관리자(SUPER_ADMIN) 회원가입 라우트
 * 이 라우트는 새로운 회사를 생성하고 해당 회사의 최고 관리자로 유저를 등록합니다.
 * @route POST /auth/signup
 * @body {string} email - 사용자 이메일
 * @body {string} name - 사용자 이름
 * @body {string} password - 사용자 비밀번호
 * @body {string} confirmPassword - 비밀번호 확인 (password와 일치해야 함, passwordConfirm도 지원)
 * @body {string} passwordConfirm - 비밀번호 확인 (password와 일치해야 함, confirmPassword와 동일)
 * @body {string} companyName - 회사 이름 (필수)
 * @body {string} bizNumber - 사업자 등록 번호 (필수, 고유해야 함)
 * @returns {object} - 성공 메시지 및 생성된 사용자/회사/월별예산 정보 (비밀번호 제외)
 * @throws {AppError} - 입력 유효성 검사 실패, 이메일/사업자 등록 번호 중복 시
 */
authRouter.post("/signup", authController.signUpSuperAdmin);

/**
 * 초대 링크를 통한 사용자 회원가입 라우트
 * 이 라우트는 사전 생성된 초대(Invite)를 통해 사용자가 비밀번호를 설정하고 회원가입을 완료합니다.
 *
 * @route POST /auth/signup/:inviteId
 * @param {string} inviteId - 초대 링크의 고유 ID
 * @body {string} password - 사용자 비밀번호
 * @body {string} confirmPassword - 비밀번호 확인 (password와 일치해야 함, passwordConfirm도 지원)
 * @body {string} passwordConfirm - 비밀번호 확인 (password와 일치해야 함, confirmPassword와 동일)
 * @returns {object} - 성공 메시지 및 생성된 사용자 정보 (비밀번호 제외)
 * @throws {AppError} - 입력 유효성 검사 실패, 유효하지 않거나 만료된 초대, 이미 사용된 초대, 이메일 중복 시
 */
authRouter.post("/signup/:inviteId", authController.signUpViaInvite);

/**
 * 사용자 로그인 라우트
 * @route POST /auth/login
 * @body {string} email - 사용자 이메일
 * @body {string} password - 사용자 비밀번호
 * @returns {object} - 성공 메시지, 사용자 정보 (ID, 이메일, 이름, 역할, 회사 정보) 및 토큰 (쿠키로 전송)
 * @throws {AppError} - 이메일 또는 비밀번호 불일치 시
 */
authRouter.post("/login", authController.login);

/**
 * Access Token 갱신 라우트
 * @route POST /auth/refresh-token
 * @body {string} refreshToken (쿠키로 전송됨) - 갱신할 Refresh Token
 * @returns {object} - 새로운 Access Token (쿠키로 전송)
 * @throws {AppError} - Refresh Token이 없거나 유효하지 않거나 만료된 경우
 */
authRouter.post("/refresh-token", authController.refreshToken);

/**
 * 사용자 로그아웃 라우트
 * @route POST /auth/logout
 * @returns {object} - 성공 메시지
 * @throws {AppError} - 인증되지 않은 사용자이거나 로그아웃 처리 중 오류 발생 시
 */
authRouter.post("/logout", authenticateToken, invalidateCache("/me"), authController.logout);

export default authRouter;
