import { Request, Response, NextFunction } from "express";
import authController from "./auth.controller";
import authService from "../services/auth.service";

// Mock AuthService
jest.mock("../services/auth.service");
const mockAuthService = authService as jest.Mocked<typeof authService>;

describe("AuthController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      cookies: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
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
      await authController.signUpSuperAdmin(mockRequest as Request, mockResponse as Response, mockNext);

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
      await authController.signUpSuperAdmin(mockRequest as Request, mockResponse as Response, mockNext);

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
      await authController.signUpViaInvite(mockRequest as Request, mockResponse as Response, mockNext);

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
      await authController.signUpViaInvite(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("login", () => {
    // it("should login successfully", async () => {
    //   // Arrange
    //   mockRequest.body = { email: "user@test.com", password: "password123" };

    //   const mockResult = {
    //     user: { id: 1, email: "user@test.com", role: "ADMIN", company: { id: 1, name: "Test Company" } },
    //     accessToken: "mock-access-token",
    //     refreshToken: "mock-refresh-token"
    //   };
    //   mockAuthService.login.mockResolvedValue(mockResult as any);

    //   // Act
    //   await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

    //   // Assert
    //   expect(mockResponse.status).toHaveBeenCalledWith(200);
    //   expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
    //     message: "로그인이 성공적으로 처리 되었습니다.",
    //     user: expect.any(Object)
    //   }));
    // });

    it("should handle missing credentials", async () => {
      // Arrange
      mockRequest.body = { email: "user@test.com" }; // Missing password

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      // Arrange
      mockRequest.user = { id: "user123", email: "user@test.com" } as any;

      mockAuthService.logout.mockResolvedValue(undefined);

      // Act
      await authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.logout).toHaveBeenCalledWith("user123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "성공적으로 로그아웃되었습니다."
      });
    });

    it("should handle unauthenticated user", async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("refreshToken", () => {
    it("should refresh token successfully", async () => {
      // Arrange
      mockRequest.cookies = { refreshToken: "valid-refresh-token" };

      const mockResult = {
        newAccessToken: "new-access-token",
        newRefreshToken: "new-refresh-token",
        user: { email: "user@test.com" }
      };

      mockAuthService.refreshAccessToken.mockResolvedValue(mockResult as any);

      // Act
      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuthService.refreshAccessToken).toHaveBeenCalledWith("valid-refresh-token");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "새로운 Access Token이 발급되었습니다."
      });
    });

    it("should handle missing refresh token", async () => {
      // Arrange
      mockRequest.cookies = {};

      // Act
      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
