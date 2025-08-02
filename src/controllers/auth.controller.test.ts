import { Request, Response, NextFunction } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "../services/auth.service";

// Mock AuthService
jest.mock("../services/auth.service");
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe("AuthController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("signUpSuperAdmin", () => {
    it("should sign up super admin successfully", async () => {
      // Arrange
      mockRequest.body = {
        email: "admin@test.com",
        name: "Admin",
        password: "password123",
        confirmPassword: "password123",
        companyName: "Test Company",
        bizNumber: "123-45-67890"
      };

      const mockResult = {
        user: { id: 1, email: "admin@test.com", role: "SUPER_ADMIN" },
        company: { id: 1, name: "Test Company" },
        monthlyBudget: { id: 1, year: 2025, month: 8, currentMonthExpense: 0, currentMonthBudget: 0, monthlyBudget: 0 }
      };

      mockAuthService.signUpSuperAdmin.mockResolvedValue(mockResult as any);

      // Act
      await AuthController.signUpSuperAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "최고 관리자 회원가입이 성공적으로 등록되었습니다.",
        user: { id: 1, email: "admin@test.com", role: "SUPER_ADMIN" },
        company: { id: 1, name: "Test Company" },
        monthlyBudget: { id: 1, year: 2025, month: 8, currentMonthExpense: 0, currentMonthBudget: 0, monthlyBudget: 0 }
      });
    });

    it("should handle missing required fields", async () => {
      // Arrange
      mockRequest.body = { email: "admin@test.com" }; // Missing other fields

      // Act
      await AuthController.signUpSuperAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("signUpViaInvite", () => {
    it("should sign up via invite successfully", async () => {
      // Arrange
      mockRequest.params = { inviteId: "invite123" };
      mockRequest.body = { password: "password123", confirmPassword: "password123" };

      const mockUser = { id: 1, email: "user@test.com", name: "User", role: "ADMIN" };
      mockAuthService.signUpViaInvite.mockResolvedValue(mockUser as any);

      // Act
      await AuthController.signUpViaInvite(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "회원가입이 성공적으로 완료되었습니다.",
        user: { id: 1, email: "user@test.com", name: "User", role: "ADMIN" }
      });
    });

    it("should handle password mismatch", async () => {
      // Arrange
      mockRequest.params = { inviteId: "invite123" };
      mockRequest.body = { password: "password123", confirmPassword: "differentPassword" };

      // Act
      await AuthController.signUpViaInvite(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("login", () => {
    it("should login successfully", async () => {
      // Arrange
      mockRequest.body = { email: "user@test.com", password: "password123" };

      const mockResult = {
        user: { id: 1, email: "user@test.com", role: "ADMIN", company: { id: 1, name: "Test Company" } },
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token"
      };
      mockAuthService.login.mockResolvedValue(mockResult as any);

      // Act
      await AuthController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "로그인이 성공적으로 처리 되었습니다.",
        user: expect.any(Object)
      }));
    });

    it("should handle missing credentials", async () => {
      // Arrange
      mockRequest.body = { email: "user@test.com" }; // Missing password

      // Act
      await AuthController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
