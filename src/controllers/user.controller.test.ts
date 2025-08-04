import { Request, Response, NextFunction } from "express";
import userController from "./user.controller";
import userService from "../services/user.service";

// Mock user service
jest.mock("../services/user.service");
const mockUserService = userService as jest.Mocked<typeof userService>;

describe("UserController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      user: { id: "user123", email: "test@test.com", role: "ADMIN" } as any,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("getUserInfo", () => {
    it("should get user info successfully", async () => {
      // Arrange
      mockRequest.params = { userId: "user123" };

      const mockUserInfo = {
        id: "user123",
        email: "user@test.com",
        name: "Test User",
        role: "ADMIN",
      };

      mockUserService.getUserInfo.mockResolvedValue(mockUserInfo as any);

      // Act
      await userController.getUserInfo(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockUserService.getUserInfo).toHaveBeenCalledWith("user123", mockRequest.user);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUserInfo);
    });

    it("should handle user not found", async () => {
      // Arrange
      mockRequest.params = { userId: "nonexistent" };

      const error = new Error("User not found");
      mockUserService.getUserInfo.mockRejectedValue(error);

      // Act
      await userController.getUserInfo(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getMe", () => {
    it("should get current user info successfully", async () => {
      // Arrange
      const mockUserInfo = {
        id: "user123",
        email: "test@test.com",
        name: "Test User",
        role: "ADMIN",
      };

      mockUserService.getMe.mockResolvedValue(mockUserInfo as any);

      // Act
      await userController.getMe(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockUserService.getMe).toHaveBeenCalledWith("user123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ user: mockUserInfo });
    });

    it("should handle missing user", async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await userController.getMe(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("updateRole", () => {
    it("should update user role successfully", async () => {
      // Arrange
      mockRequest.params = { userId: "user123" };
      mockRequest.body = { role: "MANAGER" };

      const mockResult = { message: "사용자 권한이 성공적으로 변경되었습니다." };
      mockUserService.updateRole.mockResolvedValue(mockResult as any);

      // Act
      await userController.updateRole(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockUserService.updateRole).toHaveBeenCalledWith("user123", "MANAGER", mockRequest.user);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      // Arrange
      mockRequest.params = { userId: "user123" };

      const mockResult = { message: "사용자가 성공적으로 삭제되었습니다." };
      mockUserService.deleteUser.mockResolvedValue(mockResult as any);

      // Act
      await userController.deleteUser(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockUserService.deleteUser).toHaveBeenCalledWith("user123", mockRequest.user);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it("should handle user not found", async () => {
      // Arrange
      mockRequest.params = { userId: "nonexistent" };

      const error = new Error("유저가 존재하지 않습니다");
      mockUserService.deleteUser.mockRejectedValue(error);

      // Act
      await userController.deleteUser(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle super admin trying to delete themselves", async () => {
      // Arrange
      mockRequest.params = { userId: "user123" }; // 자기 자신을 삭제하려는 상황

      const error = new Error("최고 관리자는 자기 자신을 삭제할 수 없습니다.");
      mockUserService.deleteUser.mockRejectedValue(error);

      // Act
      await userController.deleteUser(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle internal server error", async () => {
      // Arrange
      mockRequest.params = { userId: "user123" };

      const error = new Error("데이터베이스 연결 실패");
      mockUserService.deleteUser.mockRejectedValue(error);

      // Act
      await userController.deleteUser(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
