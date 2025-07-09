import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Prisma, Role } from '@prisma/client';
import { AppError } from '../types/error';

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      user?: Prisma.UserGetPayload<{
        include: { company: true };
      }>;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_very_strong_jwt_secret_key_please_change_this_in_production';

/**
 * 토큰 인증 미들웨어
 * 요청 쿠키에서 accessToken을 추출하고 유효성을 검증합니다.
 * 유효한 경우, 사용자 정보와 함께 회사 정보를 데이터베이스에서 조회하여 req.user에 추가하고 다음 미들웨어로 제어를 전달합니다.
 * 유효하지 않거나 없는 경우, 적절한 에러를 발생시킵니다.
 * @param req Express 요청 객체
 * @param res Express 응답 객체
 * @param next 다음 미들웨어 함수
 */
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return next(new AppError('인증 토큰이 제공되지 않았습니다.', 401));
  }

  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as {
      id: string;
      email: string;
      name: string;
      role: Role;
      iat: number;
      exp: number;
    };

    const userWithCompany = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        company: true,
      },
    });

    if (!userWithCompany) {
      return next(new AppError('사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.', 404));
    }

    req.user = userWithCompany;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('인증 토큰이 만료되었습니다.', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('유효하지 않은 인증 토큰입니다.', 403));
    } else {
      console.error('[인증 미들웨어 오류]', error);
      return next(new AppError('인증 중 알 수 없는 오류가 발생했습니다.', 500));
    }
  }
};

export default authenticateToken;