import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import authService from "../services/auth.service";
import { BadRequestError, ValidationError } from "../types/error";

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: 인증 및 권한 관련 엔드포인트
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: (최고관리자) 회원가입 및 회사/예산 초기화
 *     description: 새로운 회사를 생성하고 해당 회사의 SUPER_ADMIN 사용자를 생성합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, password, confirmPassword, companyName, bizNumber]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               name:
 *                 type: string
 *                 example: 김관리
 *               password:
 *                 type: string
 *                 example: StrongP@ssw0rd!
 *               confirmPassword:
 *                 type: string
 *                 description: passwordConfirm 도 허용 (둘 중 하나)
 *                 example: StrongP@ssw0rd!
 *               companyName:
 *                 type: string
 *                 example: 오오스낵 주식회사
 *               bizNumber:
 *                 type: string
 *                 description: 사업자등록번호 (고유)
 *                 example: 123-45-67890
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     email: { type: string }
 *                     role: { type: string, enum: [SUPER_ADMIN] }
 *                 company:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                 monthlyBudget:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     year: { type: integer }
 *                     month: { type: integer }
 *                     currentMonthExpense: { type: number }
 *                     currentMonthBudget: { type: number }
 *                     monthlyBudget: { type: number }
 *       400:
 *         description: 필수 입력 누락 또는 유효성 실패
 *       409:
 *         description: 이메일 또는 사업자등록번호 중복
 */
const signUpSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, password, confirmPassword, passwordConfirm, role, companyName, bizNumber } = req.body;
    const passwordConfirmation = confirmPassword || passwordConfirm;
    if (!email || !name || !password || !passwordConfirmation || !companyName || !bizNumber) {
      throw new BadRequestError(
        "이메일, 이름, 비밀번호, 비밀번호 확인, 회사 이름, 사업자 등록 번호를 모두 입력해야 합니다.",
      );
    }
    if (password !== passwordConfirmation) {
      throw new ValidationError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
    }
    if (role && role !== Role.SUPER_ADMIN) {
      throw new ValidationError(
        "이 엔드포인트는 최고 관리자(SUPER_ADMIN) 회원가입 전용입니다. 역할은 SUPER_ADMIN이어야 합니다.",
      );
    }
    const transactionResult = await authService.signUpSuperAdmin({ email, name, password, companyName, bizNumber });
    const newUser = transactionResult.user;
    const registeredCompany = transactionResult.company;
    const monthlyBudget = transactionResult.monthlyBudget;
    console.log(
      `[회원가입 성공] 새 SUPER_ADMIN 사용자: ${newUser.email}, 회사: ${registeredCompany.name}, 예산 생성: ${monthlyBudget.year}년 ${monthlyBudget.month}월`,
    );
    res.status(201).json({
      message: "최고 관리자 회원가입이 성공적으로 등록되었습니다.",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      company: {
        id: registeredCompany.id,
        name: registeredCompany.name,
      },
      monthlyBudget: {
        id: monthlyBudget.id,
        year: monthlyBudget.year,
        month: monthlyBudget.month,
        currentMonthExpense: monthlyBudget.currentMonthExpense,
        currentMonthBudget: monthlyBudget.currentMonthBudget,
        monthlyBudget: monthlyBudget.monthlyBudget,
      },
    });
  } catch (error) {
    console.error("[회원가입 오류]", error);
    next(error);
  }
};

/**
 * @swagger
 * /auth/signup/{inviteId}:
 *   post:
 *     summary: 초대 링크를 통한 회원가입
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: inviteId
 *         required: true
 *         schema:
 *           type: string
 *         description: 초대 고유 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, confirmPassword]
 *             properties:
 *               password:
 *                 type: string
 *                 example: StrongP@ssw0rd!
 *               confirmPassword:
 *                 type: string
 *                 description: passwordConfirm 도 허용
 *                 example: StrongP@ssw0rd!
 *     responses:
 *       201:
 *         description: 회원가입 완료
 *       400:
 *         description: 필수 입력 누락 / 비밀번호 불일치
 *       404:
 *         description: 초대가 존재하지 않음
 *       410:
 *         description: 초대 만료됨
 *       409:
 *         description: 이미 사용된 초대 또는 이메일 중복
 */
const signUpViaInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inviteId } = req.params;
    const { password, confirmPassword, passwordConfirm } = req.body;
    const passwordConfirmation = confirmPassword || passwordConfirm;
    if (!password || !passwordConfirmation) {
      throw new BadRequestError("비밀번호와 비밀번호 확인을 모두 입력해야 합니다.");
    }
    if (password !== passwordConfirmation) {
      throw new ValidationError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
    }
    const newUser = await authService.signUpViaInvite(inviteId, password);
    console.log(`[초대 회원가입 성공] 새 사용자: ${newUser.email} (${newUser.role})`);
    res.status(201).json({
      message: "회원가입이 성공적으로 완료되었습니다.",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("[초대 회원가입 오류]", error);
    next(error);
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 이메일/비밀번호 로그인
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: user@example.com }
 *               password: { type: string, example: StrongP@ssw0rd! }
 *     responses:
 *       200:
 *         description: 로그인 성공 (JWT 쿠키 발급)
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *             description: accessToken(15분), refreshToken(7일) httpOnly 쿠키
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     email: { type: string }
 *                     name: { type: string }
 *                     role: { type: string }
 *                     company:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         name: { type: string }
 *       400:
 *         description: 필수 입력 누락
 *       401:
 *         description: 인증 실패 (이메일/비밀번호 불일치)
 */
const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError("이메일과 비밀번호를 모두 입력해야 합니다.");
    }
    const { user, accessToken, refreshToken } = await authService.login(email, password);
    const accessTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const isProduction = process.env.NODE_ENV === "production";
    const cookieDomain = isProduction ? ".5nack.site" : undefined;
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      domain: cookieDomain,
      secure: isProduction,
      sameSite: "lax",
      expires: accessTokenExpires,
      path: "/",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      domain: cookieDomain,
      secure: isProduction,
      sameSite: "lax",
      expires: refreshTokenExpires,
      path: "/",
    });
    console.log(`[로그인 성공] 사용자: ${user.email} (${user.role}), 회사: ${user.company.name})`);
    res.status(200).json({
      message: "로그인이 성공적으로 처리되었습니다.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: {
          id: user.company.id,
          name: user.company.name,
        },
      },
    });
  } catch (error) {
    console.error("[로그인 오류]", error);
    next(error);
  }
};

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh Token을 이용해 Access Token 재발급
 *     tags: [Auth]
 *     description: refreshToken httpOnly 쿠키가 유효하면 새 accessToken 및 refreshToken을 재발급합니다.
 *     responses:
 *       200:
 *         description: 토큰 재발급 성공 (쿠키로 전달)
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *             description: 새 accessToken / refreshToken 쿠키
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "새로운 Access Token이 발급되었습니다." }
 *       400:
 *         description: refreshToken 없음
 *       401:
 *         description: refreshToken 유효하지 않음
 */
const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new BadRequestError("리프레시 토큰이 제공되지 않았습니다. 다시 로그인해주세요.");
    }
    const { newAccessToken, newRefreshToken, user } = await authService.refreshAccessToken(refreshToken);
    const newAccessTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    const newRefreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const isProduction = process.env.NODE_ENV === "production";
    const cookieDomain = isProduction ? ".5nack.site" : undefined;
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      domain: cookieDomain,
      secure: isProduction,
      sameSite: "lax",
      expires: newAccessTokenExpires,
      path: "/",
    });
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      domain: cookieDomain,
      secure: isProduction,
      sameSite: "lax",
      expires: newRefreshTokenExpires,
      path: "/",
    });
    console.log(`[토큰 갱신 성공] 사용자: ${user.email}`);
    res.status(200).json({ message: "새로운 Access Token이 발급되었습니다." });
  } catch (error) {
    console.error("[토큰 갱신 오류]", error);
    next(error);
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 로그아웃 (쿠키 제거)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "성공적으로 로그아웃되었습니다." }
 *       401:
 *         description: 인증 실패
 */
const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new BadRequestError("인증되지 않은 사용자입니다.");
    }
    await authService.logout(req.user.id);
    const isProduction = process.env.NODE_ENV === "production";
    const cookieDomain = isProduction ? ".5nack.site" : undefined;
    res.clearCookie("accessToken", {
      httpOnly: true,
      domain: cookieDomain,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      domain: cookieDomain,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    });
    console.log(`[로그아웃 성공] 사용자: ${req.user.email}`);
    res.status(200).json({ message: "성공적으로 로그아웃되었습니다." });
  } catch (error) {
    console.error("[로그아웃 오류]", error);
    next(error);
  }
};

export default { signUpSuperAdmin, signUpViaInvite, login, refreshToken, logout };
