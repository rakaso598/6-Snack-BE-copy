import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role, Company, PrismaClient, Prisma } from '@prisma/client';
import authenticateToken from '../middlewares/jwtAuth.middleware'; // 수정된 미들웨어 임포트
import prisma from '../lib/prisma';
import HttpError from '../utils/HttpError'; // HttpError 유틸리티 임포트

// JWT 비밀 키는 환경 변수에서 가져옵니다.
// accessToken 서명에 사용됩니다.
const JWT_SECRET: string = process.env.JWT_SECRET || 'your_very_strong_and_secret_jwt_key_please_change_this_in_production';
// REFRESH_TOKEN_SECRET은 refreshToken 서명에 사용됩니다.
// accessToken과 다른 별도의 강력한 비밀 키를 사용하는 것이 보안상 권장됩니다.
const REFRESH_TOKEN_SECRET: string = process.env.REFRESH_TOKEN_SECRET || 'your_very_strong_and_secret_refresh_jwt_key_please_change_this_in_production';

// 개발 환경 경고 메시지
if (JWT_SECRET === 'your_very_strong_and_secret_jwt_key_please_change_this_in_production') {
  console.warn('[경고]: JWT_SECRET 환경 변수가 설정되지 않았거나 기본값이 사용되고 있습니다. 프로덕션 환경에서는 반드시 변경하세요!');
}
if (REFRESH_TOKEN_SECRET === 'your_very_strong_and_secret_refresh_jwt_key_please_change_this_in_production') {
  console.warn('[경고]: REFRESH_TOKEN_SECRET 환경 변수가 설정되지 않았거나 기본값이 사용되고 있습니다. 프로덕션 환경에서는 반드시 변경하세요!');
}

const authRouter = Router();

// HttpError 클래스: 표준 Error 객체를 확장하여 HTTP 상태 코드를 포함합니다.
// 이는 에러 발생 시 클라이언트에게 적절한 HTTP 상태 코드를 반환하기 위해 사용됩니다.
// class HttpError extends Error {
//   public status: number;
//   constructor(message: string, status: number) {
//     super(message);
//     this.name = 'HttpError';
//     this.status = status;
//     Object.setPrototypeOf(this, HttpError.prototype);
//   }
// }

/**
 * 사용자 회원가입 라우트
 * @route POST /auth/signup
 * @body {string} email - 사용자 이메일
 * @body {string} name - 사용자 이름
 * @body {string} password - 사용자 비밀번호
 * @body {Role} role - 사용자 역할 (예: 'ADMIN', 'USER')
 * @body {number} companyId - 소속 회사 ID
 * @returns {object} - 성공 메시지 및 생성된 사용자 정보 (비밀번호 제외)
 * @throws {HttpError} - 입력 유효성 검사 실패, 이메일 중복, 회사 ID 유효성 검사 실패 시
 */
authRouter.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, password, role, companyId } = req.body;

    // 역할 유효성 검사: Prisma의 Role enum에 포함된 값인지 확인
    const isValidRole = Object.values(Role).includes(role as Role);

    // 필수 필드 및 역할 유효성 검사
    if (!email || !name || !password || companyId === undefined || !isValidRole) {
      throw new HttpError('이메일, 이름, 비밀번호, 회사 ID, 유효한 역할을 모두 입력해야 합니다.', 400);
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new HttpError('이미 존재하는 이메일입니다.', 409); // Conflict
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 회사 ID 유효성 검사 및 존재 여부 확인
    const parsedCompanyId = parseInt(companyId, 10);
    if (isNaN(parsedCompanyId)) {
      throw new HttpError('유효하지 않은 회사 ID 형식입니다.', 400);
    }
    const existingCompany = await prisma.company.findUnique({
      where: { id: parsedCompanyId },
    });

    if (!existingCompany) {
      throw new HttpError('유효하지 않은 회사 ID입니다.', 400);
    }

    // 새 사용자 생성
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role as Role,
        companyId: parsedCompanyId,
      },
      select: { // 비밀번호를 제외한 사용자 정보만 반환
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
      },
    });

    console.log(`[회원가입 성공] 새 사용자: ${newUser.email} (${newUser.role})`);
    res.status(201).json({ message: '사용자가 성공적으로 등록되었습니다.', user: newUser });
  } catch (error) {
    console.error('[회원가입 오류]', error);
    next(error); // 에러 핸들링 미들웨어로 전달
  }
});

