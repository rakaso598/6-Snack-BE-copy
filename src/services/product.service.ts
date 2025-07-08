import { CreateProductDto } from "../dtos/product.dto";
import productRepository from "../repositories/product.repository";

type SortOption = "latest" | "popular" | "low" | "high";

interface ProductQueryOptions {
  sort?: SortOption;
  category?: number;
  skip?: number;
  take?: number;
  creatorId?: string;
  cursor?: { id: number } | undefined
  orderBy?: any;
  
}

// const createProduct = async (dto: CreateProductDto) => {
//   const product = await productRepository.create(dto);
//   return productRepository.findById(product.id);
// };

// const getProductById = async (id: number) => {
//   return productRepository.findById(id);
// };


const getAllProducts = async (options: ProductQueryOptions) => {
  return productRepository.findManyAll(options);
};


// const getProductsByCreator = async ({ creatorId, skip = 0, take = 10 }: ProductQueryOptions) => {
//   return productRepository.findManyByCreator({ creatorId: creatorId!, skip, take });
// };
export default {
  // createProduct,
  // getProductById,
  getAllProducts,
  // getProductsByCreator
};
