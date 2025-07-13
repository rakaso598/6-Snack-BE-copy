import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";
import type { ProductQueryOptions, CreatorQueryOptions, CreateProductParams, ProductSaleCount } from "../types/product.types";

// 전체 상품을 조건에 맞게 조회
const findManyAll = async (options: ProductQueryOptions = {}, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;
  const { sort = "latest", category, take = 9, cursor } = options;

  if (sort === "popular") {
    return findManyAllPopular({ category, take });
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
if (["popular", "latest-with-sales", "low-with-sales", "high-with-sales"].includes(sort)) {
  return findManyAllPopular({ category, take, skip: cursor ? 1 : 0, sort });
}

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
const findManyAllPopular = async ({
  category,
  skip = 0,
  take = 6,
  sort = "popular",
}: ProductQueryOptions & { sort?: "popular" | "latest" | "low" | "high" }) => {
  const orderByClause = (() => {
    if (sort === "popular") {
      return Prisma.sql`ORDER BY COUNT(oi."id") DESC`;
    } else if (sort === "low") {
      return Prisma.sql`ORDER BY p."price" ASC`;
    } else if (sort === "high") {
      return Prisma.sql`ORDER BY p."price" DESC`;
    } else {
      return Prisma.sql`ORDER BY p."createdAt" DESC`; // default: latest
    }
  })();

  const result = await prisma.$queryRaw<ProductSaleCount[]>`
    SELECT 
      p.*,
      COUNT(oi."id")::int AS "saleCount"
    FROM "Product" p
    LEFT JOIN "CartItem" ci ON p."id" = ci."productId"
    LEFT JOIN "OrderedItem" oi ON ci."id" = oi."cartId"
    WHERE p."deletedAt" IS NULL
    ${category ? Prisma.sql`AND p."categoryId" = ${category}` : Prisma.empty}
    GROUP BY p."id"
    ${orderByClause}
    LIMIT ${take} OFFSET ${skip}
  `;
  return result;
};


// ID로 단일 상품 조회
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
const findManyCreator = ({ creatorId, skip = 0, take = 10 }: CreatorQueryOptions, tx?: Prisma.TransactionClient) => {
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
  return await client.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: true,
      creator: true,
    },
  });
};

const update = async (id: number, data: Partial<CreateProductParams>, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;
  const product = await client.product.findFirst({
    where: { id, deletedAt: null },
  });

  if (!product) throw new Error("상품이 존재하지 않거나 이미 삭제되었습니다.");

  return await client.product.update({
    where: { id },
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
