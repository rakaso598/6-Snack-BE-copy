import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { AuthenticationError, NotFoundError, ServerError } from "../types/error";
import prisma from "../config/prisma";

const JWT_SECRET: string = process.env.JWT_SECRET ?? "your_very_strong_jwt_secret_key_please_change_this_in_production";

/**
 * 토큰 인증 미들웨어
 * 쿠키에서 accessToken을 추출하여 JWT를 검증하고,
 * 사용자 정보를 req.user에 설정합니다.
 */
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return next(new AuthenticationError("인증 토큰이 제공되지 않았습니다."));
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
      return next(new NotFoundError("사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요."));
    }

    req.user = userWithCompany;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError("인증 토큰이 만료되었습니다."));
    } else if (error instanceof jwt.JsonWebTokenError) {
      return next(new AuthenticationError("유효하지 않은 인증 토큰입니다."));
    } else {
      console.error("[인증 미들웨어 오류]", error);
      return next(new ServerError("인증 중 알 수 없는 오류가 발생했습니다."));
    }
  }
};

export default authenticateToken;
