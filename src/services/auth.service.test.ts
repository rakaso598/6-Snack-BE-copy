import { AuthService } from "./auth.service";
import authRepository from "../repositories/auth.repository";
import bcrypt from "bcrypt";

// Mock dependencies
jest.mock("../repositories/auth.repository");
jest.mock("bcrypt");

const mockAuthRepository = authRepository as jest.Mocked<typeof authRepository>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signUpSuperAdmin", () => {
    it("should sign up super admin successfully", async () => {
      // Arrange
      const signUpData = {
        email: "admin@test.com",
        name: "Admin",
        password: "password123",
        companyName: "Test Company",
        bizNumber: "123-45-67890"
      };

      mockAuthRepository.findUserByEmailWithCompany.mockResolvedValue(null);
      mockAuthRepository.findCompanyByBizNumber.mockResolvedValue(null);
      (mockBcrypt.hash as any).mockResolvedValue("hashedPassword");
      
      const mockResult = {
        user: { id: "1", email: "admin@test.com", role: "SUPER_ADMIN" },
        company: { id: 1, name: "Test Company" },
        monthlyBudget: { id: 1, year: 2025, month: 8 }
      };
      
      mockAuthRepository.runInTransaction.mockResolvedValue(mockResult as any);

      // Act
      const result = await AuthService.signUpSuperAdmin(signUpData);

      // Assert
      expect(mockAuthRepository.findUserByEmailWithCompany).toHaveBeenCalledWith("admin@test.com");
      expect(mockAuthRepository.findCompanyByBizNumber).toHaveBeenCalledWith("123-45-67890");
      expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(result).toEqual(mockResult);
    });

    it("should throw error when email already exists", async () => {
      // Arrange
      const signUpData = {
        email: "admin@test.com",
        name: "Admin",
        password: "password123",
        companyName: "Test Company",
        bizNumber: "123-45-67890"
      };

      mockAuthRepository.findUserByEmailWithCompany.mockResolvedValue({ id: "1" } as any);

      // Act & Assert
      await expect(AuthService.signUpSuperAdmin(signUpData)).rejects.toThrow("이미 등록된 이메일입니다.");
    });
  });

  describe("signUpViaInvite", () => {
    it("should sign up via invite successfully", async () => {
      // Arrange
      const inviteId = "invite123";
      const password = "password123";
      
      const mockInvite = {
        id: "invite123",
        email: "user@test.com",
        name: "User",
        isUsed: false,
        expiresAt: new Date(Date.now() + 86400000) // 1 day from now
      };
      
      const mockUser = { id: "1", email: "user@test.com", name: "User" };

      mockAuthRepository.findInviteById.mockResolvedValue(mockInvite as any);
      mockAuthRepository.findUserByEmailWithCompany.mockResolvedValue(null);
      (mockBcrypt.hash as any).mockResolvedValue("hashedPassword");
      mockAuthRepository.runInTransaction.mockResolvedValue(mockUser as any);

      // Act
      const result = await AuthService.signUpViaInvite(inviteId, password);

      // Assert
      expect(mockAuthRepository.findInviteById).toHaveBeenCalledWith("invite123");
      expect(mockBcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(result).toEqual(mockUser);
    });

    it("should throw error when invite not found", async () => {
      // Arrange
      mockAuthRepository.findInviteById.mockResolvedValue(null);

      // Act & Assert
      await expect(AuthService.signUpViaInvite("invalid", "password")).rejects.toThrow("유효하지 않은 초대 링크입니다.");
    });
  });
});
