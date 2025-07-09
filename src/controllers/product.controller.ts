import { RequestHandler } from "express";
import productService from "../services/product.service";
import { AppError, AuthenticationError, ServerError } from "../types/error";
import { uploadImageToS3 } from "../utils/s3";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";
import { TCreateProductDto, TGetMyProductsDto, TGetMyProductsQueryDto, TGetProductsQueryDto } from "../dtos/product.dto";

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
    } else {
      console.error(error);
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
    const sortOption = validSorts.includes(rawSort as any)
      ? (rawSort as (typeof validSorts)[number])
      : "latest";

    const cursorObj = cursorId ? { id: cursorId } : undefined;

    const items = await productService.getProductList({
      sort: sortOption,
      category: categoryId,
      take,
      cursor: cursorObj,
    });

    res.json({ items });
  } catch (error) {
    next(error instanceof Error ? error : new ServerError("예기치 못한 에러", error));
  }
};

//유저가 등록한상품 목록
const getMyProducts: RequestHandler<{}, {}, {}, TGetMyProductsQueryDto> = async (req, res) => {
  try {
    const creatorId = req.user?.id;

    if (!creatorId) {
      res.status(401).json({ message: "로그인이 필요합니다." });
      return;
    }

    const page = req.query.page ? parseNumberOrThrow(req.query.page, "page") : 1;
    const limit = req.query.limit ? parseNumberOrThrow(req.query.limit, "limit") : 10;
    const skip = (page - 1) * limit;

    const params: TGetMyProductsDto = {
      creatorId,
      page,
      limit,
      skip,
    };

    const [items, totalCount] = await Promise.all([
      productService.getProductsCreator({ creatorId: params.creatorId, skip: params.skip, take: params.limit }),
      productService.countProducts(params.creatorId),
    ]);

    res.json({
      items,
      meta: {
        totalCount,
        currentPage: params.page,
        itemsPerPage: params.limit,
        totalPages: Math.ceil(totalCount / params.limit),
      },
    });
  } catch (error) {
    console.error("getMyProducts error:", error);
    res.status(500).json({ message: "서버 에러 발생" });
  }
};

export default {
  createProduct,
  getProducts,
  getMyProducts,
};
