import budgetService from "../services/budget.service";
import budgetRepository from "../repositories/budget.repository";
import { NotFoundError } from "../types/error";
import prisma from "../config/prisma";

jest.mock("../repositories/budget.repository");
jest.mock("../config/prisma", () => ({
  $transaction: jest.fn(),
}));

describe("budgetService", () => {
  const mockCompanyId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMonthlyBudget", () => {
    test("예산이 없으면 NotFoundError를 throw한다", async () => {
      (budgetRepository.getMonthlyBudget as jest.Mock).mockResolvedValueOnce(null);

      await expect(budgetService.getMonthlyBudget(mockCompanyId)).rejects.toThrow(NotFoundError);
    });

    test("정상적으로 예산과 지출 데이터를 반환한다", async () => {
      const currentMonthBudget = {
        currentMonthBudget: 1000,
        currentMonthExpense: 500,
      };

      const previousMonthBudget = {
        currentMonthBudget: 900,
        currentMonthExpense: 450,
      };

      const currentYearTotalExpense = {
        _sum: {
          currentMonthExpense: 3000,
        },
      };

      const previousYearTotalExpense = {
        _sum: {
          currentMonthExpense: 2500,
        },
      };

      (budgetRepository.getMonthlyBudget as jest.Mock)
        .mockResolvedValueOnce(currentMonthBudget) // 현재 예산
        .mockResolvedValueOnce(previousMonthBudget); // 전월 예산

      (budgetRepository.getTotalExpense as jest.Mock)
        .mockResolvedValueOnce(currentYearTotalExpense)
        .mockResolvedValueOnce(previousYearTotalExpense);

      const result = await budgetService.getMonthlyBudget(mockCompanyId);

      expect(result).toEqual({
        ...currentMonthBudget,
        currentYearTotalExpense: 3000,
        previousMonthBudget: 900,
        previousMonthExpense: 450,
        previousYearTotalExpense: 2500,
      });
    });
  });

  describe("updateMonthlyBudget", () => {
    const body = {
      currentMonthBudget: 2000,
      monthlyBudget: 3000,
    };

    test("예산이 없으면 새로 생성 후 업데이트", async () => {
      (budgetRepository.getMonthlyBudget as jest.Mock).mockResolvedValueOnce(null);

      const mockCreate = jest.fn();
      const mockUpdate = jest.fn().mockResolvedValue({ currentMonthBudget: 2000 });
      (budgetRepository.createMonthlyBudget as jest.Mock).mockImplementation(mockCreate);
      (budgetRepository.updateMonthlyBudget as jest.Mock).mockImplementation(mockUpdate);

      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return await cb({}); // 가짜 트랜잭션 객체
      });

      const result = await budgetService.updateMonthlyBudget(mockCompanyId, body);

      expect(mockCreate).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
      expect(result).toEqual({ currentMonthBudget: 2000 });
    });

    test("예산이 있으면 업데이트만 수행", async () => {
      (budgetRepository.getMonthlyBudget as jest.Mock).mockResolvedValueOnce({ currentMonthBudget: 1000 });

      const mockUpdate = jest.fn().mockResolvedValue({ currentMonthBudget: 2500 });
      (budgetRepository.updateMonthlyBudget as jest.Mock).mockImplementation(mockUpdate);

      (prisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
        return await cb({}); // 가짜 트랜잭션 객체
      });

      const result = await budgetService.updateMonthlyBudget(mockCompanyId, body);

      expect(mockUpdate).toHaveBeenCalled();
      expect(result).toEqual({ currentMonthBudget: 2500 });
    });
  });
});
