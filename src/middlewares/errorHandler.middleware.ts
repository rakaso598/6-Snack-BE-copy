import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/error.types';

const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  let status = 500;
  let message = "Internal Server Error";
  
  // Prisma 에러 처리
  if (error.code === 'P2002') {
    status = 409;
    message = '중복된 데이터가 존재합니다.';
  } else if (error.code === 'P2025') {
    status = 404;
    message = '요청한 데이터를 찾을 수 없습니다.';
  } else if (error.code === 'P2003') {
    status = 400;
    message = '잘못된 참조 데이터입니다.';
  } else if (error.code) {
    status = 400;
    message = error.message || '데이터베이스 오류가 발생했습니다.';
  }
  // 커스텀 에러 처리
  else if (error.code) {
    status = error.code;
    message = error.message;
  }
  // UnauthorizedError 처리
  else if (error.name === "UnauthorizedError") {
    status = 401;
    message = "유효하지 않은 토큰입니다.";
  }
  
  res.status(status).json({
    path: req.path,
    method: req.method,
    message: message,
    data: error.data ?? undefined,
    date: new Date(),
  });
};

export default errorHandler; 