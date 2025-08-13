import request from "supertest";
import app from "../app";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import getDateForBudget from "../utils/getDateForBudget";

const prisma = new PrismaClient();

describe("Budget API Integration Tests", () => {
  let adminToken: string;
  let superAdminToken: string;
  let testCompany: any;
  const baseAdminUrl = "/admin";
  const baseSuperAdminUrl = "/super-admin";

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.receipt.deleteMany();
    await prisma.order.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    await prisma.monthlyBudget.deleteMany();

    // 회사 및 유저 생성
    testCompany = await prisma.company.create({
      data: { name: "테스트회사", bizNumber: "123-45-67890" },
    });
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@budget.com",
        name: "관리자",
        password: "hashedPassword",
        companyId: testCompany.id,
        role: "ADMIN",
      },
    });
    const superAdminUser = await prisma.user.create({
      data: {
        email: "superadmin@budget.com",
        name: "최고관리자",
        password: "hashedPassword",
        companyId: testCompany.id,
        role: "SUPER_ADMIN",
      },
    });
    const { year, month } = getDateForBudget();
    await prisma.monthlyBudget.create({
      data: {
        companyId: testCompany.id,
        currentMonthBudget: 100000,
        currentMonthExpense: 50000,
        monthlyBudget: 1000000,
        year,
        month,
      },
    });
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

  afterAll(async () => {
    await prisma.$disconnect();
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
    it("should return 403 for non-admin", async () => {
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
    it("should return 403 for ADMIN", async () => {
      const res = await request(app)
        .patch(`${baseSuperAdminUrl}/${testCompany.id}/budgets`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ currentMonthBudget: 300000, monthlyBudget: 3000000 });
      expect([401, 403]).toContain(res.status);
    });
    it("should return 400 for invalid body", async () => {
      const res = await request(app)
        .patch(`${baseSuperAdminUrl}/${testCompany.id}/budgets`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ currentMonthBudget: -1, monthlyBudget: "not-a-number" });
      expect([400, 422]).toContain(res.status);
    });
  });
});
