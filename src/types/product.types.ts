import { Product } from "@prisma/client";

export type TSortOption = "latest" | "popular" | "low" | "high";

// 상품 쿼리 옵션
export type TProductQueryOptions = {
  sort?: TSortOption;
  category?: number;
  skip?: number;
  take?: number;
  creatorId?: string;
  cursor?: { id: number } | undefined;
  orderBy?: any;
};

// 내부 확장 옵션
export type TExtendedProductQueryOptions = TProductQueryOptions & {
  categoryIds?: number[];
};

// 판매 수 포함된 상품
export type TProductSaleCount = Product & {
  saleCount: number;
};

// 크리에이터 관련 상품 쿼리
export type TCreatorQueryOptions = {
  creatorId: string;
  skip?: number;
  take?: number;
};

// 상품 생성 파라미터
export type TCreateProductParams = {
  name: string;
  price: number;
  linkUrl: string;
  imageUrl: string;
  categoryId: number;
  creatorId: string;
};

// 전체 카테고리 (DB 조회 시)
export type TCategory = {
  id: number;
  name: string;
  parentId: number | null;
};

// 대분류
export type TParentCategory = {
  id: number;
  name: string;
};

// 소분류
export type TChildCategory = {
  id: number;
  name: string;
};

// 대분류 + 소분류 트리 구조
export type TCategoryTreeNode = TParentCategory & {
  children: TChildCategory[];
};

// 프론트 UI용: 대분류 배열 + 이름 기반 소분류 맵
export type TCategoryMap = {
  parentCategories: TParentCategory[];
  childrenCategoryMap: Record<string, TChildCategory[]>;
};
