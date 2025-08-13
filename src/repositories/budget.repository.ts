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

const createMonthlyBudget = async (
  data: { companyId: number; year: string; month: string },
  tx?: Prisma.TransactionClient,
) => {
  const client = tx || prisma;

  return client.monthlyBudget.create({
    data: {
      companyId: data.companyId,
      year: data.year,
      month: data.month,
      currentMonthExpense: 0,
      currentMonthBudget: 0,
      monthlyBudget: 0,
    },
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

const updateCurrentMonthExpense = async (
  { companyId, year, month }: TMonthlyBudget,
  currentMonthExpense: MonthlyBudget["currentMonthExpense"],
  tx?: Prisma.TransactionClient,
) => {
  const client = tx || prisma;

  return await client.monthlyBudget.update({
    where: { companyId_year_month: { companyId, year, month } },
    data: { currentMonthExpense },
  });
};

export default {
  getMonthlyBudget,
  getTotalExpense,
  createMonthlyBudget,
  updateMonthlyBudget,
  updateCurrentMonthExpense,
};
