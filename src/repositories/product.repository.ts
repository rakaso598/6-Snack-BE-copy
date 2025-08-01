import prisma from "../config/prisma";
import { Prisma, Product } from "@prisma/client";
import type {
  TProductQueryOptions,
  TCreatorQueryOptions,
  TCreateProductParams,
  TProductWithFavorite,
} from "../types/product.types";

// 사용자가 찜한 상품 ID 목록을 가져오는 함수
const getFavoritesForUser = async (userId: string, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;

  const favorites = await client.like.findMany({
    where: {
      userId: userId,
    },
    select: {
      productId: true,
    },
  });

  const productIds = favorites.map((favorite) => favorite.productId);

  return productIds;
};

// 전체 상품을 조건에 맞게 조회 (찜한 상품 여부 포함)
const findManyAll = async (
  options: TProductQueryOptions = {},
  tx?: Prisma.TransactionClient,
): Promise<TProductWithFavorite[]> => {
  const client = tx || prisma;
  const { sort = "latest", category, take = 9, cursor, userId } = options;

  const categoryIds = await getCategory(category, client);

  // 사용자가 찜한 상품 ID 목록 가져오기
  const favoriteProductIds = userId ? await getFavoritesForUser(userId, client) : [];

  if (sort === "popular") {
    return findManyAllPopular({
      categoryIds,
      take,
      skip: cursor ? 1 : 0,
      favoriteProductIds,
    });
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "high") orderBy = { price: "desc" };
  if (sort === "low") orderBy = { price: "asc" };

  const products = await client.product.findMany({
    where: {
      deletedAt: null,
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
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

  return products.map((product) => ({
    ...product,
    isFavorite: favoriteProductIds.includes(product.id),
  }));
};

// 인기 상품 전용 정렬 (찜한 상품 여부 포함)
const findManyAllPopular = async ({
  categoryIds,
  skip = 0,
  take = 6,
  favoriteProductIds = [],
}: {
  categoryIds?: number[];
  skip?: number;
  take?: number;
  favoriteProductIds?: number[];
}): Promise<TProductWithFavorite[]> => {
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    },
    include: {
      category: true,
      creator: true,
    },
    orderBy: {
      cumulativeSales: "desc",
    },
    skip,
    take,
  });

  return products.map((product) => ({
    ...product,
    isFavorite: favoriteProductIds.includes(product.id),
  }));
};

// 카테고리 + 하위 카테고리 ID 조회
const getCategory = async (
  category: number | undefined,
  client: Prisma.TransactionClient | typeof prisma,
): Promise<number[] | undefined> => {
  if (!category) return undefined;

  const subCategories = await client.category.findMany({
    where: { parentId: category },
    select: { id: true },
  });

  return [category, ...subCategories.map((c) => c.id)];
};

// ID로 단일 상품 조회 (찜한 상품 여부 포함)
const findById = async (
  id: number,
  userId?: string,
  tx?: Prisma.TransactionClient,
): Promise<TProductWithFavorite | null> => {
  const client = tx || prisma;

  const product = await client.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: true,
      creator: true,
    },
  });

  if (!product) return null;

  // 사용자가 찜한 상품인지 확인
  let isFavorite = false;
  if (userId) {
    const favorite = await client.like.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: id,
        },
      },
    });
    isFavorite = !!favorite;
  }

  return {
    ...product,
    isFavorite,
  };
};

// 새로운 상품 생성
const create = (data: TCreateProductParams, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;
  return client.product.create({ data });
};

// 특정 사용자의 상품 목록 조회 (찜한 상품 여부 포함)
const findManyCreator = async (
  {
    creatorId,
    skip = 0,
    take = 10,
    orderBy = { createdAt: "desc" },
    userId,
  }: TCreatorQueryOptions & { userId?: string },
  tx?: Prisma.TransactionClient,
): Promise<TProductWithFavorite[]> => {
  const client = tx || prisma;

  // 사용자가 찜한 상품 ID 목록 가져오기
  const favoriteProductIds = userId ? await getFavoritesForUser(userId, client) : [];

  const products = await client.product.findMany({
    where: { creatorId, deletedAt: null },
    skip,
    take,
    include: {
      category: true,
      creator: true,
    },
    orderBy,
  });

  return products.map((product) => ({
    ...product,
    isFavorite: favoriteProductIds.includes(product.id),
  }));
};

// 특정 사용자 상품 총 개수 조회
const countCreator = (creatorId: string, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;
  return client.product.count({
    where: { creatorId, deletedAt: null },
  });
};

const findProductById = async (
  id: number,
  userId?: string,
  tx?: Prisma.TransactionClient,
): Promise<TProductWithFavorite | null> => {
  const client = tx || prisma;

  const product = await client.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: {
        include: {
          parent: true,
        },
      },
      creator: true,
    },
  });

  if (!product) return null;

  // 사용자가 찜한 상품인지 확인
  let isFavorite = false;
  if (userId) {
    const favorite = await client.like.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: id,
        },
      },
    });
    isFavorite = !!favorite;
  }

  return {
    ...product,
    isFavorite,
  };
};
const update = async (id: number, data: Partial<TCreateProductParams>, tx?: Prisma.TransactionClient) => {
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

const findAllCategories = async () => {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
      parentId: true,
    },
  });
};

const updateCumulativeSales = async (productIds: number[], tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;

  return await client.product.updateMany({
    where: { id: { in: productIds } },
    data: { cumulativeSales: { increment: 1 } },
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
  findAllCategories,
  updateCumulativeSales,
};
