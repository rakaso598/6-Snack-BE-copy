import { ErrorRequestHandler } from "express";

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  const status = error.code ?? 500;

  res.status(status).json({
    path: req.path,
    method: req.method,
    message: error.message ?? "예상치 못한 오류가 발생했습니다.",
    data: error.data ?? undefined,
    date: new Date(),
  });
};

export default errorHandler;
