import { Request, Response, NextFunction } from "express";
import inviteController from "./invite.controller";
import inviteService from "../services/invite.service";

// Mock invite service
jest.mock("../services/invite.service");
const mockInviteService = inviteService as jest.Mocked<typeof inviteService>;

describe("InviteController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("getInviteInfo", () => {
    it("should get invite info successfully", async () => {
      // Arrange
      mockRequest.params = { inviteId: "invite123" };
      
      const mockInviteInfo = {
        id: "invite123",
        email: "user@test.com",
        name: "Test User",
        role: "ADMIN",
        companyId: 1
      };
      
      mockInviteService.getInviteInfo.mockResolvedValue(mockInviteInfo as any);

      // Act
      await inviteController.getInviteInfo(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockInviteService.getInviteInfo).toHaveBeenCalledWith("invite123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockInviteInfo);
    });

    it("should handle invite not found", async () => {
      // Arrange
      mockRequest.params = { inviteId: "nonexistent" };
      
      const error = new Error("Invite not found");
      mockInviteService.getInviteInfo.mockRejectedValue(error);

      // Act
      await inviteController.getInviteInfo(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
