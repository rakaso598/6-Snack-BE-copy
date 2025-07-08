import prisma from "../config/prisma";
import { CreateProductDto } from "../dtos/product.dto";
import { Prisma } from "@prisma/client";

type SortOption = "latest" | "popular" | "low" | "high";

interface ProductQueryOptions {
  sort?: SortOption;
  category?: number;
  skip?: number;
  take?: number;
}

const findManyAll = async (options: ProductQueryOptions = {}) => {
  const { sort = "latest", category, skip = 0, take = 6 } = options;

  if (sort === "popular") {
    return findManyAllPopular({ category, skip, take }); 
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };

  if (sort === "low") orderBy = { price: "asc" };
  else if (sort === "high") orderBy = { price: "desc" };

  return prisma.product.findMany({
    where: {
      ...(category && { categoryId: category }),
    },
    orderBy,
    skip,
    take,
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

const create = (dto: CreateProductDto) => {
  return prisma.product.create({ data: dto });
};

interface CreatorQueryOptions {
  creatorId: string;
  skip?: number;
  take?: number;
}

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
