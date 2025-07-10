import { MonthlyBudget } from "@prisma/client";
import prisma from "../config/prisma";

const getMonthlyBudget = async (
  companyId: MonthlyBudget["companyId"],
  year: MonthlyBudget["year"],
  month: MonthlyBudget["month"],
) => {
  return await prisma.monthlyBudget.findUnique({
    where: {
      companyId_year_month: { companyId, year, month },
    },
  });
};

const getTotalExpense = async (companyId: MonthlyBudget["companyId"], year: MonthlyBudget["year"]) => {
  return await prisma.monthlyBudget.aggregate({
    where: { companyId, year },
    _sum: { currentMonthExpense: true },
  });
};

export default {
  getMonthlyBudget,
  getTotalExpense,
};