/**
 * 사용자 로그인 라우트
 * @route POST /auth/login
 * @body {string} email - 사용자 이메일
 * @body {string} password - 사용자 비밀번호
 * @returns {object} - 성공 메시지, 사용자 정보 (ID, 이메일, 이름, 역할, 회사 정보) 및 토큰 (쿠키로 전송)
 * @throws {HttpError} - 이메일 또는 비밀번호 불일치 시
 */
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Prisma에서 제공하는 유틸리티 타입을 사용하여 쿼리 결과의 타입을 명시합니다. (핵심 변경!)
    type UserWithCompany = Prisma.UserGetPayload<{
      include: { company: true };
    }>;

    // 사용자 존재 여부 확인 및 관련 company 정보 함께 가져오기
    // 조회된 user 객체가 UserWithCompany 타입임을 명시합니다.
    const user: UserWithCompany | null = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true, // User 모델에 company 필드(관계)가 정의되어 있다고 가정합니다.
      },
    });

    if (!user) {
      throw new HttpError('잘못된 이메일 또는 비밀번호입니다.', 400);
    }

    // 비밀번호 일치 여부 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpError('잘못된 이메일 또는 비밀번호입니다.', 400);
    }

    // 1. Access Token 생성 (단기 토큰)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // 2. Refresh Token 생성 (장기 토큰)
    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // 3. Refresh Token 해싱 및 데이터베이스 저장 (보안 강화)
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken },
    });

    // 4. 토큰을 HTTP-only 쿠키로 설정하여 전송
    const accessTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15분 후 만료
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일 후 만료

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

    // 5. 클라이언트에게 사용자 정보 및 company 정보와 함께 성공 메시지 반환
    console.log(`[로그인 성공] 사용자: ${user.email} (${user.role}), 회사: ${user.company.name})`);
    res.status(200).json({
      message: '로그인 성공',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        // user.company는 스키마와 쿼리에 의해 항상 존재하므로, 직접 접근해도 안전합니다.
        company: {
          id: user.company.id,
          name: user.company.name,
          // 필요하다면 company 스키마에 정의된 다른 필드를 추가합니다.
          // 예: bizNumber: user.company.bizNumber,
        },
      },
    });

  } catch (error) {
    console.error('[로그인 오류]', error);
    next(error); // 에러 핸들링 미들웨어로 전달
  }
});


/**
 * Access Token 갱신 라우트
 * @route POST /auth/refresh-token
 * @body {string} refreshToken (쿠키로 전송됨) - 갱신할 Refresh Token
 * @returns {object} - 새로운 Access Token (쿠키로 전송)
 * @throws {HttpError} - Refresh Token이 없거나 유효하지 않거나 만료된 경우
 */
