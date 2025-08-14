import request from "supertest";
import app from "../app";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import getDateForBudget from "../utils/getDateForBudget";

// Mock PrismaClient
jest.mock("@prisma/client");
jest.mock("../config/prisma", () => ({
  __esModule: true,
  default: {
    company: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    monthlyBudget: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

// Mock JWT authentication middleware
jest.mock("../middlewares/jwtAuth.middleware", () => {
  return jest.fn((req: any, res: any, next: any) => {
    // Mock user data based on the token in the Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "test-secret-key") as any;
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          companyId: decoded.companyId,
          company: {
            id: decoded.companyId,
            name: "Test Company"
          }
        };
        next();
      } catch (error) {
        res.status(401).json({ message: "인증 토큰이 유효하지 않습니다." });
      }
    } else {
      res.status(401).json({ message: "인증 토큰이 제공되지 않았습니다." });
    }
  });
});

// Mock authorization middleware
jest.mock("../middlewares/authorizeRoles.middleware", () => {
  return jest.fn((...allowedRoles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (req.user && allowedRoles.includes(req.user.role)) {
        next();
      } else {
        res.status(403).json({ message: "권한이 없습니다." });
      }
    };
  });
});

// Mock budget service
jest.mock("../services/budget.service", () => ({
  __esModule: true,
  default: {
    getMonthlyBudget: jest.fn(),
    updateMonthlyBudget: jest.fn(),
  },
}));

const prisma = new PrismaClient();

describe("Budget API Integration Tests", () => {
  let adminToken: string;
  let superAdminToken: string;
  let testCompany: any;
  const baseAdminUrl = "/admin";
  const baseSuperAdminUrl = "/super-admin";

  beforeAll(async () => {
    // Mock data setup
    testCompany = {
      id: 1, // Changed to number
      name: "테스트회사",
      bizNumber: "123-45-67890"
    };

    const adminUser = {
      id: "admin-user-id",
      email: "admin@budget.com",
      name: "관리자",
      companyId: testCompany.id,
      role: "ADMIN"
    };

    const superAdminUser = {
      id: "super-admin-user-id",
      email: "superadmin@budget.com",
      name: "최고관리자",
      companyId: testCompany.id,
      role: "SUPER_ADMIN"
    };

    const { year, month } = getDateForBudget();
    const mockBudget = {
      id: "budget-id",
      companyId: testCompany.id,
      currentMonthBudget: 100000,
      currentMonthExpense: 50000,
      monthlyBudget: 1000000,
      year,
      month,
    };

    // Setup mocks
    const mockPrisma = require("../config/prisma").default;
    mockPrisma.company.create.mockResolvedValue(testCompany);
    mockPrisma.user.create.mockResolvedValue(adminUser);
    mockPrisma.monthlyBudget.create.mockResolvedValue(mockBudget);
    mockPrisma.monthlyBudget.findFirst.mockResolvedValue(mockBudget);
    mockPrisma.monthlyBudget.update.mockResolvedValue({
      ...mockBudget,
      currentMonthBudget: 200000,
      monthlyBudget: 2000000,
    });
    mockPrisma.$connect.mockResolvedValue(undefined);
    mockPrisma.$disconnect.mockResolvedValue(undefined);

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: "ADMIN", companyId: testCompany.id },
      process.env.JWT_SECRET || "test-secret-key",
      { expiresIn: "1h" }
    );
    superAdminToken = jwt.sign(
      { userId: superAdminUser.id, email: superAdminUser.email, role: "SUPER_ADMIN", companyId: testCompany.id },
      process.env.JWT_SECRET || "test-secret-key",
      { expiresIn: "1h" }
    );
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock responses
    const mockPrisma = require("../config/prisma").default;
    const mockBudgetService = require("../services/budget.service").default;

    const { year, month } = getDateForBudget();
    const mockBudget = {
      id: "budget-id",
      companyId: testCompany.id,
      currentMonthBudget: 100000,
      currentMonthExpense: 50000,
      monthlyBudget: 1000000,
      year,
      month,
    };

    const updatedBudget = {
      ...mockBudget,
      currentMonthBudget: 200000,
      monthlyBudget: 2000000,
    };

    mockPrisma.monthlyBudget.findFirst.mockResolvedValue(mockBudget);
    mockPrisma.monthlyBudget.update.mockResolvedValue(updatedBudget);

    // Mock budget service methods
    mockBudgetService.getMonthlyBudget.mockResolvedValue(mockBudget);
    mockBudgetService.updateMonthlyBudget.mockResolvedValue(updatedBudget);
  });

  afterAll(async () => {
    // No need to disconnect from real database
  });

  describe("GET /admin/:companyId/budgets", () => {
    it("should return budget info for ADMIN", async () => {
      const res = await request(app)
        .get(`${baseAdminUrl}/${testCompany.id}/budgets`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("companyId", testCompany.id);
      expect(res.body).toHaveProperty("currentMonthBudget");
      expect(res.body).toHaveProperty("monthlyBudget");
    });

    it("should return 401/403 for non-admin", async () => {
      const res = await request(app)
        .get(`${baseAdminUrl}/${testCompany.id}/budgets`);

      expect([401, 403]).toContain(res.status);
    });
  });

  describe("PATCH /super-admin/:companyId/budgets", () => {
    it("should update budget for SUPER_ADMIN", async () => {
      const res = await request(app)
        .patch(`${baseSuperAdminUrl}/${testCompany.id}/budgets`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ currentMonthBudget: 200000, monthlyBudget: 2000000 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("currentMonthBudget", 200000);
      expect(res.body).toHaveProperty("monthlyBudget", 2000000);
    });

    it("should return 401/403 for ADMIN", async () => {
      const res = await request(app)
        .patch(`${baseSuperAdminUrl}/${testCompany.id}/budgets`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ currentMonthBudget: 300000, monthlyBudget: 3000000 });

      expect([401, 403]).toContain(res.status);
    });

    it("should return 400/422 for invalid body", async () => {
      const res = await request(app)
        .patch(`${baseSuperAdminUrl}/${testCompany.id}/budgets`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ currentMonthBudget: -1, monthlyBudget: "not-a-number" });

      expect([400, 422]).toContain(res.status);
    });
  });
});