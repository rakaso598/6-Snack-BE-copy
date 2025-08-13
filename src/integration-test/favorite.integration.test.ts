import request from "supertest";
import express, { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";

// authenticateToken 미들웨어를 모킹해서 항상 인증된 상태라고 가정
jest.mock("../middlewares/jwtAuth.middleware", () => {
  return jest.fn((req: Request, res: Response, next: NextFunction) => {
    req.user = {
      id: "user-1",
      email: "test@example.com",
      name: "테스트유저",
      password: "hashedPassword",
      companyId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      hashedRefreshToken: null,
      role: "USER",
      company: { id: 1, name: "TestCompany", createdAt: new Date(), updatedAt: new Date(), bizNumber: "1234567890" },
    };
    next();
  });
});

// favoriteController 모킹
jest.mock("../controllers/favorite.controller", () => ({
  getFavorites: jest.fn((req: Request, res: Response) => {
    return res.status(200).json({
      favorites: [],
      meta: { totalCount: 0, itemsPerPage: 6, totalPages: 0 },
    });
  }),
  createFavorite: jest.fn((req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const productId = parseInt(req.params.productId);
    if (productId === 7) {
      // 이미 찜한 상품
      return res.status(400).json({
        path: `/favorites/${productId}`,
        method: "POST",
        message: "이미 찜한 상품입니다.",
        date: new Date().toISOString(),
      });
    }
    if (productId > 100) {
      // 유효하지 않은 상품 id 에러 시뮬레이션
      const err = new Error(`Foreign key constraint violated on Favorite_productId_fkey`);
      return next(err);
    }
    return res.status(200).json({
      id: 9,
      userId,
      productId,
      createdAt: new Date().toISOString(),
    });
  }),
  deleteFavorite: jest.fn((req: Request, res: Response) => {
    const productId = parseInt(req.params.productId);
    if (productId === 7) {
      // 찜 해제 이미 된 상품
      return res.status(400).json({
        path: `/favorites/${productId}`,
        method: "DELETE",
        message: "이미 찜 해제한 상품입니다.",
        date: new Date().toISOString(),
      });
    }
    return res.status(204).send();
  }),
}));

import favoriteRouter from "../routes/favorite.route";

describe("Favorites API", () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use("/favorites", favoriteRouter);

    // 에러 핸들러
    const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
      if (err.message.includes("Foreign key constraint")) {
        res.status(400).json({
          path: req.originalUrl,
          method: req.method,
          message: err.message,
          date: new Date().toISOString(),
        });
        return;
      }
      res.status(500).json({ message: "서버 오류" });
      return;
    };

    app.use(errorHandler);
  });

  test("GET /favorites - 찜 목록 조회", async () => {
    const res = await request(app).get("/favorites").set("Cookie", ["accessToken=fake-access-token"]);
    expect(res.status).toBe(200);
    expect(res.body.favorites).toBeDefined();
  });

  test("POST /favorites/:productId - 찜 추가 성공", async () => {
    const res = await request(app).post("/favorites/5").set("Cookie", ["accessToken=fake-access-token"]);
    expect(res.status).toBe(200);
    expect(res.body.productId).toBe(5);
  });

  test("POST /favorites/:productId - 이미 찜한 상품", async () => {
    const res = await request(app).post("/favorites/7").set("Cookie", ["accessToken=fake-access-token"]);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("이미 찜한 상품입니다.");
  });

  test("POST /favorites/:productId - 유효하지 않은 상품 ID", async () => {
    const res = await request(app).post("/favorites/101").set("Cookie", ["accessToken=fake-access-token"]);
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Foreign key constraint");
  });

  test("DELETE /favorites/:productId - 찜 해제 성공", async () => {
    const res = await request(app).delete("/favorites/5").set("Cookie", ["accessToken=fake-access-token"]);
    expect(res.status).toBe(204);
  });

  test("DELETE /favorites/:productId - 이미 찜 해제한 상품", async () => {
    const res = await request(app).delete("/favorites/7").set("Cookie", ["accessToken=fake-access-token"]);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("이미 찜 해제한 상품입니다.");
  });
});
