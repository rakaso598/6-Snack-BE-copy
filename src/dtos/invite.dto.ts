export type TInviteIdParamsDto = {
  inviteId: string;
};

export type TGetInviteInfoResponseDto = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  expiresAt: string;
  isUsed: boolean;
};
