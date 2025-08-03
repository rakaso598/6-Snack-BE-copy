import { Prisma } from "@prisma/client";
import productRepository from "../repositories/product.repository";
import { AuthenticationError, NotFoundError, ServerError, ValidationError } from "../types/error";
import {
  TProductQueryOptions,
  TCreateProductParams,
  TCategoryMap,
  TParentCategory,
  TChildCategory,
} from "../types/product.types";

// 상품 등록
const createProduct = async (input: TCreateProductParams, tx?: Prisma.TransactionClient) => {
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

  const product = await productRepository.create(input, tx);
  if (!product) {
    throw new ServerError("상품 생성에 실패했습니다.");
  }

  return productRepository.findById(product.id, undefined, tx);
};

// 상품 ID로 단일 상품 조회
const getProductById = async (id: number, userId?: string, tx?: Prisma.TransactionClient) => {
  const product = await productRepository.findProductById(id, userId, tx);

  if (!product) {
    throw new NotFoundError("상품을 찾을 수 없습니다.");
  }

  return product;
};

// 옵션에 따라 여러 상품 목록 조회
const getProductList = async (options: TProductQueryOptions, tx?: Prisma.TransactionClient) => {
  return productRepository.findManyAll(options, tx);
};

// 특정 사용자가 등록한 상품 목록 조회
const getProductsCreator = async (
  options: Pick<TProductQueryOptions, "creatorId" | "skip" | "take"> & {
    orderBy?: { createdAt?: "asc" | "desc"; price?: "asc" | "desc" };
    userId?: string;
  },
  tx?: Prisma.TransactionClient,
) => {
  if (!options.creatorId) {
    throw new ValidationError("creatorId는 필수입니다.");
  }

  const [items, totalCount] = await Promise.all([
    productRepository.findManyCreator(
      {
        creatorId: options.creatorId,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy,
        userId: options.userId,
      },
      tx,
    ),
    productRepository.countCreator(options.creatorId, tx),
  ]);

  return { items, totalCount };
};

// 특정 사용자가 등록한 상품 개수 조회
const countProducts = async (creatorId: string, tx?: Prisma.TransactionClient) => {
  return productRepository.countCreator(creatorId, tx);
};

const updateProduct = async (
  productId: number,
  creatorId: string,
  input: Partial<TCreateProductParams>,
  tx?: Prisma.TransactionClient,
) => {
  const existing = await productRepository.findProductById(productId, undefined, tx);

  if (!existing) {
    throw new NotFoundError("상품을 찾을 수 없습니다.");
  }

  if (existing.creatorId !== creatorId) {
    throw new AuthenticationError("상품을 수정할 권한이 없습니다.");
  }

  const updated = await productRepository.update(productId, input, tx);
  if (!updated) {
    throw new ServerError("상품 수정에 실패했습니다.");
  }

  return productRepository.findProductById(productId, undefined, tx);
};

const deleteProduct = async (id: number, tx?: Prisma.TransactionClient) => {
  return await productRepository.softDeleteById(id, tx);
};

// 카테고리
const getCategory = async (): Promise<TCategoryMap> => {
  const categories = await productRepository.findAllCategories();

  const parentCategory: TParentCategory[] = [];
  const childrenCategory: Record<string, TChildCategory[]> = {};

  for (const category of categories) {
    if (category.parentId == null) {
      parentCategory.push({ id: category.id, name: category.name });
    }
  }

  for (const parent of parentCategory) {
    const children: TChildCategory[] = categories
      .filter((c) => c.parentId === parent.id)
      .map((c) => ({ id: c.id, name: c.name }));

    childrenCategory[parent.name] = children;
  }

  return { parentCategory, childrenCategory };
};

export default {
  createProduct,
  getProductById,
  getProductList,
  getProductsCreator,
  countProducts,
  updateProduct,
  deleteProduct,
  getCategory,
};
