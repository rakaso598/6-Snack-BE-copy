import companyService from "./company.service";
import companyRepository from "../repositories/company.repository";

// Mock company repository
jest.mock("../repositories/company.repository");
const mockCompanyRepository = companyRepository as jest.Mocked<typeof companyRepository>;

describe("회사 서비스", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateCompanyInfo", () => {
    test("회사 정보 수정이 성공적으로 완료", async () => {
      // Arrange
      const userId = "user123";
      const companyData = {
        companyName: "새로운 회사명",
        passwordData: {
          newPassword: "newPassword123",
          newPasswordConfirm: "newPassword123",
        },
      };
      const currentUser = { id: "super-admin-id", role: "SUPER_ADMIN" } as any;
      const mockUpdatedCompany = {
        id: 1,
        name: "새로운 회사명",
        bizNumber: "123-45-67890",
      };

      mockCompanyRepository.updateCompanyName.mockResolvedValue(mockUpdatedCompany as any);

      // Act
      const result = await companyService.updateCompanyInfo(userId, companyData, currentUser, 1);

      // Assert
      expect(mockCompanyRepository.updateCompanyName).toHaveBeenCalledWith(1, companyData.companyName);
      expect(result.message).toBe("회사 정보가 성공적으로 수정되었습니다.");
    });

    test("회사 정보 수정 시 에러 발생", async () => {
      // Arrange
      const userId = "user123";
      const companyData = {
        companyName: "새로운 회사명",
        passwordData: {
          newPassword: "newPassword123",
          newPasswordConfirm: "newPassword123",
        },
      };
      const currentUser = { id: "super-admin-id", role: "SUPER_ADMIN" } as any;

      mockCompanyRepository.updateCompanyName.mockRejectedValue(new Error("회사 정보 수정 실패"));

      // Act & Assert
      await expect(companyService.updateCompanyInfo(userId, companyData, currentUser, 1)).rejects.toThrow(
        "회사 정보 수정 실패",
      );
    });
  });
});
