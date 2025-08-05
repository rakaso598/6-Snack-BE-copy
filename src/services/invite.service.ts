import { TGetInviteInfoResponseDto, TCreateInviteRequestDto, TCreateInviteResponseDto } from "../dtos/invite.dto";
import inviteRepository from "../repositories/invite.repository";
import { NotFoundError, BadRequestError, ValidationError } from "../types/error";
import { Role } from "@prisma/client";
import emailService from "./email.service";

const getInviteInfo = async (inviteId: string): Promise<TGetInviteInfoResponseDto> => {
  const invite = await inviteRepository.findInviteById(inviteId);
  if (!invite) {
    throw new NotFoundError("초대 링크가 존재하지 않습니다.");
  }
  if (invite.role !== Role.USER && invite.role !== Role.ADMIN) {
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

const createInvite = async (
  data: TCreateInviteRequestDto,
  protocol: string,
  signupHost?: string
): Promise<TCreateInviteResponseDto> => {
  const { email, name, role, companyId, invitedById, expiresInDays } = data;

  // 입력값 검증
  if (!email || !name || !role || !companyId || !invitedById) {
    throw new BadRequestError("이메일, 이름, 역할, 회사 ID, 초대자 ID는 필수 입력값입니다.");
  }

  const validRoles = [Role.USER, Role.ADMIN, Role.SUPER_ADMIN];
  if (!validRoles.includes(role)) {
    throw new ValidationError(`유효하지 않은 역할입니다. 허용된 역할: ${validRoles.join(", ")}`);
  }

  // 회사 존재 여부 확인
  const existingCompany = await inviteRepository.findCompanyById(companyId);
  if (!existingCompany) {
    throw new NotFoundError("존재하지 않는 회사 ID입니다.");
  }

  // 초대자 존재 여부 확인
  const invitingUser = await inviteRepository.findUserById(invitedById);
  if (!invitingUser) {
    throw new NotFoundError("존재하지 않는 초대자 ID입니다.");
  }

  // 만료일 설정
  const days = expiresInDays && typeof expiresInDays === "number" ? expiresInDays : 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  // 기존 활성 초대 확인 및 삭제
  const existingActiveInvite = await inviteRepository.findActiveInviteByEmail(email);
  if (existingActiveInvite) {
    await inviteRepository.deleteInviteById(existingActiveInvite.id);
    console.log(`[기존 초대 삭제] 이메일: ${email}, 초대 ID: ${existingActiveInvite.id}`);
  }

  // 새 초대 생성
  const newInvite = await inviteRepository.createInvite({
    email,
    name,
    role,
    companyId,
    invitedById,
    expiresAt,
    isUsed: false,
  });

  const inviteLink = `${protocol}://${signupHost || "localhost:3000"}/signup/${newInvite.id}`;

  // 이메일 발송
  try {
    await sendInviteEmail(email, name, inviteLink, role, newInvite.expiresAt);
    console.log(`[초대 생성 및 이메일 발송 성공] 이메일: ${email}, 초대 ID: ${newInvite.id}`);
    return {
      message: "초대 링크가 성공적으로 생성되었고 이메일이 발송되었습니다.",
      inviteId: newInvite.id,
      inviteLink: inviteLink,
      expiresAt: newInvite.expiresAt,
      emailSent: true,
    };
  } catch (emailError) {
    console.error("[이메일 발송 실패]", emailError);
    return {
      message: "초대 링크가 생성되었지만 이메일 발송에 실패했습니다.",
      inviteId: newInvite.id,
      inviteLink: inviteLink,
      expiresAt: newInvite.expiresAt,
      emailSent: false,
      emailError: "이메일 발송에 실패했습니다.",
    };
  }
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

export default { getInviteInfo, createInvite, sendInviteEmail };
