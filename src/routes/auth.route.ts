import { Router, Request, Response, NextFunction } from 'express';
import { Role, Prisma } from '@prisma/client';
import authenticateToken from '../middlewares/jwtAuth.middleware';
import { AuthService } from '../services/auth.service';
import { AppError } from '../types/error';

const authRouter = Router();

/**
 * 최고 관리자(SUPER_ADMIN) 회원가입 라우트
 * 이 라우트는 새로운 회사를 생성하고 해당 회사의 최고 관리자로 유저를 등록합니다.
 * @route POST /auth/signup
 * @body {string} email - 사용자 이메일
 * @body {string} name - 사용자 이름
 * @body {string} password - 사용자 비밀번호
 * @body {string} confirmPassword - 비밀번호 확인 (password와 일치해야 함)
 * @body {string} companyName - 회사 이름 (필수)
 * @body {string} bizNumber - 사업자 등록 번호 (필수, 고유해야 함)
 * @returns {object} - 성공 메시지 및 생성된 사용자/회사 정보 (비밀번호 제외)
 * @throws {AppError} - 입력 유효성 검사 실패, 이메일/사업자 등록 번호 중복 시
 */
authRouter.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, password, confirmPassword, role, companyName, bizNumber } = req.body;

    if (!email || !name || !password || !confirmPassword || !companyName || !bizNumber) {
      throw new AppError('이메일, 이름, 비밀번호, 비밀번호 확인, 회사 이름, 사업자 등록 번호를 모두 입력해야 합니다.', 400);
    }
    if (password !== confirmPassword) {
      throw new AppError('비밀번호와 비밀번호 확인이 일치하지 않습니다.', 400);
    }
    if (role && role !== Role.SUPER_ADMIN) {
      throw new AppError('이 엔드포인트는 최고 관리자(SUPER_ADMIN) 회원가입 전용입니다. 역할은 SUPER_ADMIN이어야 합니다.', 400);
    }

    const transactionResult = await AuthService.signUpSuperAdmin({ email, name, password, companyName, bizNumber });

    const newUser = transactionResult.user;
    const registeredCompany = transactionResult.company;

    console.log(`[회원가입 성공] 새 SUPER_ADMIN 사용자: ${newUser.email}, 회사: ${registeredCompany.name}`);

    res.status(201).json({
      message: '최고 관리자 회원가입이 성공적으로 등록되었습니다.',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      company: {
        id: registeredCompany.id,
        name: registeredCompany.name,
      },
    });

  } catch (error) {
    console.error('[회원가입 오류]', error);
    next(error);
  }
});

/**
 * 초대 링크를 통한 사용자 회원가입 라우트
 * 이 라우트는 사전 생성된 초대(Invite)를 통해 사용자가 비밀번호를 설정하고 회원가입을 완료합니다.
 *
 * @route POST /auth/signup/:inviteId
 * @param {string} inviteId - 초대 링크의 고유 ID
 * @body {string} password - 사용자 비밀번호
 * @body {string} confirmPassword - 비밀번호 확인 (password와 일치해야 함)
 * @returns {object} - 성공 메시지 및 생성된 사용자 정보 (비밀번호 제외)
 * @throws {AppError} - 입력 유효성 검사 실패, 유효하지 않거나 만료된 초대, 이미 사용된 초대, 이메일 중복 시
 */
authRouter.post('/signup/:inviteId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inviteId } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      throw new AppError('비밀번호와 비밀번호 확인을 모두 입력해야 합니다.', 400);
    }
    if (password !== confirmPassword) {
      throw new AppError('비밀번호와 비밀번호 확인이 일치하지 않습니다.', 400);
    }

    const newUser = await AuthService.signUpViaInvite(inviteId, password);

    console.log(`[초대 회원가입 성공] 새 사용자: ${newUser.email} (${newUser.role})`);

    res.status(201).json({
      message: '회원가입이 성공적으로 완료되었습니다.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });

  } catch (error) {
    console.error('[초대 회원가입 오류]', error);
    next(error);
  }
});

/**
 * 사용자 로그인 라우트
 * @route POST /auth/login
 * @body {string} email - 사용자 이메일
 * @body {string} password - 사용자 비밀번호
 * @returns {object} - 성공 메시지, 사용자 정보 (ID, 이메일, 이름, 역할, 회사 정보) 및 토큰 (쿠키로 전송)
 * @throws {AppError} - 이메일 또는 비밀번호 불일치 시
 */
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('이메일과 비밀번호를 모두 입력해야 합니다.', 400);
    }

    const { user, accessToken, refreshToken } = await AuthService.login(email, password);

    const accessTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: accessTokenExpires,
      path: '/',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: refreshTokenExpires,
      path: '/',
    });

    console.log(`[로그인 성공] 사용자: ${user.email} (${user.role}), 회사: ${user.company.name})`);
    res.status(200).json({
      message: '로그인이 성공적으로 처리 되었습니다.',
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
    console.error('[로그인 오류]', error);
    next(error);
  }
});


/**
 * Access Token 갱신 라우트
 * @route POST /auth/refresh-token
 * @body {string} refreshToken (쿠키로 전송됨) - 갱신할 Refresh Token
 * @returns {object} - 새로운 Access Token (쿠키로 전송)
 * @throws {AppError} - Refresh Token이 없거나 유효하지 않거나 만료된 경우
 */
authRouter.post('/refresh-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new AppError('리프레시 토큰이 제공되지 않았습니다. 다시 로그인해주세요.', 401);
    }

    const { newAccessToken, newRefreshToken, user } = await AuthService.refreshAccessToken(refreshToken);

    const newAccessTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    const newRefreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: newAccessTokenExpires,
      path: '/',
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: newRefreshTokenExpires,
      path: '/',
    });

    console.log(`[토큰 갱신 성공] 사용자: ${user.email}`);
    res.status(200).json({ message: '새로운 Access Token이 발급되었습니다.' });
  } catch (error) {
    console.error('[토큰 갱신 오류]', error);
    next(error);
  }
});

/**
 * 사용자 로그아웃 라우트
 * @route POST /auth/logout
 * @returns {object} - 성공 메시지
 * @throws {AppError} - 인증되지 않은 사용자이거나 로그아웃 처리 중 오류 발생 시
 */
authRouter.post('/logout', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('인증되지 않은 사용자입니다.', 401);
    }

    await AuthService.logout(req.user.id);

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    console.log(`[로그아웃 성공] 사용자: ${req.user.email}`);
    res.status(200).json({ message: '성공적으로 로그아웃되었습니다.' });
  } catch (error) {
    console.error('[로그아웃 오류]', error);
    next(error);
  }
});

export default authRouter;