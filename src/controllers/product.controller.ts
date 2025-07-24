import { RequestHandler } from "express";
import productService from "../services/product.service";
import { AppError, AuthenticationError, ForbiddenError, NotFoundError, ServerError } from "../types/error";
import { uploadImageToS3 } from "../utils/s3";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";
import {
  TCreateProductDto,
  TGetMyProductsQueryDto,
  TGetProductsQueryDto,
  TProductIdParamsDto,
  TUpdateProductDto,
} from "../dtos/product.dto";
import { Role } from "@prisma/client";

//상품등록
const createProduct: RequestHandler<{}, {}, TCreateProductDto> = async (req, res) => {
  try {
    const { name, price, linkUrl, categoryId } = req.body;
    const creatorId = req.user?.id;

    const priceNum = parseNumberOrThrow(price, "price");
    const categoryIdNum = parseNumberOrThrow(categoryId, "categoryId");

    if (!creatorId) {
      throw new AuthenticationError("로그인이 필요합니다.");
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadImageToS3(req.file);
    }

    const input = {
      name,
      price: priceNum,
      linkUrl,
      categoryId: categoryIdNum,
      imageUrl,
      creatorId,
    };
    const product = await productService.createProduct(input);
    if (product) {
      res.status(201).location(`/products/${product.id}`).json(product);
    } else {
      throw new ServerError("상품 생성에 실패했습니다.");
    }
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.code || 500).json({ message: error.message, data: error.data });
    } else if (error instanceof Error) {
      console.error("createProduct error:", error.message, error.stack);
      res.status(500).json({ message: error.message });
    } else {
      console.error("Unknown createProduct error:", error);
      res.status(500).json({ message: "서버 에러 발생" });
    }
  }
};

//상품 조회
const getProducts: RequestHandler<{}, {}, {}, TGetProductsQueryDto> = async (req, res, next) => {
  try {
    const { sort = "latest", category, cursor, limit } = req.query;

    const take = limit ? Math.min(parseNumberOrThrow(limit!, "limit"), 50) : 9;
    const cursorId = cursor ? parseNumberOrThrow(cursor!, "cursor") : undefined;
    const categoryId = category ? parseNumberOrThrow(category!, "category") : undefined;

    const rawSort = String(sort);
    const validSorts = ["latest", "popular", "low", "high"] as const;
    const sortOption = validSorts.includes(rawSort as any) ? (rawSort as (typeof validSorts)[number]) : "latest";

    const cursorObj = cursorId ? { id: cursorId } : undefined;

    const items = await productService.getProductList({
      sort: sortOption,
      category: categoryId,
      take,
      cursor: cursorObj,
    });

    const nextCursor = items.length > 0 ? items[items.length - 1].id : null;

    res.json({ items, nextCursor: nextCursor ? nextCursor.toString() : null });
  } catch (error) {
    next(error instanceof Error ? error : new ServerError("예기치 못한 에러", error));
  }
};