authRouter.post('/refresh-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 요청 쿠키에서 refreshToken을 가져옵니다.
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new HttpError('리프레시 토큰이 제공되지 않았습니다. 다시 로그인해주세요.', 401);
    }

    let decoded: { id: number; iat: number; exp: number };
    try {
      // REFRESH_TOKEN_SECRET을 사용하여 refreshToken의 유효성을 검증합니다.
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { id: number; iat: number; exp: number };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new HttpError('리프레시 토큰이 만료되었습니다. 다시 로그인해주세요.', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new HttpError('유효하지 않은 리프레시 토큰입니다. 다시 로그인해주세요.', 403);
      } else {
        console.error('[리프레시 토큰 검증 오류]', error);
        throw new HttpError('리프레시 토큰 검증 중 알 수 없는 오류가 발생했습니다.', 500);
      }
    }

    // 데이터베이스에서 사용자 정보와 저장된 해시된 리프레시 토큰을 가져옵니다.
    const user = await prisma.user.findUnique({
      where: { id: String(decoded.id) },
    });

    if (!user || !user.hashedRefreshToken) {
      // 사용자가 없거나 저장된 리프레시 토큰이 없는 경우
      throw new HttpError('사용자 또는 유효한 리프레시 토큰을 찾을 수 없습니다. 다시 로그인해주세요.', 401);
    }

    // 저장된 해시된 리프레시 토큰과 현재 요청의 리프레시 토큰이 일치하는지 확인합니다.
    // 이는 토큰 재사용 공격(Replay Attack)을 방지하는 데 도움이 됩니다.
    const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!isRefreshTokenValid) {
      // 토큰이 일치하지 않는 경우, 보안상의 이유로 해당 사용자의 모든 리프레시 토큰을 무효화할 수 있습니다.
      // (여기서는 간단히 에러를 발생시키지만, 실제 프로덕션에서는 더 강력한 처리 필요)
      await prisma.user.update({
        where: { id: user.id },
        data: { hashedRefreshToken: null }, // 해당 사용자의 모든 리프레시 토큰 무효화
      });
      throw new HttpError('유효하지 않거나 이미 사용된 리프레시 토큰입니다. 다시 로그인해주세요.', 403);
    }

    // 새로운 Access Token 생성
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' } // 새로운 Access Token 만료 시간
    );

    // 새로운 Refresh Token 생성 (Refresh Token Rotation)
    // - 매번 새로운 Refresh Token을 발급하여 이전 Refresh Token을 무효화합니다.
    // - 이는 Refresh Token이 탈취되었을 때의 피해를 줄이는 데 도움이 됩니다.
    const newRefreshToken = jwt.sign(
      { id: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' } // 새로운 Refresh Token 만료 시간
    );

    // 새로운 Refresh Token 해싱 및 데이터베이스 업데이트
    const newHashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken: newHashedRefreshToken },
    });

    // 새로운 Access Token과 Refresh Token을 HTTP-only 쿠키로 설정하여 전송
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
 * @throws {HttpError} - 인증되지 않은 사용자이거나 로그아웃 처리 중 오류 발생 시
 */
authRouter.post('/logout', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // authenticateToken 미들웨어를 통해 req.user에 사용자 정보가 설정되어 있는지 확인
    if (!req.user) {
      throw new HttpError('인증되지 않은 사용자입니다.', 401);
    }

    // 데이터베이스에서 해당 사용자의 리프레시 토큰을 무효화 (null로 설정)
    await prisma.user.update({
      where: { id: String(req.user.id) },
      data: { hashedRefreshToken: null },
    });

    // 클라이언트의 쿠키에서 accessToken과 refreshToken을 제거
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

/**
 * 현재 로그인된 사용자 정보 조회 라우트
 * @route GET /auth/me
 * @middleware authenticateToken - Access Token 유효성 검사
 * @returns {object} - 현재 로그인된 사용자 정보 (ID, 이메일, 이름, 역할, 회사 정보 포함)
 * @throws {HttpError} - 사용자 정보를 찾을 수 없거나 인증되지 않은 경우
 */
authRouter.get('/me', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  // authenticateToken 미들웨어를 통해 req.user에 사용자 정보가 설정됩니다.
  // 이 시점에서는 req.user에 company 정보도 포함되어 있습니다.
  if (!req.user) {
    // req.user가 없을 경우 (미들웨어에서 에러가 처리되지 않았거나 비정상적인 접근 시)
    return next(new HttpError('사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.', 401));
  }

  // 이제 user 객체와 company 객체를 모두 포함하여 응답합니다.
  res.status(200).json({
    user: { // "user" 키로 한 번 더 감싸서 응답 형식을 맞춥니다.
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      company: { // <-- **여기가 바로 회사 정보를 추가하는 부분입니다!**
        id: req.user.company.id,
        name: req.user.company.name,
        // 필요하다면 company 스키마에 정의된 다른 필드를 여기에 추가할 수 있습니다.
        // 예: bizNumber: req.user.company.bizNumber,
      },
    },
  });
});

export default authRouter;
