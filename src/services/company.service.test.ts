import companyService from "./company.service";
import companyRepository from "../repositories/company.repository";
import userService from "./user.service";

// Mock repositories and services
jest.mock("../repositories/company.repository");
jest.mock("./user.service");
const mockCompanyRepository = companyRepository as jest.Mocked<typeof companyRepository>;
const mockUserService = userService as jest.Mocked<typeof userService>;

describe("회사 서비스", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateCompanyInfo", () => {
    test("회사명과 비밀번호 모두 업데이트 성공", async () => {
      // Arrange
      const userId = "user123";
      const companyData = {
        companyName: "새로운 회사명",
        passwordData: {
          newPassword: "newPassword123",
          newPasswordConfirm: "newPassword123",
        },
      };
      const currentUser = {
        id: "super-admin-id",
        role: "SUPER_ADMIN",
        company: { id: 1, name: "Test Company" },
      } as any;
      const mockUpdatedCompany = {
        id: 1,
        name: "새로운 회사명",
        bizNumber: "123-45-67890",
      };

      mockCompanyRepository.updateCompanyName.mockResolvedValue(mockUpdatedCompany as any);
      mockUserService.updatePassword.mockResolvedValue({ message: "비밀번호가 성공적으로 변경되었습니다." } as any);

      // Act
      const result = await companyService.updateCompanyInfo(userId, companyData, currentUser, 1);

      // Assert
      expect(mockCompanyRepository.updateCompanyName).toHaveBeenCalledWith(1, "새로운 회사명");
      expect(mockUserService.updatePassword).toHaveBeenCalledWith(
        userId,
        {
          newPassword: "newPassword123",
          newPasswordConfirm: "newPassword123",
        },
        currentUser,
      );
      expect(result.message).toBe("회사 정보가 업데이트 되었습니다");
      expect(result.company).toEqual({
        id: 1,
        name: "새로운 회사명",
      });
    });

    test("회사명만 업데이트 성공", async () => {
      // Arrange
      const userId = "user123";
      const companyData = {
        companyName: "새로운 회사명",
      };
      const currentUser = {
        id: "super-admin-id",
        role: "SUPER_ADMIN",
        company: { id: 1, name: "Test Company" },
      } as any;
      const mockUpdatedCompany = {
        id: 1,
        name: "새로운 회사명",
        bizNumber: "123-45-67890",
      };

      mockCompanyRepository.updateCompanyName.mockResolvedValue(mockUpdatedCompany as any);

      // Act
      const result = await companyService.updateCompanyInfo(userId, companyData, currentUser, 1);

      // Assert
      expect(mockCompanyRepository.updateCompanyName).toHaveBeenCalledWith(1, "새로운 회사명");
      expect(mockUserService.updatePassword).not.toHaveBeenCalled();
      expect(result.message).toBe("회사 정보가 업데이트 되었습니다");
      expect(result.company.name).toBe("새로운 회사명");
    });

    test("비밀번호만 업데이트 성공", async () => {
      // Arrange
      const userId = "user123";
      const companyData = {
        passwordData: {
          newPassword: "newPassword123",
          newPasswordConfirm: "newPassword123",
        },
      };
      const currentUser = {
        id: "super-admin-id",
        role: "SUPER_ADMIN",
        company: { id: 1, name: "Test Company" },
      } as any;
      const existingCompany = {
        id: 1,
        name: "Test Company",
        bizNumber: "123-45-67890",
      };

      mockCompanyRepository.findCompanyById.mockResolvedValue(existingCompany as any);
      mockUserService.updatePassword.mockResolvedValue({ message: "비밀번호가 성공적으로 변경되었습니다." } as any);

      // Act
      const result = await companyService.updateCompanyInfo(userId, companyData, currentUser, 1);

      // Assert
      expect(mockCompanyRepository.updateCompanyName).not.toHaveBeenCalled();
      expect(mockUserService.updatePassword).toHaveBeenCalledWith(
        userId,
        {
          newPassword: "newPassword123",
          newPasswordConfirm: "newPassword123",
        },
        currentUser,
      );
      expect(result.message).toBe("회사 정보가 업데이트 되었습니다");
      expect(result.company.name).toBe("Test Company"); // 기존 회사명 유지
    });

    test("회사명과 비밀번호 모두 없을 때 에러 발생", async () => {
      // Arrange
      const userId = "user123";
      const companyData = {};
      const currentUser = {
        id: "super-admin-id",
        role: "SUPER_ADMIN",
        company: { id: 1, name: "Test Company" },
      } as any;

      // Act & Assert
      await expect(companyService.updateCompanyInfo(userId, companyData, currentUser, 1)).rejects.toThrow(
        "최소 하나의 필드는 변경되어야 합니다.",
      );
    });

    test("회사 정보 수정 시 에러 발생", async () => {
      // Arrange
      const userId = "user123";
      const companyData = {
        companyName: "새로운 회사명",
      };
      const currentUser = {
        id: "super-admin-id",
        role: "SUPER_ADMIN",
        company: { id: 1, name: "Test Company" },
      } as any;

      mockCompanyRepository.updateCompanyName.mockRejectedValue(new Error("회사 정보 수정 실패"));

      // Act & Assert
      await expect(companyService.updateCompanyInfo(userId, companyData, currentUser, 1)).rejects.toThrow(
        "회사 정보 수정 실패",
      );
    });
  });
});
