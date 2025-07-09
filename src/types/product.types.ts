export type SortOption = "latest" | "popular" | "low" | "high";

export type ProductQueryOptions = {
  sort?: SortOption;
  category?: number;
  skip?: number;
  take?: number;
  creatorId?: string;
  cursor?: { id: number } | undefined;
  orderBy?: any;
};

export type CreatorQueryOptions = {
  creatorId: string;
  skip?: number;
  take?: number;
};
