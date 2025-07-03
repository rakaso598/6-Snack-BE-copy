import prisma from '../utils/prisma';

class UserRepository {
  constructor(private prismaClient = prisma) { }

  async createUser(data: any) {
    return this.prismaClient.user.create({ data });
  }

  async getAllUsers() {
    return this.prismaClient.user.findMany();
  }

  async getUserById(id: string) {
    return this.prismaClient.user.findUnique({ where: { id } });
  }

  async updateUser(id: string, data: any) {
    return this.prismaClient.user.update({ where: { id }, data });
  }

  async deleteUser(id: string) {
    return this.prismaClient.user.delete({ where: { id } });
  }
}

export default UserRepository;
