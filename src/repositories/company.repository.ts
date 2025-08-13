import prisma from "../config/prisma";

const findCompanyById = async (id: number) => {
  return await prisma.company.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      bizNumber: true,
    },
  });
};

const updateCompanyName = async (companyId: number, newName: string) => {
  return await prisma.company.update({
    where: { id: companyId },
    data: {
      name: newName,
    },
    select: {
      id: true,
      name: true,
      bizNumber: true,
    },
  });
};

export default { findCompanyById, updateCompanyName };
