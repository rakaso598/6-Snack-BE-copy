import { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
      [key: string]: any;
    };
  }
}

const authorizeRoles = (...allowedRoles: Array<'USER' | 'ADMIN' | 'SUPER_ADMIN'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      res.status(403).json({ message: '접근 권한이 없습니다.' });
      return;
    }

    const hasPermission = allowedRoles.includes(req.user.role);

    if (hasPermission) {
      next();
    } else {
      res.status(403).json({ message: '이 작업 또는 리소스에 접근할 권한이 없습니다.' });
      return;
    }
  };
};

export default authorizeRoles;
