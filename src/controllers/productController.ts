import ProductService from "../services/productService";

class ProductController {
  constructor(private productService = new ProductService()) { }

  async createProduct(req: any, res: any) {
    try {
      const product = await this.productService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: (error instanceof Error ? error.message : "Unknown error") });
    }
  }

  async getAllProducts(req: any, res: any) {
    try {
      const products = await this.productService.getAllProducts();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: (error instanceof Error ? error.message : "Unknown error") });
    }
  }

  async getProductById(req: any, res: any) {
    try {
      const product = await this.productService.getProductById(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ error: (error instanceof Error ? error.message : "Unknown error") });
    }
  }

  async updateProduct(req: any, res: any) {
    try {
      const updatedProduct = await this.productService.updateProduct(Number(req.params.id), req.body);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json(updatedProduct);
    } catch (error) {
      res.status(500).json({ error: (error instanceof Error ? error.message : "Unknown error") });
    }
  }

  async deleteProduct(req: any, res: any) {
    try {
      const deleted = await this.productService.deleteProduct(Number(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: (error instanceof Error ? error.message : "Unknown error") });
    }
  }
}

export default ProductController;