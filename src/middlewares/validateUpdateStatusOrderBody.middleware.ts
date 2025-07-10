import { RequestHandler } from "express";
import { TUpdateStatusOrderBodyDto } from "../dtos/order.dto";
import { ForbiddenError, ValidationError } from "../types/error";

const validateUpdateStatusOrderBody: RequestHandler<{}, {}, TUpdateStatusOrderBodyDto> = (req, res, next) => {
  const { approver, adminMessage, status } = req.body;

  if (!adminMessage) {
    throw new ValidationError("승인/반려 메시지를 작성해주세요.");
  }

  if (!status) {
    throw new ValidationError("올바른 상태를 입력해주세요.");
  }

  if (!approver) {
    throw new ForbiddenError("담당자가 존재하지 않습니다.");
  }

  next();
};

export default validateUpdateStatusOrderBody;
