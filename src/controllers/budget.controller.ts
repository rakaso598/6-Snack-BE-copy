import { RequestHandler } from "express";
import budgetService from "../services/budget.service";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";

// 예산 및 지출 현황 조회
const getMonthlyBudget: RequestHandler = async (req, res, next) => {
  const companyId = parseNumberOrThrow(req.params.companyId, "companyId");
  const budget = await budgetService.getMonthlyBudget(companyId);

  res.status(200).json(budget);
};

export default {
  getMonthlyBudget,
};
