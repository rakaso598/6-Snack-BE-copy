import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

const JWT_SECRET: string = process.env.JWT_SECRET ?? "your_very_strong_jwt_secret_key_please_change_this_in_production";

declare global {
  namespace Express {
    interface Request {
      user?: Prisma.UserGetPayload<{
        include: { company: true };
      }>;
    }
  }
}

/**
 * 선택적 토큰 인증 미들웨어
 * 토큰이 있으면 검증하여 사용자 정보를 req.user에 설정하고,
 * 토큰이 없으면 req.user를 undefined로 두고 계속 진행합니다.
 * 쿠키의 accessToken 또는 Authorization 헤더의 Bearer 토큰을 지원합니다.
 */
const optionalAuthenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  // 쿠키에서 토큰을 먼저 확인
  let accessToken = req.cookies.accessToken;

  // 쿠키에 토큰이 없으면 Authorization 헤더 확인
  if (!accessToken) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }
  }

  if (!accessToken) {
    // 토큰이 없어도 계속 진행
    req.user = undefined;
    return next();
  }

  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as {
      userId: string;
      email: string;
      role: Role;
    };

    const userWithCompany = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        company: true,
      },
    });

    if (!userWithCompany) {
      // 사용자 정보가 없어도 계속 진행
      req.user = undefined;
      return next();
    }

    req.user = userWithCompany;
    next();
  } catch (error) {
    // JWT 오류가 있어도 계속 진행 (로그는 남기되)
    console.warn("[선택적 인증 미들웨어] JWT 검증 실패:", error instanceof Error ? error.message : error);
    req.user = undefined;
    next();
  }
};

export default optionalAuthenticateToken;
