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
    it("일반 유저 정보 조회가 성공적으로 완료", async () => {
      // Arrange
      const userId = "user123";
      const currentUser = {
        id: "user123",
        email: "user@test.com",
        name: "Test User",
        role: "USER",
        company: { name: "Test Company" },
      } as any;

      // Act
      const result = await userService.getUserInfo(userId, currentUser);

      // Assert
      expect(result).toEqual({
        message: "일반 유저 정보 조회 완료",
        user: {
          company: { name: "Test Company" },
          name: "Test User",
          email: "user@test.com",
        },
      });
    });

    it("관리자 유저 정보 조회가 성공적으로 완료", async () => {
      // Arrange
      const userId = "admin123";
      const currentUser = {
        id: "admin123",
        email: "admin@test.com",
        name: "Admin User",
        role: "ADMIN",
        company: { name: "Test Company" },
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
          email: "admin@test.com",
        },
      });
    });

    it("다른 유저 정보 접근 시 에러 발생", async () => {
      // Arrange
      const userId = "other123";
      const currentUser = {
        id: "user123",
        email: "user@test.com",
        name: "Test User",
        role: "USER",
      } as any;

      // Act & Assert
      await expect(userService.getUserInfo(userId, currentUser)).rejects.toThrow(
        "자기 자신의 정보만 조회할 수 있습니다.",
      );
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      // Arrange
      const userId = "user123";
      const currentUser = { id: "admin123", role: "SUPER_ADMIN" } as any;

      const mockUser = { id: "user123", name: "Test User" };
      const expectedResult = { message: "사용자가 성공적으로 삭제되었습니다." };

      mockUserRepository.findActiveUserById.mockResolvedValue(mockUser as any);
      mockUserRepository.deleteUser.mockResolvedValue(mockUser as any);

      // Act
      const result = await userService.deleteUser(userId, currentUser);

      // Assert
      expect(mockUserRepository.findActiveUserById).toHaveBeenCalledWith("user123");
      expect(mockUserRepository.deleteUser).toHaveBeenCalledWith("user123");
      expect(result).toEqual(expectedResult);
    });

    it("유저가 존재하지 않으면 예외 발생", async () => {
      // Arrange
      const userId = "nonexistent";
      const currentUser = { id: "admin123", role: "SUPER_ADMIN" } as any;

      mockUserRepository.findActiveUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.deleteUser(userId, currentUser)).rejects.toThrow("유저가 존재하지 않습니다");
    });

    it("최고관리자가 자신을 삭제하려고 하면 예외 발생", async () => {
      // Arrange
      const userId = "admin123";
      const currentUser = { id: "admin123", role: "SUPER_ADMIN" } as any;

      mockUserRepository.findActiveUserById.mockResolvedValue(currentUser as any);

      // Act & Assert
      await expect(userService.deleteUser(userId, currentUser)).rejects.toThrow(
        "최고 관리자는 자기 자신을 삭제할 수 없습니다.",
      );
    });
  });

  describe("getMe", () => {
    it("현재 유저 정보 조회가 성공적으로 완료", async () => {
      // Arrange
      const userId = "user123";
      const mockUser = {
        id: "user123",
        email: "user@test.com",
        name: "Test User",
        role: "USER",
        company: { id: 1, name: "Test Company" },
      };

      (mockUserRepository as any).findUserWithCompanyById.mockResolvedValue(mockUser);
      (mockUserRepository as any).getCartItemCountByUserId.mockResolvedValue(0);

      // Act
      const result = await userService.getMe(userId);

      // Assert
      expect((mockUserRepository as any).findUserWithCompanyById).toHaveBeenCalledWith("user123");
      expect(result).toEqual({
        ...mockUser,
        cartItemCount: 0,
      });
    });
  });

  describe("updateRole", () => {
    test("유저 권한 수정이 성공적으로 완료", async () => {
      // Arrange
      const userId = "user123";
      const newRole = "ADMIN";
      const currentUser = { id: "admin123", role: "SUPER_ADMIN" } as any;
      const mockUser = { id: "user123", role: "ADMIN" };

      mockUserRepository.findActiveUserById.mockResolvedValue(mockUser as any);
      mockUserRepository.updateUserRole.mockResolvedValue(mockUser as any);

      // Act
      const result = await userService.updateRole(userId, newRole, currentUser);

      // Assert
      expect(mockUserRepository.findActiveUserById).toHaveBeenCalledWith("user123");
      expect(mockUserRepository.updateUserRole).toHaveBeenCalledWith("user123", "ADMIN");
      expect(result.message).toBe("사용자 권한이 성공적으로 변경되었습니다.");
    });

    test("수정할 유저가 존재하지 않으면 예외 발생", async () => {
      // Arrange
      const currentUser = { id: "admin123", role: "SUPER_ADMIN" } as any;
      mockUserRepository.findActiveUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.updateRole("nonexistent", "ADMIN", currentUser)).rejects.toThrow(
        "유저가 존재하지 않습니다",
      );
    });
  });

  describe("updatePassword", () => {
    test("유저 비밀번호 수정이 성공적으로 완료", async () => {
      // Arrange
      const userId = "user123";
      const passwordData = {
        newPassword: "newPassword123",
        newPasswordConfirm: "newPassword123",
      };
      const currentUser = { id: "user123", role: "USER" } as any;

      mockUserRepository.updatePassword.mockResolvedValue(currentUser as any);

      // Act
      const result = await userService.updatePassword(userId, passwordData, currentUser);

      // Assert
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith("user123", expect.any(String));
      expect(result.message).toBe("비밀번호가 성공적으로 변경되었습니다.");
    });

    test("다른 유저의 비밀번호를 수정하려고 하면 예외 발생", async () => {
      // Arrange
      const userId = "other123";
      const passwordData = {
        newPassword: "newPassword123",
        newPasswordConfirm: "newPassword123",
      };
      const currentUser = { id: "user123", role: "USER" } as any;

      // Act & Assert
      await expect(userService.updatePassword(userId, passwordData, currentUser)).rejects.toThrow(
        "자기 자신의 비밀번호만 변경할 수 있습니다.",
      );
    });
  });

  describe("getUsersByCompany", () => {
    test("회사 유저 목록 조회가 성공적으로 완료", async () => {
      // Arrange
      const currentUser = { 
        id: "super-admin-id", 
        role: "SUPER_ADMIN",
        companyId: 1 
      } as any;
      const query = { name: "test", cursor: "user123", limit: 5 };
      const mockUsers = [
        { id: "user1", email: "user1@test.com", name: "User1", role: "ADMIN" },
        { id: "user2", email: "user2@test.com", name: "User2", role: "USER" }
      ];
      const mockPagination = {
        hasNext: false,
        hasPrev: false
      };

      mockUserRepository.findUsersByCompanyId.mockResolvedValue({
        users: mockUsers,
        pagination: mockPagination
      } as any);

      // Act
      const result = await userService.getUsersByCompany(currentUser, query);

      // Assert
      expect(mockUserRepository.findUsersByCompanyId).toHaveBeenCalledWith(1, "test", "user123", 5);
      expect(result.message).toBe("회사 유저 목록 조회 완료");
      expect(result.users).toEqual(mockUsers);
      expect(result.pagination).toEqual(mockPagination);
    });

    test("쿼리 파라미터 없이 회사 유저 목록 조회가 성공적으로 완료", async () => {
      // Arrange
      const currentUser = { 
        id: "super-admin-id", 
        role: "SUPER_ADMIN",
        companyId: 1 
      } as any;
      const query = {};
      const mockUsers = [
        { id: "user1", email: "user1@test.com", name: "User1", role: "ADMIN" }
      ];
      const mockPagination = {
        hasNext: false,
        hasPrev: false
      };

      mockUserRepository.findUsersByCompanyId.mockResolvedValue({
        users: mockUsers,
        pagination: mockPagination
      } as any);

      // Act
      const result = await userService.getUsersByCompany(currentUser, query);

      // Assert
      expect(mockUserRepository.findUsersByCompanyId).toHaveBeenCalledWith(1, undefined, undefined, 5);
      expect(result.message).toBe("회사 유저 목록 조회 완료");
    });
  });
});
