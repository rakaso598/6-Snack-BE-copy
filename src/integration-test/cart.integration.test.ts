import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import cartRouter from "../routes/cart.route";

// 1) 인증 미들웨어: 테스트에서만 '항상 로그인 상태'로 목킹
jest.mock("../middlewares/jwtAuth.middleware", () => {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as any).user = {
      id: "user-11",
      email: "han.backend@codeit.com",
      name: "테스트유저",
      role: "USER",
      companyId: 1,
    };
    next();
  };
});

// 2) 서비스 레이어 목킹: DB 의존 제거
jest.mock("../services/cart.service", () => ({
  __esModule: true,
  default: {
    getMyCart: jest.fn(),
    getCartItemById: jest.fn(),
    addToCart: jest.fn(),
    deleteSelectedItems: jest.fn(),
    deleteCartItem: jest.fn(),
    toggleCheckCartItem: jest.fn(),
    toggleAllCheck: jest.fn(),
    updateQuantity: jest.fn(),
  },
}));

jest.mock("../services/budget.service", () => ({
  __esModule: true,
  default: {
    getMonthlyBudget: jest.fn(),
  },
}));

// 타입 안전 핸들
import cartService from "../services/cart.service";

const svc = cartService as jest.Mocked<typeof cartService>;

// 테스트 앱 구성 (에러 핸들러 포함)
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/cart", cartRouter);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status ?? err.code ?? 500;
    res.status(status).json({ message: err.message ?? "error" });
  });
  return app;
}

describe("Cart API (logged-in forced, no DB)", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // 1. 내 장바구니 조회
  it("GET /cart?selected=true", async () => {
    const mockCart = [
      { id: 1, productId: 2, quantity: 6, isChecked: true, product: { id: 2, name: "빙그레", price: 2000 } },
    ] as any;
    svc.getMyCart.mockResolvedValueOnce(mockCart);

    const res = await request(app)
      .get("/cart")
      .query({ isChecked: "true" })
      .set("Authorization", "Bearer dummy")
      .expect(200);

    expect(svc.getMyCart).toHaveBeenCalledWith("user-11", true);
    expect(res.body).toEqual({ cart: mockCart });
  });

  // 2. 장바구니에 상품 추가
  it("POST /cart", async () => {
    const created = { id: 99, userId: "user-11", productId: 2, quantity: 6 };
    svc.addToCart.mockResolvedValueOnce(created as any);

    const res = await request(app)
      .post("/cart")
      .set("Authorization", "Bearer dummy")
      .send({ productId: 2, quantity: 6 })
      .expect(201);

    expect(svc.addToCart).toHaveBeenCalledWith("user-11", { productId: 2, quantity: 6 });
    expect(res.body).toEqual(created);
  });

  // 3. 장바구니 항목 일괄 삭제
  it("DELETE /cart (bulk)", async () => {
    svc.deleteSelectedItems.mockResolvedValueOnce({ count: 1 } as any);

    await request(app)
      .delete("/cart")
      .set("Authorization", "Bearer dummy")
      .send({ itemIds: [2] })
      .expect(204);

    expect(svc.deleteSelectedItems).toHaveBeenCalledWith("user-11", { itemIds: [2] });
  });

  // 4. 장바구니 개별 항목 삭제
  it("DELETE /cart/:item", async () => {
    svc.deleteCartItem.mockResolvedValueOnce(undefined as any);

    await request(app).delete("/cart/2").set("Authorization", "Bearer dummy").expect(204);

    expect(svc.deleteCartItem).toHaveBeenCalledWith("user-11", 2);
  });

  // 5. 장바구니 항목 체크 상태 변경
  it("PATCH /cart/:item/check", async () => {
    svc.toggleCheckCartItem.mockResolvedValueOnce(undefined as any);

    await request(app)
      .patch("/cart/2/check")
      .set("Authorization", "Bearer dummy")
      .send({ isChecked: true })
      .expect(204);

    expect(svc.toggleCheckCartItem).toHaveBeenCalledWith("user-11", 2, { isChecked: true });
  });

  // 6. 장바구니 전체 선택 / 해제
  it("PATCH /cart/check", async () => {
    svc.toggleAllCheck.mockResolvedValueOnce(undefined as any);

    await request(app).patch("/cart/check").set("Authorization", "Bearer dummy").send({ isChecked: true }).expect(204);

    expect(svc.toggleAllCheck).toHaveBeenCalledWith("user-11", true);
  });

  // 7. 장바구니 수량 선택
  it("PATCH /cart/:item/quantity", async () => {
    svc.updateQuantity.mockResolvedValueOnce(undefined as any);

    await request(app)
      .patch("/cart/45/quantity")
      .set("Authorization", "Bearer dummy")
      .send({ quantity: 4 })
      .expect(204);

    expect(svc.updateQuantity).toHaveBeenCalledWith("user-11", 45, 4);
  });
});
