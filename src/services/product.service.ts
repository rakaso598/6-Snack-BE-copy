import productRepository from "../repositories/product.repository";
import { AuthenticationError, ServerError, ValidationError } from "../types/error";
import { ProductQueryOptions, CreateProductParams } from "../types/product.types";

// 상품 등록
const createProduct = async (input: CreateProductParams) => {
  const { name, price, linkUrl, imageUrl, categoryId, creatorId } = input;

  const errors: Record<string, string> = {};

  if (!creatorId) {
    throw new AuthenticationError("로그인 정보가 필요합니다.");
  }

  if (!name || name.length < 2) {
    errors["name"] = "상품 이름은 필수 항목이며, 최소 2자 이상이어야 합니다.";
  }

  if (isNaN(price) || price <= 0) {
    errors["price"] = "가격은 0보다 커야 합니다.";
  }

  if (isNaN(categoryId)) {
    errors["categoryId"] = "유효하지 않은 카테고리 ID입니다.";
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError("요청 데이터가 유효하지 않습니다.", errors);
  }

  const product = await productRepository.create(input);
  if (!product) {
    throw new ServerError("상품 생성에 실패했습니다.");
  }

  return productRepository.findById(product.id);
};


const getProductById = async (id: number) => {
  return productRepository.findById(id);
};

const getProductList = async (options: ProductQueryOptions) => {
  return productRepository.findManyAll(options);
};

const getProductsByCreator = async (options: Pick<ProductQueryOptions, "creatorId" | "skip" | "take">) => {
  if (!options.creatorId) {
    throw new ValidationError("creatorId는 필수입니다.");
  }
  return productRepository.findManyByCreator({
    creatorId: options.creatorId,
    skip: options.skip,
    take: options.take,
  });
};

export default {
  createProduct,
  getProductById,
  getProductList,
  getProductsByCreator,
};