//유저가 등록한상품 목록
const getMyProducts: RequestHandler<{}, {}, {}, TGetMyProductsQueryDto> = async (req, res, next) => {
  try {
    const creatorId = req.user?.id;
    if (!creatorId) {
      throw new AuthenticationError("로그인이 필요합니다.");
    }

    const page = req.query.page ? parseNumberOrThrow(req.query.page, "page") : 1;
    const limit = req.query.limit ? parseNumberOrThrow(req.query.limit, "limit") : 10;
    const skip = (page - 1) * limit;

    const [items, totalCount] = await Promise.all([
      productService.getProductsCreator({ creatorId, skip, take: limit }),
      productService.countProducts(creatorId),
    ]);

    res.json({
      items,
      meta: {
        totalCount,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

//상품 상세 페이지
export const getProductDetail: RequestHandler<TProductIdParamsDto> = async (req, res, next) => {
  try {
    const id = parseNumberOrThrow(req.params.id, "상품 ID");

    const product = await productService.getProductById(id);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

//상품 수정
export const updateProduct: RequestHandler<TProductIdParamsDto, {}, TUpdateProductDto> = async (req, res, next) => {
  try {
    const id = parseNumberOrThrow(req.params.id, "상품 ID");
    const { name, price, linkUrl, categoryId } = req.body;
    const creatorId = req.user?.id;

    if (!creatorId) {
      throw new AuthenticationError("로그인이 필요합니다.");
    }

    const product = await productService.getProductById(id);
    if (!product) {
      throw new NotFoundError("상품을 찾을 수 없습니다.");
    }

    const priceNum = parseNumberOrThrow(price, "price");
    const categoryIdNum = parseNumberOrThrow(categoryId, "categoryId");

    let imageUrl: string | undefined;
    if (req.file) {
      imageUrl = await uploadImageToS3(req.file);
    }

    const input = {
      name,
      price: priceNum,
      linkUrl,
      categoryId: categoryIdNum,
      ...(imageUrl && { imageUrl }),
    };

    const updated = await productService.updateProduct(id, creatorId, input);
    if (updated) {
      res.status(200).json(updated);
    } else {
      throw new ServerError("상품 수정에 실패했습니다.");
    }
  } catch (error) {
    next(error);
  }
};

// 상품 수정 어드민
export const forceUpdateProduct: RequestHandler<TProductIdParamsDto, {}, TUpdateProductDto> = async (
  req,
  res,
  next,
) => {
  try {
    const id = parseNumberOrThrow(req.params.id, "상품 ID");
    const { name, price, linkUrl, categoryId } = req.body;
    const user = req.user;

    if (!user?.id) {
      throw new AuthenticationError("로그인이 필요합니다.");
    }

    const admin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;
    if (!admin) {
      throw new ForbiddenError("관리자만 접근할 수 있습니다.");
    }

    const product = await productService.getProductById(id);
    if (!product) {
      throw new NotFoundError("상품을 찾을 수 없습니다.");
    }

    const priceNum = parseNumberOrThrow(price, "price");
    const categoryIdNum = parseNumberOrThrow(categoryId, "categoryId");

    let imageUrl: string | undefined;
    if (req.file) {
      imageUrl = await uploadImageToS3(req.file);
    }

    const input = {
      name,
      price: priceNum,
      linkUrl,
      categoryId: categoryIdNum,
      ...(imageUrl && { imageUrl }),
    };

    const updated = await productService.updateProduct(id, product.creatorId, input);
    if (updated) {
      res.status(200).json(updated);
    } else {
      throw new ServerError("상품 수정에 실패했습니다.");
    }
  } catch (error) {
    next(error);
  }
};

//상품 삭제
export const deleteProduct: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const productId = parseNumberOrThrow(req.params.id, "상품 ID");
    const userId = req.user?.id;

    const product = await productService.getProductById(productId);
    if (!product) {
      throw new NotFoundError("상품을 찾을 수 없습니다.");
    }

    const owner = product.creatorId === userId;
    if (!owner) {
      throw new ForbiddenError("본인이 등록한 상품만 삭제할 수 있습니다.");
    }

    await productService.deleteProduct(productId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

//상품 삭제 어드민
export const forceDeleteProduct: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const productId = parseNumberOrThrow(req.params.id, "상품 ID");
    const userRole = req.user?.role;

    const admin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    if (!admin) {
      throw new ForbiddenError("관리자만 접근할 수 있습니다.");
    }

    const product = await productService.getProductById(productId);
    if (!product) {
      throw new NotFoundError("상품을 찾을 수 없습니다.");
    }

    await productService.deleteProduct(productId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getCategoryTree: RequestHandler = async (req, res, next) => {
  try {
    const categories = await productService.getCategory();
    res.json(categories);
  } catch (error) {
    next(error instanceof Error ? error : new ServerError("카테고리 조회 중 에러", error));
  }
};

export default {
  createProduct,
  getProducts,
  getMyProducts,
  getProductDetail,
  updateProduct,
  deleteProduct,
  forceUpdateProduct,
  forceDeleteProduct,
  getCategoryTree,
};
