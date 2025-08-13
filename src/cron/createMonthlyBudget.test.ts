import createMonthlyBudget from "./createMonthlyBudget";
import prisma from "../config/prisma";
import budgetRepository from "../repositories/budget.repository";
import getDateForBudget from "../utils/getDateForBudget";

jest.mock("../config/prisma", () => ({
  company: {
    findMany: jest.fn(),
  },
  monthlyBudget: {
    createMany: jest.fn(),
  },
}));

jest.mock("../repositories/budget.repository", () => ({
  getMonthlyBudget: jest.fn(),
}));

jest.mock("../utils/getDateForBudget", () => jest.fn());

describe("createMonthlyBudget", () => {
  const mockCompanies = [{ id: 1 }, { id: 2 }];

  const mockDate = {
    year: 2025,
    month: 8,
    previousMonth: 7,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("company가 없으면 작업을 건너뛴다", async () => {
    (prisma.company.findMany as jest.Mock).mockResolvedValue([]);

    await createMonthlyBudget();

    expect(prisma.company.findMany).toHaveBeenCalled();
    expect(prisma.monthlyBudget.createMany).not.toHaveBeenCalled();
  });

  test("company가 있으면 MonthlyBudget을 생성한다", async () => {
    (prisma.company.findMany as jest.Mock).mockResolvedValue(mockCompanies);
    (getDateForBudget as jest.Mock).mockReturnValue(mockDate);
    (budgetRepository.getMonthlyBudget as jest.Mock).mockResolvedValue({ monthlyBudget: 5000 });

    await createMonthlyBudget();

    expect(prisma.company.findMany).toHaveBeenCalled();
    expect(budgetRepository.getMonthlyBudget).toHaveBeenCalledTimes(2);
    expect(prisma.monthlyBudget.createMany).toHaveBeenCalledWith({
      data: [
        {
          companyId: 1,
          currentMonthExpense: 0,
          currentMonthBudget: 5000,
          monthlyBudget: 5000,
          year: 2025,
          month: 8,
        },
        {
          companyId: 2,
          currentMonthExpense: 0,
          currentMonthBudget: 5000,
          monthlyBudget: 5000,
          year: 2025,
          month: 8,
        },
      ],
      skipDuplicates: false,
    });
  });

  test("이전 월 예산이 없을 경우 0으로 생성된다", async () => {
    (prisma.company.findMany as jest.Mock).mockResolvedValue(mockCompanies);
    (getDateForBudget as jest.Mock).mockReturnValue(mockDate);
    (budgetRepository.getMonthlyBudget as jest.Mock).mockResolvedValue(null);

    await createMonthlyBudget();

    expect(prisma.monthlyBudget.createMany).toHaveBeenCalled();
    const callArg = (prisma.monthlyBudget.createMany as jest.Mock).mock.calls[0][0].data[0];
    expect(callArg.monthlyBudget).toBe(0);
  });
});
