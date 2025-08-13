import request from "supertest";
import app from "../app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("User API Integration Tests", () => {
  let userAgent: ReturnType<typeof request.agent>;
  let adminAgent: ReturnType<typeof request.agent>;
  let superAdminAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    // 테스트 DB 연결 확인
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 각 권한별로 agent 생성 (쿠키 자동 저장 및 전송)
    userAgent = request.agent(app);
    adminAgent = request.agent(app);
    superAdminAgent = request.agent(app);

    // 각 agent로 로그인 (쿠키 자동 저장)
    await userAgent.post("/auth/login").send({
      email: "user@codeit.com",
      password: "1q2w3e4r!",
    });

    await adminAgent.post("/auth/login").send({
      email: "admin@codeit.com",
      password: "1q2w3e4r!",
    });

    await superAdminAgent.post("/auth/login").send({
      email: "super_admin@codeit.com",
      password: "1q2w3e4r!",
    });
  });

  describe("GET /users/:userId - getUserInfo", () => {
    describe("성공 케이스", () => {
      it("USER 권한으로 자기 자신 정보 조회 성공", async () => {
        // Act: USER가 자기 자신 정보 조회 (agent 사용으로 쿠키 자동 전송)
        const response = await userAgent.get("/users/user-3");

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          message: "일반 유저 정보 조회 완료",
          user: {
            company: { name: expect.any(String) },
            name: expect.any(String),
            email: expect.any(String),
            // USER 권한은 role 필드가 없어야 함
          },
        });
        expect(response.body.user).not.toHaveProperty("role");
      });

      it("ADMIN 권한으로 자기 자신 정보 조회 성공", async () => {
        // Act: ADMIN이 자기 자신 정보 조회 (agent 사용으로 쿠키 자동 전송)
        const response = await adminAgent.get("/users/user-2");

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          message: "관리자/최고 관리자 정보 조회 완료",
          user: {
            company: { name: expect.any(String) },
            name: expect.any(String),
            email: expect.any(String),
            role: "ADMIN",
          },
        });
        expect(response.body.user.role).toBe("ADMIN");
      });

      it("SUPER_ADMIN 권한으로 자기 자신 정보 조회 성공", async () => {
        // Act: SUPER_ADMIN이 자기 자신 정보 조회 (agent 사용으로 쿠키 자동 전송)
        const response = await superAdminAgent.get("/users/user-1");

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          message: "관리자/최고 관리자 정보 조회 완료",
          user: {
            company: { name: expect.any(String) },
            name: expect.any(String),
            email: expect.any(String),
            role: "SUPER_ADMIN",
          },
        });
        expect(response.body.user.role).toBe("SUPER_ADMIN");
      });
    });

    describe("실패 케이스", () => {
      it("다른 유저의 정보 조회 시도 시 400 에러", async () => {
        // Act: USER가 다른 유저 정보 조회 시도 (agent 사용으로 쿠키 자동 전송)
        const response = await userAgent.get("/users/user-4"); // 다른 유저 ID

        // Assert: 실제 Error Middleware 응답 구조에 맞춤
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
          path: "/users/user-4",
          method: "GET",
          message: "자기 자신의 정보만 조회할 수 있습니다.",
          date: expect.any(String),
        });
      });
    });
  });
});
