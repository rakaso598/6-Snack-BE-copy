export type TCurrentUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: number;
  createdAt: Date;
  updatedAt: Date;
  company?: {
    name: string;
  };
};
