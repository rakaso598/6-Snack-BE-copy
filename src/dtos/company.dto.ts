export type TUpdateCompanyInfoDto = {
  companyName?: string;
  passwordData?: { newPassword: string; newPasswordConfirm: string };
};

export type TUpdateCompanyInfoResponseDto = {
  message: string;
  company: {
    id: number;
    name: string;
  };
};
