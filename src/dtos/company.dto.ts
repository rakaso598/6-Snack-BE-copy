export type TUpdateCompanyInfoDto = {
  companyName?: string;
  passwordData?: { newPassword: string; newPasswordConfirm: string };
};

export type TUpdateCompanyNameResponseDto = {
  message: string;
  company: {
    id: number;
    name: string;
  };
};
