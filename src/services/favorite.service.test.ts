import favoriteService from "./favorite.service";
import favoriteRepository from "../repositories/favorite.repository";
import { BadRequestError } from "../types/error";

jest.mock("../repositories/favorite.repository");

describe("favoriteService", () => {
  const mockUserId = "user-1";
  const mockProductId = 42;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFavorites", () => {
    test("찜 목록과 메타정보를 반환한다", async () => {
      const mockFavorites = [
        { id: 1, product: { id: 101, name: "상품1" } },
        { id: 2, product: { id: 102, name: "상품2" } },
      ];
      const mockTotalCount = 10;
      const params = { cursor: undefined, limit: 2 };

      (favoriteRepository.getFavorites as jest.Mock).mockResolvedValue(mockFavorites);
      (favoriteRepository.getFavoritesTotalCount as jest.Mock).mockResolvedValue(mockTotalCount);

      const result = await favoriteService.getFavorites(mockUserId, params);

      expect(favoriteRepository.getFavorites).toHaveBeenCalledWith(mockUserId, params);
      expect(favoriteRepository.getFavoritesTotalCount).toHaveBeenCalledWith(mockUserId);

      expect(result.favorites).toEqual([
        { id: 1, product: { id: 101, name: "상품1" } },
        { id: 2, product: { id: 102, name: "상품2" } },
      ]);

      expect(result.meta).toEqual({
        totalCount: mockTotalCount,
        itemsPerPage: params.limit,
        totalPages: Math.ceil(mockTotalCount / params.limit),
        nextCursor: 2,
      });
    });

    test("nextCursor가 undefined인 경우", async () => {
      const mockFavorites = [{ id: 1, product: { id: 101, name: "상품1" } }];
      const mockTotalCount = 1;
      const params = { cursor: undefined, limit: 2 };

      (favoriteRepository.getFavorites as jest.Mock).mockResolvedValue(mockFavorites);
      (favoriteRepository.getFavoritesTotalCount as jest.Mock).mockResolvedValue(mockTotalCount);

      const result = await favoriteService.getFavorites(mockUserId, params);

      expect(result.meta.nextCursor).toBeUndefined();
    });
  });

  describe("createFavorite", () => {
    test("이미 찜한 상품이면 에러를 던진다", async () => {
      (favoriteRepository.getFavorite as jest.Mock).mockResolvedValue({
        id: 1,
        userId: mockUserId,
        productId: mockProductId,
      });

      await expect(favoriteService.createFavorite(mockUserId, mockProductId)).rejects.toThrow(BadRequestError);

      expect(favoriteRepository.getFavorite).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(favoriteRepository.createFavorite).not.toHaveBeenCalled();
    });

    test("찜하지 않은 상품이면 새 찜을 생성한다", async () => {
      const mockCreatedFavorite = { id: 2, userId: mockUserId, productId: mockProductId };
      (favoriteRepository.getFavorite as jest.Mock).mockResolvedValue(null);
      (favoriteRepository.createFavorite as jest.Mock).mockResolvedValue(mockCreatedFavorite);

      const result = await favoriteService.createFavorite(mockUserId, mockProductId);

      expect(favoriteRepository.getFavorite).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(favoriteRepository.createFavorite).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(result).toEqual(mockCreatedFavorite);
    });
  });

  describe("deleteFavorite", () => {
    test("찜이 없으면 에러를 던진다", async () => {
      (favoriteRepository.getFavorite as jest.Mock).mockResolvedValue(null);

      await expect(favoriteService.deleteFavorite(mockUserId, mockProductId)).rejects.toThrow(BadRequestError);

      expect(favoriteRepository.getFavorite).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(favoriteRepository.deleteFavorite).not.toHaveBeenCalled();
    });

    test("찜이 있으면 찜 해제를 수행한다", async () => {
      (favoriteRepository.getFavorite as jest.Mock).mockResolvedValue({
        id: 1,
        userId: mockUserId,
        productId: mockProductId,
      });
      (favoriteRepository.deleteFavorite as jest.Mock).mockResolvedValue(undefined);

      await favoriteService.deleteFavorite(mockUserId, mockProductId);

      expect(favoriteRepository.getFavorite).toHaveBeenCalledWith(mockUserId, mockProductId);
      expect(favoriteRepository.deleteFavorite).toHaveBeenCalledWith(mockUserId, mockProductId);
    });
  });
});
