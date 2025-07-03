import ProductRepository from "../repositories/productRepository";

class ProductService {
  constructor(private productRepository = new ProductRepository()) { }

  async createProduct(data: any) {
    return this.productRepository.createProduct(data);
  }

  async getAllProducts() {
    return this.productRepository.getAllProducts();
  }

  async getProductById(id: number) {
    return this.productRepository.getProductById(id);
  }

  async updateProduct(id: number, data: any) {
    return this.productRepository.updateProduct(id, data);
  }

  async deleteProduct(id: number) {
    return this.productRepository.deleteProduct(id);
  }
}

export default ProductService;