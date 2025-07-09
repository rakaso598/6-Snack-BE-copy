import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// PrismaClient와 Prisma 네임스페이스를 임포트하여 타입 정의에 사용합니다.
import { PrismaClient, Prisma, Role } from '@prisma/client';
import HttpError from '../utils/HttpError'; // HttpError 유틸리티 임포트

const prisma = new PrismaClient(); // Prisma 클라이언트 인스턴스

// Request 객체에 user 속성을 확장하기 위한 타입 선언
// Prisma.UserGetPayload를 사용하여 user 객체에 company 정보가 포함될 것을 명시합니다.
declare global {
  namespace Express {
    interface Request {
      // user 속성은 company 정보를 포함하며, 없을 수도 있으므로 '?'를 붙입니다.
      user?: Prisma.UserGetPayload<{
        include: { company: true };
      }>;
    }
  }
}

// JWT_SECRET 환경 변수 (실제 프로덕션에서는 반드시 강력한 값으로 변경해야 합니다)
const JWT_SECRET = process.env.JWT_SECRET || 'your_very_strong_jwt_secret_key_please_change_this_in_production';

/**
 * 토큰 인증 미들웨어
 * 요청 쿠키에서 accessToken을 추출하고 유효성을 검증합니다.
 * 유효한 경우, **사용자 정보와 함께 회사 정보를 데이터베이스에서 조회하여 req.user에 추가**하고 다음 미들웨어로 제어를 전달합니다.
 * 유효하지 않거나 없는 경우, 적절한 에러를 발생시킵니다.
 * @param req Express 요청 객체
 * @param res Express 응답 객체
 * @param next 다음 미들웨어 함수
 */
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => { // async 키워드 추가
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return next(new HttpError('인증 토큰이 제공되지 않았습니다.', 401));
  }

  try {
    // **** JWT `decoded` 페이로드의 `id` 타입을 `string`으로 변경합니다. ****
    // Prisma 스키마에서 User.id가 UUID (String) 타입이므로 일치시켜야 합니다.
    const decoded = jwt.verify(accessToken, JWT_SECRET) as {
      id: string; // User ID는 UUID이므로 string입니다.
      email: string;
      name: string;
      role: Role;
      iat: number;
      exp: number;
    };

    // **핵심 변경: 데이터베이스에서 사용자 정보와 함께 company 관계를 include하여 조회합니다.**
    // 이렇게 함으로써 req.user에 company 정보가 자동으로 포함됩니다.
    const userWithCompany = await prisma.user.findUnique({
      where: { id: decoded.id }, // decoded.id는 이미 string입니다.
      include: {
        company: true, // company 관계 필드를 포함하여 조회
      },
    });

    if (!userWithCompany) {
      // 토큰은 유효하지만 DB에서 해당 사용자를 찾을 수 없는 경우
      return next(new HttpError('사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.', 404));
    }

    // 조회된 userWithCompany 객체 전체를 req.user에 할당합니다.
    // 이 객체는 이미 company 정보를 포함하고 있습니다.
    req.user = userWithCompany;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new HttpError('인증 토큰이 만료되었습니다.', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      return next(new HttpError('유효하지 않은 인증 토큰입니다.', 403));
    } else {
      console.error('[인증 미들웨어 오류]', error);
      return next(new HttpError('인증 중 알 수 없는 오류가 발생했습니다.', 500));
    }
  }
};

export default authenticateToken;