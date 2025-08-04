import userService from "./user.service";
import userRepository from "../repositories/user.repository";
import bcrypt from "bcrypt";

// Mock dependencies
jest.mock("../repositories/user.repository");
jest.mock("bcrypt");

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("UserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserInfo", () => {
    it("should get user info for regular user", async () => {
      // Arrange
      const userId = "user123";
      const currentUser = {
        id: "user123",
        email: "user@test.com",
        name: "Test User",
        role: "USER",
        company: { name: "Test Company" }
      } as any;

      // Act
      const result = await userService.getUserInfo(userId, currentUser);

      // Assert
      expect(result).toEqual({
        message: "일반 유저 정보 조회 완료",
        user: {
          company: { name: "Test Company" },
          name: "Test User",
          email: "user@test.com"
        }
      });
    });

    it("should get user info for admin user", async () => {
      // Arrange
      const userId = "admin123";
      const currentUser = {
        id: "admin123",
        email: "admin@test.com",
        name: "Admin User",
        role: "ADMIN",
        company: { name: "Test Company" }
      } as any;

      // Act
      const result = await userService.getUserInfo(userId, currentUser);

      // Assert
      expect(result).toEqual({
        message: "관리자/최고 관리자 정보 조회 완료",
        user: {
          company: { name: "Test Company" },
          role: "ADMIN",
          name: "Admin User",
          email: "admin@test.com"
        }
      });
    });

    it("should throw error when user tries to access another user's info", async () => {
      // Arrange
      const userId = "other123";
      const currentUser = {
        id: "user123",
        email: "user@test.com",
        name: "Test User",
        role: "USER"
      } as any;

      // Act & Assert
      await expect(userService.getUserInfo(userId, currentUser)).rejects.toThrow("자기 자신의 정보만 조회할 수 있습니다.");
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      // Arrange
      const userId = "user123";
      const currentUser = { id: "admin123", role: "ADMIN" } as any;
      
      const mockUser = { id: "user123", name: "Test User" };
      const mockResult = { message: "사용자가 성공적으로 삭제되었습니다." };

      mockUserRepository.findActiveUserById.mockResolvedValue(mockUser as any);
      (mockUserRepository as any).deleteUser.mockResolvedValue(mockResult);

      // Act
      const result = await userService.deleteUser(userId, currentUser);

      // Assert
      expect(mockUserRepository.findActiveUserById).toHaveBeenCalledWith("user123");
      expect(result).toEqual(mockResult);
    });

    it("should throw error when user not found", async () => {
      // Arrange
      const userId = "nonexistent";
      const currentUser = { id: "admin123", role: "ADMIN" } as any;

      mockUserRepository.findActiveUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.deleteUser(userId, currentUser)).rejects.toThrow("유저가 존재하지 않습니다");
    });
  });

  describe("getMe", () => {
    it("should get current user info", async () => {
      // Arrange
      const userId = "user123";
      const mockUser = {
        id: "user123",
        email: "user@test.com",
        name: "Test User",
        role: "USER",
        company: { id: 1, name: "Test Company" }
      };

      (mockUserRepository as any).findUserWithCompanyById.mockResolvedValue(mockUser);
      (mockUserRepository as any).getCartItemCountByUserId.mockResolvedValue(0);

      // Act
      const result = await userService.getMe(userId);

      // Assert
      expect((mockUserRepository as any).findUserWithCompanyById).toHaveBeenCalledWith("user123");
      expect(result).toEqual({
        ...mockUser,
        cartItemCount: 0
      });
    });
  });
});
