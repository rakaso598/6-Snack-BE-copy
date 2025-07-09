import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";
import type { ProductQueryOptions, CreatorQueryOptions, CreateProductParams } from "../types/product.types";

// 전체 상품을 조건에 맞게 조회
const findManyAll = async (
  options: ProductQueryOptions = {},
  tx?: Prisma.TransactionClient
) => {
  const client = tx || prisma;
  const { sort = "latest", category, take = 9, cursor } = options;

  if (sort === "popular") {
    return findManyAllPopular({ category, take });
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "low") orderBy = { price: "asc" };
  else if (sort === "high") orderBy = { price: "desc" };

  return client.product.findMany({
    where: {
      ...(category && { categoryId: category }),
    },
    orderBy,
    take,
    cursor,
    skip: cursor ? 1 : 0,
    include: {
      category: true,
      creator: true,
    },
  });
};

// 인기 상품
const findManyAllPopular = async ({
  category,
  skip = 0,
  take = 6,
}: ProductQueryOptions) => {
  const result = await prisma.$queryRaw`
    SELECT 
      p.*,
      COUNT(oi."id")::int AS "saleCount"
    FROM "Product" p
    LEFT JOIN "CartItem" ci ON p."id" = ci."productId"
    LEFT JOIN "OrderedItem" oi ON ci."id" = oi."cartId"
    ${category ? Prisma.sql`WHERE p."categoryId" = ${category}` : Prisma.empty}
    GROUP BY p."id"
    ORDER BY COUNT(oi."id") DESC
    LIMIT ${take} OFFSET ${skip}
  `;
  return result;
};

// ID로 단일 상품 조회, **deletedAt이 null**인 활성 상품만 조회
const findById = (id: number) => {
  return prisma.product.findUnique({
    where: { id, deletedAt: null },
    include: {
      category: true,
      creator: true,
    },
  });
};

// 새로운 상품 생성
const create = (data: CreateProductParams) => {
  return prisma.product.create({ data });
};
// 특정 사용자의 상품 목록 조회, **deletedAt이 null**인 활성 상품만
const findManyCreator = ({ creatorId, skip = 0, take = 10 }: CreatorQueryOptions) => {
  return prisma.product.findMany({
    where: { creatorId, deletedAt: null},
    skip,
    take,
    include: {
      category: true,
      creator: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// 특정 사용자 상품 총 개수 조회
const countCreator = (creatorId: string) => {
  return prisma.product.count({
    where: { creatorId, deletedAt: null },
  });
};


export const findProductById = async (id: number) => {
  return await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      creator: true,
      
    },
  });
};

export default {
  create,
  findById,
  findManyAll,
  findManyCreator,
  countCreator,
  findProductById
};
