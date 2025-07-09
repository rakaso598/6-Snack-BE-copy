import { MonthlyBudget } from "@prisma/client";
import budgetRepository from "../repositories/budget.repository";
import { formatInTimeZone } from "date-fns-tz";
import { subMonths, subYears } from "date-fns";
import { NotFoundError } from "../types/error";

// 예산 및 지출 현황 조회
const getMonthlyBudget = async (companyId: MonthlyBudget["companyId"]) => {
  const date = new Date();
  const timeZone = "Asia/Seoul";

  const year = formatInTimeZone(date, timeZone, "yyyy");
  const month = formatInTimeZone(date, timeZone, "MM");
  const previousYear = formatInTimeZone(subYears(date, 1), timeZone, "yyyy");
  const previousMonth = formatInTimeZone(subMonths(date, 1), timeZone, "MM");

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
