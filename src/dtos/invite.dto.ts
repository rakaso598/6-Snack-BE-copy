import { Role } from "@prisma/client";

export type TInviteIdParamsDto = {
  inviteId: string;
};

export type TCreateInviteRequestDto = {
  email: string;
  name: string;
  role: Role;
  companyId: number;
  invitedById: string;
  expiresInDays?: number;
};

export type TCreateInviteResponseDto = {
  message: string;
  inviteId: string;
  inviteLink: string;
  expiresAt: Date;
  emailSent: boolean;
  emailError?: string;
};

export type TGetInviteInfoResponseDto = {
  id: string;
  name: string;
  email: string;
  role: Role;
  expiresAt: string;
  isUsed: boolean;
};
