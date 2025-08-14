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
    // 테스트용 요청 객체 생성 - 실제 컨트롤러 구조와 일치
    mockRequest = {
      params: { userId: "user123" },
      body: {
        companyName: "새로운 회사명",
        passwordData: {
          newPassword: "newPassword123",
          newPasswordConfirm: "newPassword123",
        },
      },
      user: {
        id: "super-admin-id",
        email: "superadmin@test.com",
        name: "Super Admin",
        role: "SUPER_ADMIN",
        company: { id: 1, name: "Test Company" }, // company.id로 접근
        createdAt: new Date(),
        updatedAt: new Date(),
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
        message: "회사 정보가 업데이트 되었습니다",
        company: {
          id: 1,
          name: "새로운 회사명",
        },
      };
      mockCompanyService.updateCompanyInfo.mockResolvedValue(serviceResponse);

      // Act
      await companyController.updateCompanyInfo(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockCompanyService.updateCompanyInfo).toHaveBeenCalledWith(
        "user123",
        mockRequest.body,
        mockRequest.user,
        1, // company.id 값
      );
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

    it("회사명만 업데이트하는 경우", async () => {
      // Arrange
      mockRequest.body = { companyName: "새로운 회사명" }; // passwordData 없음
      const serviceResponse = {
        message: "회사 정보가 업데이트 되었습니다",
        company: {
          id: 1,
          name: "새로운 회사명",
        },
      };
      mockCompanyService.updateCompanyInfo.mockResolvedValue(serviceResponse);

      // Act
      await companyController.updateCompanyInfo(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockCompanyService.updateCompanyInfo).toHaveBeenCalledWith(
        "user123",
        { companyName: "새로운 회사명" },
        mockRequest.user,
        1,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("비밀번호만 업데이트하는 경우", async () => {
      // Arrange
      mockRequest.body = {
        passwordData: {
          newPassword: "newPassword123",
          newPasswordConfirm: "newPassword123",
        },
      }; // companyName 없음
      const serviceResponse = {
        message: "회사 정보가 업데이트 되었습니다",
        company: {
          id: 1,
          name: "Test Company",
        },
      };
      mockCompanyService.updateCompanyInfo.mockResolvedValue(serviceResponse);

      // Act
      await companyController.updateCompanyInfo(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockCompanyService.updateCompanyInfo).toHaveBeenCalledWith(
        "user123",
        {
          passwordData: {
            newPassword: "newPassword123",
            newPasswordConfirm: "newPassword123",
          },
        },
        mockRequest.user,
        1,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
