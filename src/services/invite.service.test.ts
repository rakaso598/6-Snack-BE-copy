import inviteService from "./invite.service";
import inviteRepository from "../repositories/invite.repository";
import emailService from "./email.service";

// Mock dependencies
jest.mock("../repositories/invite.repository");
jest.mock("./email.service");

const mockInviteRepository = inviteRepository as jest.Mocked<typeof inviteRepository>;
const mockEmailService = emailService as jest.Mocked<typeof emailService>;

describe("InviteService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getInviteInfo", () => {
    it("should get invite info successfully", async () => {
      // Arrange
      const inviteId = "invite123";
      const mockInvite = {
        id: "invite123",
        name: "Test User",
        email: "user@test.com",
        expiresAt: new Date("2025-12-31"),
        isUsed: false,
        role: "USER"
      };

      mockInviteRepository.findInviteById.mockResolvedValue(mockInvite as any);

      // Act
      const result = await inviteService.getInviteInfo(inviteId);

      // Assert
      expect(mockInviteRepository.findInviteById).toHaveBeenCalledWith("invite123");
      expect(result).toEqual({
        id: "invite123",
        name: "Test User",
        email: "user@test.com",
        expiresAt: "2025-12-31T00:00:00.000Z",
        isUsed: false,
        role: "USER"
      });
    });

    it("should throw error when invite not found", async () => {
      // Arrange
      mockInviteRepository.findInviteById.mockResolvedValue(null);

      // Act & Assert
      await expect(inviteService.getInviteInfo("invalid")).rejects.toThrow("초대 링크가 존재하지 않습니다.");
    });

    it("should throw error for invalid role", async () => {
      // Arrange
      const mockInvite = {
        id: "invite123",
        role: "INVALID_ROLE"
      };

      mockInviteRepository.findInviteById.mockResolvedValue(mockInvite as any);

      // Act & Assert
      await expect(inviteService.getInviteInfo("invite123")).rejects.toThrow("유효하지 않은 초대 권한입니다.");
    });
  });

  describe("sendInviteEmail", () => {
    it("should send invite email successfully", async () => {
      // Arrange
      const email = "user@test.com";
      const name = "Test User";
      const inviteLink = "http://test.com/invite/123";
      const role = "USER";
      const expiresAt = new Date("2025-12-31");

      mockEmailService.generateInviteEmailTemplate.mockReturnValue("<html>Mock Template</html>");
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      // Act
      await inviteService.sendInviteEmail(email, name, inviteLink, role, expiresAt);

      // Assert
      expect(mockEmailService.generateInviteEmailTemplate).toHaveBeenCalledWith(name, inviteLink, role, expiresAt);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: email,
        subject: "[Snack] 회사 초대 - Test User님을 일반 사용자로 초대합니다",
        html: "<html>Mock Template</html>"
      });
    });
  });
});
