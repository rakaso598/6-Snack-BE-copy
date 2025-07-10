import { MonthlyBudget } from "@prisma/client";
import budgetRepository from "../repositories/budget.repository";
import { formatInTimeZone } from "date-fns-tz";
import { subMonths, subYears } from "date-fns";
import { NotFoundError } from "../types/error";
import getDateForBudget from "../utils/date";

// 예산 및 지출 현황 조회
const getMonthlyBudget = async (companyId: MonthlyBudget["companyId"]) => {
  const { year, month, previousYear, previousMonth } = getDateForBudget();

  const currentMonthBudget = await budgetRepository.getMonthlyBudget(companyId, year, month);

  if (!currentMonthBudget) {
    throw new NotFoundError("예산이 존재하지 않습니다.");
  }

  const previousMonthBudget = await budgetRepository.getMonthlyBudget(companyId, year, previousMonth);

  const currentYearTotalExpense = await budgetRepository.getTotalExpense(companyId, year);
  const previousYearTotalExpense = await budgetRepository.getTotalExpense(companyId, previousYear);

  const BudgetAndExpense = {
    ...currentMonthBudget,
    currentYearTotalExpense: currentYearTotalExpense?._sum.currentMonthExpense ?? 0,
    previousMonthBudget: previousMonthBudget?.currentMonthBudget ?? 0,
    previousMonthExpense: previousMonthBudget?.currentMonthExpense ?? 0,
    previousYearTotalExpense: previousYearTotalExpense?._sum.currentMonthExpense ?? 0,
  };

  return BudgetAndExpense;
};

export default {
  getMonthlyBudget,
};
