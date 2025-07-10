import { RequestHandler } from "express";
import { TUpdateMonthlyBudgetBody } from "../types/budget.type";
import { ValidationError } from "../types/error";

const validateBudgetBody: RequestHandler<{}, {}, TUpdateMonthlyBudgetBody> = (req, res, next) => {
  const { currentMonthBudget, monthlyBudget } = req.body;

  if (typeof currentMonthBudget === "string" || typeof monthlyBudget === "string") {
    throw new ValidationError("이번 달 예산 또는 매달 예산에는 숫자만 입력해주세요.");
  }

  if (currentMonthBudget < 0 || monthlyBudget < 0) {
    throw new ValidationError("예산은 0원 이상으로 설정해주세요.");
  }

  next();
};

export default validateBudgetBody;
