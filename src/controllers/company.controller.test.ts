import { Request, Response, NextFunction } from "express";
import companyController from "./company.controller";
import companyService from "../services/company.service";

// Mock company service
jest.mock("../services/company.service");
const mockCompanyService = companyService as jest.Mocked<typeof companyService>;

describe("회사 컨트롤러", () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: any;

  beforeEach(() => {
    // 테스트용 요청 객체 생성
    mockRequest = {
      params: { userId: "user123" },
      body: {
        companyName: "새로운 회사명",
        newPassword: "newPassword123",
        newPasswordConfirm: "newPassword123",
      },
      user: {
        id: "super-admin-id",
        email: "superadmin@test.com",
        name: "Super Admin",
        role: "SUPER_ADMIN",
        companyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        company: { name: "Test Company" },
      },
    };

    // 테스트용 응답 객체 생성
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // 테스트용 next 함수 생성
    mockNext = jest.fn();

    // 모든 mock 초기화
    jest.clearAllMocks();
  });

  describe("updateCompanyInfo", () => {
    it("회사 정보 수정이 성공적으로 완료", async () => {
      // Arrange
      const serviceResponse = {
        message: "회사 정보가 성공적으로 수정되었습니다.",
      };
      mockCompanyService.updateCompanyInfo.mockResolvedValue(serviceResponse);

      // Act
      await companyController.updateCompanyInfo(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockCompanyService.updateCompanyInfo).toHaveBeenCalledWith("user123", mockRequest.body, mockRequest.user);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(serviceResponse);
    });

    it("회사 정보 수정 시 에러를 처리", async () => {
      // Arrange
      const error = new Error("회사 정보 수정 실패");
      mockCompanyService.updateCompanyInfo.mockRejectedValue(error);

      // Act
      await companyController.updateCompanyInfo(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
