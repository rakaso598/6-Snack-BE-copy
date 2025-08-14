import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../app";
import jwt from "jsonwebtoken";
import { cleanDatabase, createTestCompany, createTestUser, createTestCategory, disconnectPrisma } from "./test-utils";

const prisma = new PrismaClient();

describe("Product Integration Tests", () => {
  let testUser: any;
  let testCompany: any;
  let parentCategory: any;
  let childCategory: any;
  let anotherCategory: any;
  let otherUser: any;
  let userCookies: string[];
  let otherCookies: string[];

  const JWT_SECRET = process.env.JWT_SECRET ?? "your_very_strong_jwt_secret_key_please_change_this_in_production";

  function makeAuthCookie(user: { id: string; email: string; role: "USER" | "ADMIN" | "SUPER_ADMIN" }) {
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    return [`accessToken=${token}`];
  }

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터베이스 정리
    await cleanDatabase();

    // 기본 데이터 생성
    testCompany = await createTestCompany();

    parentCategory = await createTestCategory("음료");
    childCategory = await createTestCategory("콜라", parentCategory.id);
    anotherCategory = await createTestCategory("과자");

    testUser = await createTestUser(testCompany.id, "USER");
    otherUser = await createTestUser(testCompany.id, "USER");

    // 쿠키 생성
    userCookies = makeAuthCookie({ id: testUser.id, email: testUser.email, role: "USER" });
    otherCookies = makeAuthCookie({ id: otherUser.id, email: otherUser.email, role: "USER" });
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe("POST /products", () => {
    test("상품을 정상적으로 생성한다", async () => {
      const payload = {
        name: "테스트 상품",
        price: "10000",
        linkUrl: "https://example.com/product",
        categoryId: String(childCategory.id),
      };

      const res = await request(app).post("/products").set("Cookie", userCookies).send(payload).expect(201);

      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("name", payload.name);
      expect(res.body).toHaveProperty("price", 10000);
      expect(res.body).toHaveProperty("categoryId", childCategory.id);
      expect(res.body).toHaveProperty("creatorId", testUser.id);
    });
  });

  describe("GET /products", () => {
    test("상품 목록을 조회한다 (기본)", async () => {
      await prisma.product.createMany({
        data: [
          {
            name: "상품1",
            price: 5000,
            imageUrl: "https://example.com/a.jpg",
            linkUrl: "https://example.com/a",
            categoryId: childCategory.id,
            creatorId: testUser.id,
          },
          {
            name: "상품2",
            price: 7000,
            imageUrl: "https://example.com/b.jpg",
            linkUrl: "https://example.com/b",
            categoryId: childCategory.id,
            creatorId: testUser.id,
          },
        ],
      });

      const res = await request(app).get("/products").set("Cookie", userCookies).expect(200);

      expect(res.body).toHaveProperty("items");
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBeGreaterThanOrEqual(2);
      expect(res.body).toHaveProperty("nextCursor");
    });

    test("카테고리로 필터링하여 조회한다", async () => {
      const p1 = await prisma.product.create({
        data: {
          name: "카테고리A 상품",
          price: 1000,
          imageUrl: "https://example.com/c.jpg",
          linkUrl: "https://example.com/c",
          categoryId: childCategory.id,
          creatorId: testUser.id,
        },
      });
      const p2 = await prisma.product.create({
        data: {
          name: "카테고리B 상품",
          price: 2000,
          imageUrl: "https://example.com/d.jpg",
          linkUrl: "https://example.com/d",
          categoryId: anotherCategory.id,
          creatorId: testUser.id,
        },
      });

      const resA = await request(app)
        .get(`/products?category=${childCategory.id}`)
        .set("Cookie", userCookies)
        .expect(200);
      expect(resA.body.items.every((it: any) => it.categoryId === childCategory.id)).toBe(true);

      const resB = await request(app)
        .get(`/products?category=${anotherCategory.id}`)
        .set("Cookie", userCookies)
        .expect(200);
      expect(resB.body.items.every((it: any) => it.categoryId === anotherCategory.id)).toBe(true);
    });
  });

  describe("GET /products/:id", () => {
    test("상품 상세를 조회한다", async () => {
      const product = await prisma.product.create({
        data: {
          name: "상세 상품",
          price: 12345,
          imageUrl: "https://example.com/e.jpg",
          linkUrl: "https://example.com/e",
          categoryId: childCategory.id,
          creatorId: testUser.id,
        },
      });

      const res = await request(app).get(`/products/${product.id}`).set("Cookie", userCookies).expect(200);

      expect(res.body).toHaveProperty("id", product.id);
      expect(res.body).toHaveProperty("name", "상세 상품");
    });
  });

  describe("DELETE /products/:id", () => {
    test("본인이 등록한 상품을 삭제한다", async () => {
      const product = await prisma.product.create({
        data: {
          name: "삭제 대상",
          price: 9999,
          imageUrl: "https://example.com/f.jpg",
          linkUrl: "https://example.com/f",
          categoryId: childCategory.id,
          creatorId: testUser.id,
        },
      });

      await request(app).delete(`/products/${product.id}`).set("Cookie", userCookies).expect(204);

      const deleted = await prisma.product.findUnique({ where: { id: product.id } });
      expect(deleted?.deletedAt).not.toBeNull();
    });

    test("다른 사용자는 삭제할 수 없다", async () => {
      const product = await prisma.product.create({
        data: {
          name: "타인 상품",
          price: 8000,
          imageUrl: "https://example.com/g.jpg",
          linkUrl: "https://example.com/g",
          categoryId: childCategory.id,
          creatorId: testUser.id,
        },
      });

      await request(app).delete(`/products/${product.id}`).set("Cookie", otherCookies).expect(403);
    });
  });

  describe("GET /products/category", () => {
    test("카테고리 트리를 조회한다", async () => {
      const res = await request(app).get("/products/category").expect(200);

      expect(res.body).toHaveProperty("parentCategory");
      expect(Array.isArray(res.body.parentCategory)).toBe(true);
      const parent = res.body.parentCategory.find((c: any) => c.name === "음료");
      expect(parent).toBeTruthy();
      expect(res.body).toHaveProperty("childrenCategory");
      expect(res.body.childrenCategory["음료"]).toBeDefined();
    });
  });

  describe("GET /my/products", () => {
    test("내가 등록한 상품 목록을 조회한다", async () => {
      await prisma.product.createMany({
        data: [
          {
            name: "내상품1",
            price: 1000,
            imageUrl: "https://example.com/h.jpg",
            linkUrl: "https://example.com/h",
            categoryId: childCategory.id,
            creatorId: testUser.id,
          },
          {
            name: "내상품2",
            price: 2000,
            imageUrl: "https://example.com/i.jpg",
            linkUrl: "https://example.com/i",
            categoryId: childCategory.id,
            creatorId: testUser.id,
          },
          {
            name: "다른사람상품",
            price: 3000,
            imageUrl: "https://example.com/j.jpg",
            linkUrl: "https://example.com/j",
            categoryId: childCategory.id,
            creatorId: otherUser.id,
          },
        ],
      });

      const res = await request(app).get("/my/products").set("Cookie", userCookies).expect(200);

      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.every((p: any) => p.creatorId === testUser.id)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.currentPage).toBe(1);
    });
  });
});
