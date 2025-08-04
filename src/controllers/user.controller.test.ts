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
    it("유저 정보 조회가 성공적으로 완료", async () => {
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
    it("현재 유저 정보 조회가 성공적으로 완료", async () => {
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
    it("유저 권한 수정이 성공적으로 완료", async () => {
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

    it("유저 권한 수정 시 유저가 존재하지 않으면 에러를 처리한다", async () => {
      // Arrange
      mockRequest.params = { userId: "nonexistent" };
      mockRequest.body = { role: "ADMIN" };

      const error = new Error("유저가 존재하지 않습니다");
      mockUserService.updateRole.mockRejectedValue(error);

      // Act
      await userController.updateRole(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteUser", () => {
    it("유저 삭제가 성공적으로 완료", async () => {
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

  describe("updatePassword", () => {
    it("유저 비밀번호 수정이 성공적으로 완료", async () => {
      // Arrange
      mockRequest.params = { userId: "user123" };
      mockRequest.body = {
        newPassword: "newPassword123",
        newPasswordConfirm: "newPassword123",
      };

      const serviceResponse = {
        message: "비밀번호가 성공적으로 변경되었습니다.",
      };
      mockUserService.updatePassword.mockResolvedValue(serviceResponse);

      // Act
      await userController.updatePassword(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockUserService.updatePassword).toHaveBeenCalledWith("user123", mockRequest.body, mockRequest.user);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(serviceResponse);
    });

    it("유저 비밀번호 수정 시 에러를 처리", async () => {
      // Arrange
      mockRequest.params = { userId: "user123" };
      mockRequest.body = {
        newPassword: "newPassword123",
        newPasswordConfirm: "newPassword123",
      };

      const error = new Error("자기 자신의 비밀번호만 변경할 수 있습니다.");
      mockUserService.updatePassword.mockRejectedValue(error);

      // Act
      await userController.updatePassword(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getUsersByCompany", () => {
    it("회사 유저 목록 조회가 성공적으로 완료", async () => {
      // Arrange
      mockRequest.query = { name: "test", cursor: "user123", limit: "5" };

      const serviceResponse = {
        message: "회사 유저 목록 조회 완료",
        users: [
          { id: "user1", email: "user1@test.com", name: "User1", role: "ADMIN" as const },
          { id: "user2", email: "user2@test.com", name: "User2", role: "USER" as const },
        ],
        pagination: {
          hasNext: false,
          hasPrev: false,
        },
      };
      mockUserService.getUsersByCompany.mockResolvedValue(serviceResponse);

      // Act
      await userController.getUsersByCompany(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockUserService.getUsersByCompany).toHaveBeenCalledWith(mockRequest.user, mockRequest.query);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(serviceResponse);
    });

    it("회사 유저 목록 조회 시 에러를 처리", async () => {
      // Arrange
      mockRequest.query = {};

      const error = new Error("회사 정보를 찾을 수 없습니다");
      mockUserService.getUsersByCompany.mockRejectedValue(error);

      // Act
      await userController.getUsersByCompany(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
