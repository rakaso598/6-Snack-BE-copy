import { MonthlyBudget, Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { TMonthlyBudget, TTotalExpense, TUpdateMonthlyBudgetBody } from "../types/budget.type";

const getMonthlyBudget = async ({ companyId, year, month }: TMonthlyBudget) => {
  return await prisma.monthlyBudget.findUnique({
    where: {
      companyId_year_month: { companyId, year, month },
    },
  });
};

const getTotalExpense = async ({ companyId, year }: TTotalExpense) => {
  return await prisma.monthlyBudget.aggregate({
    where: { companyId, year },
    _sum: { currentMonthExpense: true },
  });
};

const updateMonthlyBudget = async (
  { companyId, year, month }: TMonthlyBudget,
  body: TUpdateMonthlyBudgetBody,
  tx?: Prisma.TransactionClient,
) => {
  const client = tx || prisma;
  const { currentMonthBudget = 0, monthlyBudget = 0 } = body;

  return await client.monthlyBudget.update({
    where: { companyId_year_month: { companyId, year, month } },
    data: { currentMonthBudget, monthlyBudget },
  });
};

export default {
  getMonthlyBudget,
  getTotalExpense,
  updateMonthlyBudget,
};
