import { RequestHandler } from "express";
import { TUpdateStatusOrderBodyDto } from "../dtos/order.dto";
import { ValidationError } from "../types/error";

const validateUpdateStatusOrderBody: RequestHandler<{}, {}, TUpdateStatusOrderBodyDto> = (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    throw new ValidationError("상태 값을 입력해주세요.");
  }

  if (status !== "APPROVED" && status !== "REJECTED") 
    throw new ValidationError("올바른 상태를 입력해주세요.");
  }

  next();
};

export default validateUpdateStatusOrderBody;
