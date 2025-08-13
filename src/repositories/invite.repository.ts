import prisma from "../config/prisma";
import { Role } from "@prisma/client";
import { TCreateInviteRequestDto } from "../dtos/invite.dto";

const findInviteById = async (inviteId: string) => {
  return prisma.invite.findUnique({ where: { id: inviteId } });
};

const findCompanyById = async (companyId: number) => {
  return prisma.company.findUnique({ where: { id: companyId } });
};

const findUserById = async (userId: string) => {
  return prisma.user.findUnique({ where: { id: userId } });
};

const findActiveInviteByEmail = async (email: string) => {
  return prisma.invite.findFirst({
    where: {
      email: email,
      isUsed: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
};

const deleteInviteById = async (inviteId: string) => {
  return prisma.invite.delete({
    where: { id: inviteId },
  });
};

const createInvite = async (data: {
  email: string;
  name: string;
  role: Role;
  companyId: number;
  invitedById: string;
  expiresAt: Date;
  isUsed: boolean;
}) => {
  return prisma.$transaction(async (prismaTransaction) => {
    return prismaTransaction.invite.create({
      data,
    });
  });
};

export default { 
  findInviteById, 
  findCompanyById, 
  findUserById, 
  findActiveInviteByEmail, 
  deleteInviteById, 
  createInvite 
};
