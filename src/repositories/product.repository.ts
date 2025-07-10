import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";
import type { ProductQueryOptions, CreatorQueryOptions, CreateProductParams } from "../types/product.types";

// 전체 상품을 조건에 맞게 조회
const findManyAll = async (options: ProductQueryOptions = {}, tx?: Prisma.TransactionClient) => {
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
      deletedAt: null,
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
const findManyAllPopular = async ({ category, skip = 0, take = 6 }: ProductQueryOptions) => {
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
const findById = (id: number, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;
  return client.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: true,
      creator: true,
    },
  });
};

// 새로운 상품 생성
const create = (data: CreateProductParams, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;
  return client.product.create({ data });
};

// 특정 사용자의 상품 목록 조회
const findManyCreator = (
  { creatorId, skip = 0, take = 10 }: CreatorQueryOptions,
  tx?: Prisma.TransactionClient
) => {
  const client = tx || prisma;

  return client.product.findMany({
    where: { creatorId, deletedAt: null },
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
const countCreator = (creatorId: string, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;
  return client.product.count({
    where: { creatorId, deletedAt: null },
  });
};

const findProductById = async (id: number, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;
  return await client.product.findUnique({
    where: { id, deletedAt: null },
    include: {
      category: true,
      creator: true,
    },
  });
};

const update = async (id: number, data: Partial<CreateProductParams>, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;
  return await client.product.update({
    where: { id, deletedAt: null },
    data,
  });
};

const softDeleteById = async (id: number, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;
  return await client.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
export default {
  create,
  findById,
  findManyAll,
  findManyCreator,
  countCreator,
  findProductById,
  update,
  softDeleteById,
};
