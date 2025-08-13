// favorite.controller.test.ts
import favoriteController from "./favorite.controller";
import favoriteService from "../services/favorite.service";
import { AuthenticationError, ValidationError } from "../types/error";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";

jest.mock("../services/favorite.service");

describe("favoriteController", () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = { user: { id: "user-1" }, query: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("getFavorites", () => {
    test("user가 없으면 AuthenticationError를 throw한다", async () => {
      req.user = undefined;

      await expect(favoriteController.getFavorites(req, res, next)).rejects.toThrow(AuthenticationError);
    });

    test("정상적으로 찜 목록을 조회한다", async () => {
      req.query = { cursor: "5", limit: "10" };
      const mockFavorites = { favorites: [], meta: {} };
      (favoriteService.getFavorites as jest.Mock).mockResolvedValue(mockFavorites);

      await favoriteController.getFavorites(req, res, next);

      expect(favoriteService.getFavorites).toHaveBeenCalledWith("user-1", { cursor: 5, limit: 10 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockFavorites);
    });

    test("limit 기본값 6 적용", async () => {
      req.query = {};
      const mockFavorites = { favorites: [], meta: {} };
      (favoriteService.getFavorites as jest.Mock).mockResolvedValue(mockFavorites);

      await favoriteController.getFavorites(req, res, next);

      expect(favoriteService.getFavorites).toHaveBeenCalledWith("user-1", { cursor: undefined, limit: 6 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockFavorites);
    });

    test("서비스 호출 중 에러 발생 시 에러를 throw 한다", async () => {
      const error = new Error("service error");
      (favoriteService.getFavorites as jest.Mock).mockRejectedValue(error);

      await expect(favoriteController.getFavorites(req, res, next)).rejects.toThrow(error);
    });
  });

  describe("createFavorite", () => {
    test("user가 없으면 AuthenticationError를 throw한다", async () => {
      req.user = undefined;
      req.params = { productId: "1" };

      await expect(favoriteController.createFavorite(req, res, next)).rejects.toThrow(AuthenticationError);
    });

    test("productId가 문자열 숫자면 정상 처리", async () => {
      req.params = { productId: "42" };
      const mockFavorite = { id: 1, userId: "user-1", productId: 42 };
      (favoriteService.createFavorite as jest.Mock).mockResolvedValue(mockFavorite);

      await favoriteController.createFavorite(req, res, next);

      expect(favoriteService.createFavorite).toHaveBeenCalledWith("user-1", 42);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockFavorite);
    });

    test("parseNumberOrThrow에서 에러 발생 시 에러를 throw한다", async () => {
      req.params = { productId: "abc" };

      // 강제로 parseNumberOrThrow에서 ValidationError 예외 발생시키기 위해 jest.spyOn 사용
      const parseSpy = jest.spyOn(require("../utils/parseNumberOrThrow"), "parseNumberOrThrow");
      parseSpy.mockImplementation(() => {
        throw new ValidationError("productId에는 숫자만 입력해주세요.");
      });

      await expect(favoriteController.createFavorite(req, res, next)).rejects.toThrow(ValidationError);

      parseSpy.mockRestore();
    });

    test("서비스 호출 중 에러 발생 시 에러를 throw 한다", async () => {
      req.params = { productId: "1" };
      const error = new Error("service error");
      (favoriteService.createFavorite as jest.Mock).mockRejectedValue(error);

      await expect(favoriteController.createFavorite(req, res, next)).rejects.toThrow(error);
    });
  });

  describe("deleteFavorite", () => {
    test("user가 없으면 AuthenticationError를 throw한다", async () => {
      req.user = undefined;
      req.params = { productId: "1" };

      await expect(favoriteController.deleteFavorite(req, res, next)).rejects.toThrow(AuthenticationError);
    });

    test("productId가 정상적으로 파싱되어 찜 해제를 수행", async () => {
      req.params = { productId: "10" };
      (favoriteService.deleteFavorite as jest.Mock).mockResolvedValue(undefined);

      await favoriteController.deleteFavorite(req, res, next);

      expect(favoriteService.deleteFavorite).toHaveBeenCalledWith("user-1", 10);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    test("parseNumberOrThrow에서 에러 발생 시 에러를 throw한다", async () => {
      req.params = { productId: "xyz" };
      const parseSpy = jest.spyOn(require("../utils/parseNumberOrThrow"), "parseNumberOrThrow");
      parseSpy.mockImplementation(() => {
        throw new ValidationError("productId에는 숫자만 입력해주세요.");
      });

      await expect(favoriteController.deleteFavorite(req, res, next)).rejects.toThrow(ValidationError);

      parseSpy.mockRestore();
    });

    test("서비스 호출 중 에러 발생 시 에러를 throw 한다", async () => {
      req.params = { productId: "1" };
      const error = new Error("service error");
      (favoriteService.deleteFavorite as jest.Mock).mockRejectedValue(error);

      await expect(favoriteController.deleteFavorite(req, res, next)).rejects.toThrow(error);
    });
  });
});
