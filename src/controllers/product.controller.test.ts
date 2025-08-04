import { NextFunction } from "express";
import productController from "./product.controller";
import productService from "../services/product.service";
import { Role } from "@prisma/client";

// Mock ProductService
jest.mock("../services/product.service");
const mockProductService = productService as jest.Mocked<typeof productService>;

jest.mock("../utils/s3");
const mockUploadImageToS3 = require("../utils/s3").uploadImageToS3;

describe("ProductController", () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: NextFunction;

  const createMockUser = () => ({
    id: "user123",
    name: "테스트 유저",
    email: "test@example.com",
    password: "hashedPassword",
    role: Role.USER,
    companyId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    hashedRefreshToken: null,
    company: {
      id: 1,
      name: "테스트 회사",
      bizNumber: "123-45-67890",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  beforeEach(() => {
    mockRequest = {
      user: createMockUser(),
      body: {},
      query: {},
      params: {},
      file: undefined,
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      location: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("createProduct", () => {
    it("상품 정보를 입력할 때 성공적으로 생성된다", async () => {
      // Arrange
      mockRequest.body = {
        name: "테스트 상품",
        price: "10000",
        linkUrl: "https://example.com",
        categoryId: "1",
      };

      const mockProduct = {
        id: 1,
        name: "테스트 상품",
        price: 10000,
        linkUrl: "https://example.com",
        categoryId: 1,
        imageUrl: "",
        creatorId: "user123",
      };

      mockProductService.createProduct.mockResolvedValue(mockProduct as any);

      // Act
      await productController.createProduct(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockProductService.createProduct).toHaveBeenCalledWith({
        name: "테스트 상품",
        price: 10000,
        linkUrl: "https://example.com",
        categoryId: 1,
        imageUrl: "",
        creatorId: "user123",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.location).toHaveBeenCalledWith("/products/1");
      expect(mockResponse.json).toHaveBeenCalledWith(mockProduct);
    });

    it("이미지 파일과 함께 상품을 등록할 때 성공적으로 생성된다", async () => {
      // Arrange
      mockRequest.body = {
        name: "테스트 상품",
        price: "10000",
        linkUrl: "https://example.com",
        categoryId: "1",
      };
      mockRequest.file = { buffer: Buffer.from("test"), originalname: "test.jpg" };

      mockUploadImageToS3.mockResolvedValue("https://s3.amazonaws.com/test-image.jpg");

      const mockProduct = {
        id: 1,
        name: "테스트 상품",
        price: 10000,
        linkUrl: "https://example.com",
        categoryId: 1,
        imageUrl: "https://s3.amazonaws.com/test-image.jpg",
        creatorId: "user123",
      };

      mockProductService.createProduct.mockResolvedValue(mockProduct as any);

      // Act
      await productController.createProduct(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockUploadImageToS3).toHaveBeenCalledWith(mockRequest.file);
      expect(mockProductService.createProduct).toHaveBeenCalledWith({
        name: "테스트 상품",
        price: 10000,
        linkUrl: "https://example.com",
        categoryId: 1,
        imageUrl: "https://s3.amazonaws.com/test-image.jpg",
        creatorId: "user123",
      });
    });

    it("should handle missing user authentication", async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.body = {
        name: "테스트 상품",
        price: "10000",
        linkUrl: "https://example.com",
        categoryId: "1",
      };

      // Act
      await productController.createProduct(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "로그인이 필요합니다.",
      });
    });
  });

  describe("getProducts", () => {
    it("기본 파라미터로 상품 목록을 조회할 때 성공한다", async () => {
      // Arrange
      mockRequest.query = {};

      const mockProducts = [
        { id: 1, name: "상품1", price: 10000 },
        { id: 2, name: "상품2", price: 20000 },
      ];

      mockProductService.getProductList.mockResolvedValue(mockProducts as any);

      // Act
      await productController.getProducts(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockProductService.getProductList).toHaveBeenCalledWith({
        sort: "latest",
        category: undefined,
        take: 9,
        cursor: undefined,
        userId: "user123",
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        items: mockProducts,
        nextCursor: null,
      });
    });

    it("커스텀 파라미터로 상품 목록을 조회할 때 성공한다", async () => {
      // Arrange
      mockRequest.query = {
        sort: "popular",
        category: "2",
        limit: "5",
        cursor: "10",
      };

      const mockProducts = [
        { id: 11, name: "상품11", price: 11000 },
        { id: 12, name: "상품12", price: 12000 },
        { id: 13, name: "상품13", price: 13000 },
        { id: 14, name: "상품14", price: 14000 },
        { id: 15, name: "상품15", price: 15000 },
      ];

      mockProductService.getProductList.mockResolvedValue(mockProducts as any);

      // Act
      await productController.getProducts(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockProductService.getProductList).toHaveBeenCalledWith({
        sort: "popular",
        category: 2,
        take: 5,
        cursor: { id: 10 },
        userId: "user123",
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        items: mockProducts,
        nextCursor: 15,
      });
    });
  });

  describe("getMyProducts", () => {
    it("사용자의 상품 목록을 조회할 때 성공한다", async () => {
      // Arrange
      mockRequest.query = { page: "1", limit: "10", orderBy: "latest" };

      const mockResult = {
        items: [
          { id: 1, name: "내 상품1", price: 10000 },
          { id: 2, name: "내 상품2", price: 20000 },
        ],
        totalCount: 2,
      };

      mockProductService.getProductsCreator.mockResolvedValue(mockResult as any);

      // Act
      await productController.getMyProducts(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockProductService.getProductsCreator).toHaveBeenCalledWith({
        creatorId: "user123",
        skip: 0,
        take: 10,
        orderBy: { createdAt: "desc" },
        userId: "user123",
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        items: mockResult.items,
        meta: {
          totalCount: 2,
          currentPage: 1,
          itemsPerPage: 10,
          totalPages: 1,
        },
      });
    });

    it("should handle missing user authentication", async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await productController.getMyProducts(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getProductDetail", () => {
    it("상품 상세 정보를 조회할 때 성공한다", async () => {
      // Arrange
      mockRequest.params = { id: "1" };

      const mockProduct = {
        id: 1,
        name: "상품 상세",
        price: 10000,
        description: "상품 설명",
      };

      mockProductService.getProductById.mockResolvedValue(mockProduct as any);

      // Act
      await productController.getProductDetail(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockProductService.getProductById).toHaveBeenCalledWith(1, "user123");
      expect(mockResponse.json).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe("updateProduct", () => {
    it("상품 정보를 수정할 때 성공한다", async () => {
      // Arrange
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        name: "수정된 상품",
        price: "15000",
        linkUrl: "https://updated.com",
        categoryId: "2",
      };

      const existingProduct = {
        id: 1,
        name: "기존 상품",
        creatorId: "user123",
      };

      const updatedProduct = {
        id: 1,
        name: "수정된 상품",
        price: 15000,
        linkUrl: "https://updated.com",
        categoryId: 2,
      };

      mockProductService.getProductById.mockResolvedValue(existingProduct as any);
      mockProductService.updateProduct.mockResolvedValue(updatedProduct as any);

      // Act
      await productController.updateProduct(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockProductService.updateProduct).toHaveBeenCalledWith(1, "user123", {
        name: "수정된 상품",
        price: 15000,
        linkUrl: "https://updated.com",
        categoryId: 2,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedProduct);
    });
  });

  describe("forceUpdateProduct", () => {
    it("관리자가 상품을 강제 수정할 때 성공한다", async () => {
      // Arrange
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        name: "관리자 수정 상품",
        price: "20000",
        linkUrl: "https://admin-updated.com",
        categoryId: "3",
      };
      mockRequest.user = createMockUser();
      mockRequest.user.role = Role.ADMIN;

      const existingProduct = {
        id: 1,
        name: "기존 상품",
        creatorId: "user123",
      };

      const updatedProduct = {
        id: 1,
        name: "관리자 수정 상품",
        price: 20000,
        linkUrl: "https://admin-updated.com",
        categoryId: 3,
      };

      mockProductService.getProductById.mockResolvedValue(existingProduct as any);
      mockProductService.updateProduct.mockResolvedValue(updatedProduct as any);

      // Act
      await productController.forceUpdateProduct(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockProductService.updateProduct).toHaveBeenCalledWith(1, "user123", {
        name: "관리자 수정 상품",
        price: 20000,
        linkUrl: "https://admin-updated.com",
        categoryId: 3,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedProduct);
    });
  });

  describe("deleteProduct", () => {
    it("상품을 삭제할 때 성공한다", async () => {
      // Arrange
      mockRequest.params = { id: "1" };

      const existingProduct = {
        id: 1,
        name: "삭제할 상품",
        creatorId: "user123",
      };

      mockProductService.getProductById.mockResolvedValue(existingProduct as any);
      mockProductService.deleteProduct.mockResolvedValue({} as any);

      // Act
      await productController.deleteProduct(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockProductService.deleteProduct).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe("forceDeleteProduct", () => {
    it("관리자가 상품을 강제 삭제할 때 성공한다", async () => {
      // Arrange
      mockRequest.params = { id: "1" };
      mockRequest.user = createMockUser();
      mockRequest.user.role = Role.ADMIN;

      const existingProduct = {
        id: 1,
        name: "관리자 삭제 상품",
        creatorId: "user123",
      };

      mockProductService.getProductById.mockResolvedValue(existingProduct as any);
      mockProductService.deleteProduct.mockResolvedValue({} as any);

      // Act
      await productController.forceDeleteProduct(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockProductService.deleteProduct).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe("getCategoryTree", () => {
    it("카테고리 트리를 조회할 때 성공한다", async () => {
      // Arrange
      const mockCategories = [
        { id: 1, name: "음료", children: [] },
        { id: 2, name: "과자", children: [] },
      ];

      mockProductService.getCategory.mockResolvedValue(mockCategories as any);

      // Act
      await productController.getCategoryTree(mockRequest, mockResponse, mockNext);

      // Assert
      expect(mockProductService.getCategory).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockCategories);
    });
  });
});
