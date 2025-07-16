import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";
import type { TProductQueryOptions, TCreatorQueryOptions, TCreateProductParams } from "../types/product.types";

// 전체 상품을 조건에 맞게 조회
const findManyAll = async (options: TProductQueryOptions = {}, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;
  const { sort = "latest", category, take = 9, cursor } = options;

  const categoryIds = await getCategory(category, client);

  if (sort === "popular") {
    return findManyAllPopular({
      categoryIds,
      take,
      skip: cursor ? 1 : 0,
    });
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "high") orderBy = { price: "desc" };
  if (sort === "low") orderBy = { price: "asc" };

  return client.product.findMany({
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
};

// 인기 상품 전용 정렬
const findManyAllPopular = async ({
  categoryIds,
  skip = 0,
  take = 6,
}: {
  categoryIds?: number[];
  skip?: number;
  take?: number;
}) => {
  return prisma.product.findMany({
    where: {
      deletedAt: null,
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    },
    include: {
      category: true,
      creator: true,
      _count: { select: { orderedItems: true } },
    },
    orderBy: {
      orderedItems: { _count: "desc" },
    },
    skip,
    take,
  });
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
const create = (data: TCreateProductParams, tx?: Prisma.TransactionClient) => {
  const client = tx || prisma;
  return client.product.create({ data });
};

// 특정 사용자의 상품 목록 조회
const findManyCreator = ({ creatorId, skip = 0, take = 10 }: TCreatorQueryOptions, tx?: Prisma.TransactionClient) => {
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


export default {
  create,
  findById,
  findManyAll,
  findManyCreator,
  countCreator,
  findProductById,
  update,
  softDeleteById,
  findAllCategories
};
