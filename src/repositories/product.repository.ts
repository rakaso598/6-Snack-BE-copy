import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";
import type { ProductQueryOptions, CreatorQueryOptions, CreateProductParams } from "../types/product.types";

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

const findById = (id: number) => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      creator: true,
    },
  });
};

const create = (data: CreateProductParams) => {
  return prisma.product.create({ data });
};

const findManyByCreator = ({ creatorId, skip = 0, take = 10 }: CreatorQueryOptions) => {
  return prisma.product.findMany({
    where: { creatorId },
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

export default {
  create,
  findById,
  findManyAll,
  findManyByCreator,
};
