import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../app";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

describe("Company Integration Tests", () => {
  let testUser: any;
  let testCompany: any;
  let superAdminUser: any;

  const JWT_SECRET = process.env.JWT_SECRET ?? "your_very_strong_jwt_secret_key_please_change_this_in_production";

  function makeAuthCookie(user: { id: string; email: string; role: "USER" | "ADMIN" | "SUPER_ADMIN" }) {
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    return [`accessToken=${token}`];
  }

  beforeAll(async () => {
    await prisma.$connect();

    // 데이터베이스 초기화
    await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Company" CASCADE`;

    // 테스트 데이터 생성
    testCompany = await prisma.company.create({
      data: { name: "테스트 회사", bizNumber: "1234567890" },
    });

    testUser = await prisma.user.create({
      data: {
        email: "user@example.com",
        name: "일반 사용자",
        password: "hashedPassword",
        companyId: testCompany.id,
        role: "USER",
      },
    });

    superAdminUser = await prisma.user.create({
      data: {
        email: "superadmin@example.com",
        name: "최고 관리자",
        password: "hashedPassword",
        companyId: testCompany.id,
        role: "SUPER_ADMIN",
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("PATCH /super-admin/users/:userId/company", () => {
    test("SUPER_ADMIN이 회사명과 비밀번호를 모두 수정한다", async () => {
      const companyData = {
        companyName: "새로운 회사명",
        passwordData: {
          newPassword: "newpassword123",
          newPasswordConfirm: "newpassword123",
        },
      };

      const response = await request(app)
        .patch(`/super-admin/users/${superAdminUser.id}/company`)
        .set("Cookie", makeAuthCookie(superAdminUser))
        .send(companyData)
        .expect(200);

      expect(response.body).toHaveProperty("message", "회사 정보가 업데이트 되었습니다");
      expect(response.body).toHaveProperty("company");
      expect(response.body.company).toHaveProperty("id", testCompany.id);
      expect(response.body.company).toHaveProperty("name", "새로운 회사명");
    });

    test("SUPER_ADMIN이 회사명만 수정한다", async () => {
      const companyData = {
        companyName: "업데이트된 회사명",
      };

      const response = await request(app)
        .patch(`/super-admin/users/${superAdminUser.id}/company`)
        .set("Cookie", makeAuthCookie(superAdminUser))
        .send(companyData)
        .expect(200);

      expect(response.body.company.name).toBe("업데이트된 회사명");
    });

    test("SUPER_ADMIN이 비밀번호만 수정한다", async () => {
      const companyData = {
        passwordData: {
          newPassword: "newpassword456@",
          newPasswordConfirm: "newpassword456@",
        },
      };

      const response = await request(app)
        .patch(`/super-admin/users/${superAdminUser.id}/company`)
        .set("Cookie", makeAuthCookie(superAdminUser))
        .send(companyData)
        .expect(200);

      expect(response.body.message).toBe("회사 정보가 업데이트 되었습니다");
    });

    test("SUPER_ADMIN이 아닌 사용자는 회사 정보를 수정할 수 없다", async () => {
      const companyData = {
        companyName: "새로운 회사명",
        passwordData: {
          newPassword: "newpassword123",
          newPasswordConfirm: "newpassword123",
        },
      };

      await request(app)
        .patch(`/super-admin/users/${testUser.id}/company`)
        .set("Cookie", makeAuthCookie(testUser))
        .send(companyData)
        .expect(403);
    });

    test("회사명과 비밀번호 모두 없을 때 400 에러", async () => {
      const companyData = {};

      await request(app)
        .patch(`/super-admin/users/${superAdminUser.id}/company`)
        .set("Cookie", makeAuthCookie(superAdminUser))
        .send(companyData)
        .expect(400);
    });

    test("비밀번호와 비밀번호 확인이 일치하지 않을 때 400 에러", async () => {
      const companyData = {
        passwordData: {
          newPassword: "password123",
          newPasswordConfirm: "password456",
        },
      };

      await request(app)
        .patch(`/super-admin/users/${superAdminUser.id}/company`)
        .set("Cookie", makeAuthCookie(superAdminUser))
        .send(companyData)
        .expect(400);
    });

    test("비밀번호가 8자 미만일 때 400 에러", async () => {
      const companyData = {
        passwordData: {
          newPassword: "123",
          newPasswordConfirm: "123",
        },
      };

      await request(app)
        .patch(`/super-admin/users/${superAdminUser.id}/company`)
        .set("Cookie", makeAuthCookie(superAdminUser))
        .send(companyData)
        .expect(400);
    });

    test("쿠키 없이 요청 시 401 에러", async () => {
      const companyData = {
        companyName: "새로운 회사명",
        passwordData: {
          newPassword: "newpassword123",
          newPasswordConfirm: "newpassword123",
        },
      };

      await request(app).patch(`/super-admin/users/${superAdminUser.id}/company`).send(companyData).expect(401);
    });

    test("존재하지 않는 유저 ID로 요청 시 400 에러", async () => {
      const companyData = {
        companyName: "새로운 회사명",
        passwordData: {
          newPassword: "newpassword123",
          newPasswordConfirm: "newpassword123",
        },
      };

      await request(app)
        .patch("/super-admin/users/non-existent-user/company")
        .set("Cookie", makeAuthCookie(superAdminUser))
        .send(companyData)
        .expect(400);
    });
  });
});
