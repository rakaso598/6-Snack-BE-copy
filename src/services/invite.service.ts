import { TGetInviteInfoResponseDto } from "../dtos/invite.dto";
import inviteRepository from "../repositories/invite.repository";
import { NotFoundError } from "../types/error";
import emailService from "./email.service";

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

const sendInviteEmail = async (
  email: string,
  name: string,
  inviteLink: string,
  role: string,
  expiresAt: Date
): Promise<void> => {
  const subject = `[Snack] 회사 초대 - ${name}님을 ${role === 'ADMIN' ? '관리자' : '일반 사용자'}로 초대합니다`;
  const html = emailService.generateInviteEmailTemplate(name, inviteLink, role, expiresAt);
  
  await emailService.sendEmail({
    to: email,
    subject,
    html,
  });
};

export default { getInviteInfo, sendInviteEmail };
