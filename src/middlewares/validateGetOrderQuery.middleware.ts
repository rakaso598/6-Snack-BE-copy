import { RequestHandler } from "express";
import { BadRequestError } from "../types/error";
import { TGetOrdersQueryDto } from "../dtos/order.dto";

const validateGetOrderQuery: RequestHandler<{}, {}, {}, TGetOrdersQueryDto> = (req, res, next) => {
  const status = req.query.status;

  if (!status) {
    throw new BadRequestError("상태(pending, approved)를 입력해주세요.");
  }

  if (status !== "pending" && status !== "approved") {
    throw new BadRequestError("올바른 상태를 입력해주세요.");
  }

  next();
};

export default validateGetOrderQuery;
