import budgetController from "./budget.controller";
import budgetService from "../services/budget.service";
import { ValidationError } from "../types/error";
import { TUpdateMonthlyBudgetBody } from "../types/budget.type";

jest.mock("../services/budget.service");

describe("budgetController", () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("getMonthlyBudget", () => {
    test("정상적으로 예산 및 지출 현황을 조회한다", async () => {
      req.params.companyId = "1";
      const mockBudget = { companyId: 1, currentMonthBudget: 100000, monthlyBudget: 1000000 };

      (budgetService.getMonthlyBudget as jest.Mock).mockResolvedValue(mockBudget);

      await budgetController.getMonthlyBudget(req, res, next);

      expect(budgetService.getMonthlyBudget).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockBudget);
    });

    test("companyId가 숫자가 아니면 ValidationError 발생", async () => {
      req.params.companyId = "abc";

      await expect(budgetController.getMonthlyBudget(req, res, next)).rejects.toThrow(ValidationError);
    });
  });

  describe("updateMonthlyBudget", () => {
    test("정상적으로 예산을 수정한다", async () => {
      req.params.companyId = "1";
      req.body = {
        currentMonthBudget: 150000,
        monthlyBudget: 1200000,
      } satisfies TUpdateMonthlyBudgetBody;

      const mockUpdatedBudget = {
        companyId: 1,
        currentMonthBudget: 150000,
        monthlyBudget: 1200000,
      };

      (budgetService.updateMonthlyBudget as jest.Mock).mockResolvedValue(mockUpdatedBudget);

      await budgetController.updateMonthlyBudget(req, res, next);

      expect(budgetService.updateMonthlyBudget).toHaveBeenCalledWith(1, req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedBudget);
    });

    test("companyId가 숫자가 아니면 ValidationError 발생", async () => {
      req.params.companyId = "NaN";
      req.body = {
        currentMonthBudget: 100000,
        monthlyBudget: 1000000,
      };

      await expect(budgetController.updateMonthlyBudget(req, res, next)).rejects.toThrow(ValidationError);
    });
  });
});
