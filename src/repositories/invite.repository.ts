import prisma from "../config/prisma";

const findInviteById = async (inviteId: string) => {
  return prisma.invite.findUnique({ where: { id: inviteId } });
};

export default { findInviteById };
