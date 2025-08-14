import productService from "./product.service";
import productRepository from "../repositories/product.repository";
import { AuthenticationError, NotFoundError, ValidationError } from "../types/error";

// Mock ProductRepository
jest.mock("../repositories/product.repository");
const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>;

// Mock Prisma
jest.mock("../config/prisma", () => ({
  $transaction: jest.fn((callback) => callback({})),
}));

describe("ProductService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createProduct", () => {
    const validInput = {
      name: "테스트 상품",
      price: 10000,
      linkUrl: "https://example.com",
      imageUrl: "",
      categoryId: 1,
      creatorId: "user123",
    };

    it("상품 정보를 입력할 때 성공적으로 생성된다", async () => {
      // Arrange
      const mockCreatedProduct = {
        id: 1,
        ...validInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockProductWithDetails = {
        ...mockCreatedProduct,
        category: { id: 1, name: "음료" },
        creator: { id: "user123", name: "테스트 유저" },
      };

      mockProductRepository.create.mockResolvedValue(mockCreatedProduct as any);
      mockProductRepository.findById.mockResolvedValue(mockProductWithDetails as any);

      // Act
      const result = await productService.createProduct(validInput);

      // Assert
      expect(mockProductRepository.create).toHaveBeenCalledWith(validInput, undefined);
      expect(mockProductRepository.findById).toHaveBeenCalledWith(1, undefined, undefined);
      expect(result).toEqual(mockProductWithDetails);
    });

    it("creatorId가 없을 때 AuthenticationError를 발생시킨다", async () => {
      // Arrange
      const invalidInput = { ...validInput, creatorId: "" };

      // Act & Assert
      await expect(productService.createProduct(invalidInput)).rejects.toThrow(AuthenticationError);
      await expect(productService.createProduct(invalidInput)).rejects.toThrow("로그인 정보가 필요합니다.");
    });

    it("상품명이 너무 짧을 때 ValidationError를 발생시킨다", async () => {
      // Arrange
      const invalidInput = { ...validInput, name: "" };

      // Act & Assert
      await expect(productService.createProduct(invalidInput)).rejects.toThrow(ValidationError);
    });

    it("가격이 유효하지 않을 때 ValidationError를 발생시킨다", async () => {
      // Arrange
      const invalidInput = { ...validInput, price: -1000 };

      // Act & Assert
      await expect(productService.createProduct(invalidInput)).rejects.toThrow(ValidationError);
    });

    it("카테고리 ID가 유효하지 않을 때 ValidationError를 발생시킨다", async () => {
      // Arrange
      const invalidInput = { ...validInput, categoryId: NaN };

      // Act & Assert
      await expect(productService.createProduct(invalidInput)).rejects.toThrow(ValidationError);
    });

    it("여러 필드가 유효하지 않을 때 ValidationError를 발생시킨다", async () => {
      // Arrange
      const invalidInput = {
        name: "",
        price: -1000,
        linkUrl: "https://example.com",
        imageUrl: "",
        categoryId: NaN,
        creatorId: "user123",
      };

      // Act & Assert
      await expect(productService.createProduct(invalidInput)).rejects.toThrow(ValidationError);
    });
  });

  describe("getProductById", () => {
    it("상품을 찾았을 때 상품 정보를 반환한다", async () => {
      // Arrange
      const mockProduct = {
        id: 1,
        name: "테스트 상품",
        price: 10000,
        creatorId: "user123",
      };

      mockProductRepository.findProductById.mockResolvedValue(mockProduct as any);

      // Act
      const result = await productService.getProductById(1, "user123");

      // Assert
      expect(mockProductRepository.findProductById).toHaveBeenCalledWith(1, "user123", undefined);
      expect(result).toEqual(mockProduct);
    });

    it("상품을 찾을 수 없을 때 NotFoundError를 발생시킨다", async () => {
      // Arrange
      mockProductRepository.findProductById.mockResolvedValue(null);

      // Act & Assert
      await expect(productService.getProductById(999, "user123")).rejects.toThrow(NotFoundError);
      await expect(productService.getProductById(999, "user123")).rejects.toThrow("상품을 찾을 수 없습니다.");
    });
  });

  describe("getProductList", () => {
    it("옵션과 함께 상품 목록을 반환한다", async () => {
      // Arrange
      const options = {
        sort: "latest" as const,
        category: 1,
        take: 10,
        cursor: { id: 5 },
        userId: "user123",
      };

      const mockProducts = [
        { id: 6, name: "상품6", price: 6000 },
        { id: 7, name: "상품7", price: 7000 },
      ];

      mockProductRepository.findManyAll.mockResolvedValue(mockProducts as any);

      // Act
      const result = await productService.getProductList(options);

      // Assert
      expect(mockProductRepository.findManyAll).toHaveBeenCalledWith(options, undefined);
      expect(result).toEqual(mockProducts);
    });
  });

  describe("getProductsCreator", () => {
    const validOptions = {
      creatorId: "user123",
      skip: 0,
      take: 10,
      orderBy: { createdAt: "desc" as const },
      userId: "user123",
    };

    it("생성자의 상품 목록을 성공적으로 반환한다", async () => {
      // Arrange
      const mockItems = [
        { id: 1, name: "내 상품1", price: 10000 },
        { id: 2, name: "내 상품2", price: 20000 },
      ];

      mockProductRepository.findManyCreator.mockResolvedValue(mockItems as any);
      mockProductRepository.countCreator.mockResolvedValue(2);

      // Act
      const result = await productService.getProductsCreator(validOptions);

      // Assert
      expect(mockProductRepository.findManyCreator).toHaveBeenCalledWith(validOptions, undefined);
      expect(mockProductRepository.countCreator).toHaveBeenCalledWith("user123", undefined);
      expect(result).toEqual({
        items: mockItems,
        totalCount: 2,
      });
    });

    it("creatorId가 없을 때 ValidationError를 발생시킨다", async () => {
      // Arrange
      const invalidOptions = { ...validOptions, creatorId: "" };

      // Act & Assert
      await expect(productService.getProductsCreator(invalidOptions)).rejects.toThrow(ValidationError);
      await expect(productService.getProductsCreator(invalidOptions)).rejects.toThrow("creatorId는 필수입니다.");
    });
  });

  describe("countProducts", () => {
    it("생성자의 상품 개수를 반환한다", async () => {
      // Arrange
      const creatorId = "user123";
      mockProductRepository.countCreator.mockResolvedValue(5);

      // Act
      const result = await productService.countProducts(creatorId);

      // Assert
      expect(mockProductRepository.countCreator).toHaveBeenCalledWith(creatorId, undefined);
      expect(result).toBe(5);
    });
  });

  describe("updateProduct", () => {
    const updateInput = {
      name: "수정된 상품",
      price: 15000,
      linkUrl: "https://updated.com",
      categoryId: 2,
    };

    it("상품을 성공적으로 수정한다", async () => {
      // Arrange
      const existingProduct = {
        id: 1,
        name: "기존 상품",
        creatorId: "user123",
      };

      const updatedProduct = {
        id: 1,
        ...updateInput,
        creatorId: "user123",
      };

      mockProductRepository.findProductById.mockResolvedValue(existingProduct as any);
      mockProductRepository.update.mockResolvedValue(updatedProduct as any);
      mockProductRepository.findProductById.mockResolvedValue(updatedProduct as any);

      // Act
      const result = await productService.updateProduct(1, "user123", updateInput);

      // Assert
      expect(mockProductRepository.findProductById).toHaveBeenCalledWith(1, undefined, undefined);
      expect(mockProductRepository.update).toHaveBeenCalledWith(1, updateInput, undefined);
      expect(result).toEqual(updatedProduct);
    });

    it("should throw NotFoundError when product not found", async () => {
      // Arrange
      mockProductRepository.findProductById.mockResolvedValue(null);

      // Act & Assert
      await expect(productService.updateProduct(999, "user123", updateInput)).rejects.toThrow(NotFoundError);
      await expect(productService.updateProduct(999, "user123", updateInput)).rejects.toThrow(
        "상품을 찾을 수 없습니다.",
      );
    });

    it("사용자가 생성자가 아닐 때 AuthenticationError를 발생시킨다", async () => {
      // Arrange
      const existingProduct = {
        id: 1,
        name: "기존 상품",
        creatorId: "otheruser",
      };

      mockProductRepository.findProductById.mockResolvedValue(existingProduct as any);

      // Act & Assert
      await expect(productService.updateProduct(1, "user123", updateInput)).rejects.toThrow(AuthenticationError);
      await expect(productService.updateProduct(1, "user123", updateInput)).rejects.toThrow(
        "상품을 수정할 권한이 없습니다.",
      );
    });
  });

  describe("deleteProduct", () => {
    it("상품을 성공적으로 삭제한다", async () => {
      // Arrange
      const mockDeletedProduct = {
        id: 1,
        name: "삭제된 상품",
        deletedAt: new Date(),
      };

      // 트랜잭션 클라이언트 모킹
      const mockTransactionClient = {
        cartItem: {
          updateMany: jest.fn().mockResolvedValue({}),
        },
        favorite: {
          deleteMany: jest.fn().mockResolvedValue({}),
        },
      };

      mockProductRepository.softDeleteById.mockResolvedValue(mockDeletedProduct as any);

      // Act
      const result = await productService.deleteProduct(1, mockTransactionClient as any);

      // Assert
      expect(mockProductRepository.softDeleteById).toHaveBeenCalledWith(1, mockTransactionClient);
      expect(result).toEqual(mockDeletedProduct);
    });
  });

  describe("getCategory", () => {
    it("카테고리 트리 구조를 반환한다", async () => {
      // Arrange
      const mockCategories = [
        { id: 1, name: "음료", parentId: null },
        { id: 2, name: "과자", parentId: null },
        { id: 3, name: "콜라", parentId: 1 },
        { id: 4, name: "사이다", parentId: 1 },
        { id: 5, name: "초코파이", parentId: 2 },
      ];

      mockProductRepository.findAllCategories.mockResolvedValue(mockCategories as any);

      // Act
      const result = await productService.getCategory();

      // Assert
      expect(mockProductRepository.findAllCategories).toHaveBeenCalled();
      expect(result).toEqual({
        parentCategory: [
          { id: 1, name: "음료" },
          { id: 2, name: "과자" },
        ],
        childrenCategory: {
          음료: [
            { id: 3, name: "콜라" },
            { id: 4, name: "사이다" },
          ],
          과자: [{ id: 5, name: "초코파이" }],
        },
      });
    });

    it("빈 카테고리를 처리한다", async () => {
      // Arrange
      mockProductRepository.findAllCategories.mockResolvedValue([]);

      // Act
      const result = await productService.getCategory();

      // Assert
      expect(result).toEqual({
        parentCategory: [],
        childrenCategory: {},
      });
    });
  });
});
