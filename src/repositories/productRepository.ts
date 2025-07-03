import prisma from '../utils/prisma';

class ProductRepository {
  constructor(private prismaClient = prisma) { }

  async createProduct(data: any) {
    return this.prismaClient.product.create({ data });
  }

  async getAllProducts() {
    return this.prismaClient.product.findMany();
  }

  async getProductById(id: number) {
    return this.prismaClient.product.findUnique({ where: { id } });
  }

  async updateProduct(id: number, data: any) {
    return this.prismaClient.product.update({ where: { id }, data });
  }

  async deleteProduct(id: number) {
    return this.prismaClient.product.delete({ where: { id } });
  }
}

export default ProductRepository;
