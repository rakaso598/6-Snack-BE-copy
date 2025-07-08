import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

const JWT_SECRET: string = process.env.JWT_SECRET || 'fallback_secret_key';

interface UserPayload {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  iat: number;
  exp: number;
}

const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    res.status(401).json({ message: '인증 토큰이 제공되지 않았습니다.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT 검증 실패:', err.message);
      res.status(403).json({ message: '유효하지 않거나 만료된 토큰입니다.' });
      return;
    }

    req.user = decoded as UserPayload;
    next();
  });
};

export default authenticateToken;
