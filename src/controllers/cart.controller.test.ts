import { Request, Response, NextFunction } from "express";
import cartController from "../controllers/cart.controller";
import cartService from "../services/cart.service";
import budgetService from "../services/budget.service";
import { TToggleParamsDto, TToggleCheckDto } from "../dtos/cart.dto";
import { TUpdateQuantityDto } from "../dtos/cart.dto";

jest.mock("../services/cart.service");
jest.mock("../services/budget.service");

const mockCartService = cartService as jest.Mocked<typeof cartService>;
const mockBudgetService = budgetService as jest.Mocked<typeof budgetService>;

describe("CartController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      user: {
        id: "user1",
        name: "테스트 유저",
        email: "user@example.com",
        password: "hashed_password",
        companyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        hashedRefreshToken: null,
        role: "USER",
        company: {
          id: 1,
          name: "테스트 회사",
          bizNumber: "123-45-67890",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("getMyCart", () => {
    it("should return cart for user", async () => {
      const mockCart = [
        {
          id: 1,
          userId: "user1",
          productId: 1,
          quantity: 1,
          isChecked: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          product: {
            id: 1,
            name: "테스트 상품",
            price: 1000,
            imageUrl: "https://example.com/image.png",
            linkUrl: "https://example.com",
            cumulativeSales: 0,
            categoryId: 1,
            creatorId: "user1",
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        },
      ];

      mockCartService.getMyCart.mockResolvedValue(mockCart);

      await cartController.getMyCart(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ cart: mockCart });
    });

    it("should return cart and budget for non-user", async () => {
      mockRequest.user!.role = "ADMIN";
      const mockCart = [
        {
          id: 1,
          userId: "user1",
          productId: 1,
          quantity: 1,
          isChecked: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          product: {
            id: 1,
            name: "테스트 상품",
            price: 1000,
            imageUrl: "https://example.com/image.png",
            linkUrl: "https://example.com",
            cumulativeSales: 0,
            categoryId: 1,
            creatorId: "user1",
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        },
      ];

      const mockBudget = {
        id: 1,
        companyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        month: "2025-08",
        year: "2025",
        monthlyBudget: 1500,
        currentMonthBudget: 1000,
        currentMonthExpense: 500,
        previousMonthBudget: 900,
        previousMonthExpense: 450,
        currentYearTotalExpense: 7000,
        previousYearTotalExpense: 6000,
      };

      mockCartService.getMyCart.mockResolvedValue(mockCart);
      mockBudgetService.getMonthlyBudget.mockResolvedValue(mockBudget);

      await cartController.getMyCart(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        cart: mockCart,
        budget: mockBudget,
      });
    });
  });

  describe("addToCart", () => {
    it("should add item to cart", async () => {
      mockRequest.body = { productId: 1, quantity: 2 };
      const result = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        userId: "user1",
        productId: 1,
        quantity: 2,
        isChecked: true,
      };
      mockCartService.addToCart.mockResolvedValue(result);

      await cartController.addToCart(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(result);
    });
  });

  describe("deleteSelectedItems", () => {
    it("should delete selected cart items", async () => {
      mockRequest.body = { cartItemIds: [1, 2, 3] };

      await cartController.deleteSelectedItems(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockCartService.deleteSelectedItems).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe("toggleCheckItem", () => {
    it("should toggle item check", async () => {
      mockRequest.params = { item: "1" };
      mockRequest.body = { isChecked: true };

      const typedRequest = mockRequest as Request<TToggleParamsDto, {}, TToggleCheckDto>;
      await cartController.toggleCheckItem(typedRequest, mockResponse as Response, mockNext);

      expect(mockCartService.toggleCheckCartItem).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe("toggleAllItems", () => {
    it("should toggle all items", async () => {
      mockRequest.body = { isChecked: true };

      await cartController.toggleAllItems(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockCartService.toggleAllCheck).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe("updateQuantity", () => {
    it("should update item quantity", async () => {
      const mockRequest = {
        params: { item: "1" },
        body: { quantity: 3 },
      } as Request<{ item: string }, {}, TUpdateQuantityDto>;

      mockRequest.params = { item: "1" };
      mockRequest.body = { quantity: 3 };

      await cartController.updateQuantity(mockRequest, mockResponse as Response, mockNext);

      expect(mockCartService.updateQuantity).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe("deleteCartItem", () => {
    it("should delete a single cart item", async () => {
      mockRequest.params = { item: "1" };

      await cartController.deleteCartItem(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockCartService.deleteCartItem).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });
});
