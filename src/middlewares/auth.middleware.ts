import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

// 사용자 정의 Request 인터페이스를 확장하여 user 속성을 추가합니다.
// 이 부분은 Express의 Request 객체에 사용자 정보를 추가하기 위함입니다.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        role: Role;
      };
    }
  }
}

// JWT 비밀 키는 환경 변수에서 가져옵니다.
// 프로덕션 환경에서는 반드시 강력하고 예측 불가능한 값으로 설정해야 합니다.
const JWT_SECRET: string = process.env.JWT_SECRET || 'your_very_strong_and_secret_jwt_key_please_change_this_in_production';

// HttpError 클래스는 표준 Error 객체를 확장하여 HTTP 상태 코드를 포함합니다.
// 이는 에러 발생 시 클라이언트에게 적절한 HTTP 상태 코드를 반환하기 위해 사용됩니다.
class HttpError extends Error {
  public status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    // 프로토타입 체인을 올바르게 설정하여 instanceof 연산자가 작동하도록 합니다.
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/**
 * 토큰 인증 미들웨어
 * 요청 쿠키에서 accessToken을 추출하고 유효성을 검증합니다.
 * 유효한 경우, 사용자 정보를 req.user에 추가하고 다음 미들웨어로 제어를 전달합니다.
 * 유효하지 않거나 없는 경우, 적절한 에러를 발생시킵니다.
 * @param req Express 요청 객체
 * @param res Express 응답 객체
 * @param next 다음 미들웨어 함수
 */
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return next(new HttpError('인증 토큰이 제공되지 않았습니다.', 401));
  }

  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as {
      id: number;
      email: string;
      name: string;
      role: Role;
      iat: number;
      exp: number;
    };

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

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
