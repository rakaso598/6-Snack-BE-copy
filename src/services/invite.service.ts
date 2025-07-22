import { TGetInviteInfoResponseDto } from "../dtos/invite.dto";
import inviteRepository from "../repositories/invite.repository";
import { NotFoundError } from "../types/error";

const getInviteInfo = async (inviteId: string): Promise<TGetInviteInfoResponseDto> => {
  const invite = await inviteRepository.findInviteById(inviteId);
  if (!invite) {
    throw new NotFoundError("초대 링크가 존재하지 않습니다.");
  }
  if (invite.role !== "USER" && invite.role !== "ADMIN") {
    throw new NotFoundError("유효하지 않은 초대 권한입니다.");
  }
  return {
    id: invite.id,
    name: invite.name,
    email: invite.email,
    expiresAt: invite.expiresAt.toISOString(),
    isUsed: invite.isUsed,
    role: invite.role,
  };
};

export default { getInviteInfo };
