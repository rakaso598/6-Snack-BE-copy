import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      res.status(403).json({ message: '사용자 정보가 없거나 역할이 정의되지 않았습니다.' });
      return;
    }

    const hasPermission = allowedRoles.includes(req.user.role as Role);

    if (hasPermission) {
      next();
    } else {
      res.status(403).json({ message: '이 작업 또는 리소스에 접근할 권한이 없습니다.' });
    }
  };
};

export default authorizeRoles;