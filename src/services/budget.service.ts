import { MonthlyBudget } from "@prisma/client";
import budgetRepository from "../repositories/budget.repository";
import { NotFoundError } from "../types/error";
import { TUpdateMonthlyBudgetBody } from "../types/budget.type";
import getDateForBudget from "../utils/getDateForBudget";
import prisma from "../config/prisma";

// 예산 및 지출 현황 조회(관리자, 최고 관리자)
const getMonthlyBudget = async (companyId: MonthlyBudget["companyId"]) => {
  const { year, month, previousYear, previousMonth } = getDateForBudget();

  const currentMonthBudget = await budgetRepository.getMonthlyBudget({ companyId, year, month });

  if (!currentMonthBudget) {
    throw new NotFoundError("예산이 존재하지 않습니다.");
  }

  const previousMonthBudget = await budgetRepository.getMonthlyBudget({ companyId, year, month: previousMonth });

  const currentYearTotalExpense = await budgetRepository.getTotalExpense({ companyId, year });
  const previousYearTotalExpense = await budgetRepository.getTotalExpense({ companyId, year: previousYear });

  const BudgetAndExpense = {
    ...currentMonthBudget,
    currentYearTotalExpense: currentYearTotalExpense?._sum.currentMonthExpense ?? 0,
    previousMonthBudget: previousMonthBudget?.currentMonthBudget ?? 0,
    previousMonthExpense: previousMonthBudget?.currentMonthExpense ?? 0,
    previousYearTotalExpense: previousYearTotalExpense?._sum.currentMonthExpense ?? 0,
  };

  return BudgetAndExpense;
};

// 예산 수정(최고 관리자)
const updateMonthlyBudget = async (companyId: MonthlyBudget["companyId"], body: TUpdateMonthlyBudgetBody) => {
  const { year, month } = getDateForBudget();

  const monthlyBudget = await budgetRepository.getMonthlyBudget({ companyId, year, month });

  return await prisma.$transaction(async (tx) => {
    if (!monthlyBudget) {
      await budgetRepository.createMonthlyBudget({ companyId, year, month }, tx);

      const updatedMonthlyBudget = await budgetRepository.updateMonthlyBudget({ companyId, year, month }, body, tx);

      return updatedMonthlyBudget;
    }

    const updatedMonthlyBudget = await budgetRepository.updateMonthlyBudget({ companyId, year, month }, body, tx);

    return updatedMonthlyBudget;
  });
};

export default {
  getMonthlyBudget,
  updateMonthlyBudget,
};
