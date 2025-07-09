import { RequestHandler } from "express";
import { TCreateProductInput } from "../dtos/product.dto";
import productService from "../services/product.service";
import { AppError, AuthenticationError, BadRequestError, ServerError } from "../types/error";
import { uploadImageToS3 } from "../utils/s3";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";

//상품등록
const createProduct: RequestHandler = async (req, res) => {
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
    res.status(201).location(`/products/${product!.id}`).json(product);
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
const getProducts: RequestHandler = async (req, res, next) => {
  try {
    const { sort = "latest", category, cursor, limit } = req.query;

    const take = limit ? Math.min(parseNumberOrThrow(limit as string, "limit"), 50) : 9;

    const cursorId = cursor ? parseNumberOrThrow(cursor as string, "cursor") : undefined;
    const categoryId = category ? parseNumberOrThrow(category as string, "category") : undefined;

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

    res.json({ items });
  } catch (error) {
    next(error instanceof Error ? error : new ServerError("예기치 못한 에러", error));
  }
};

//미완성: 유저가 등록한상품 목록
const getMyProducts: RequestHandler = async (req, res) => {
  try {
    const creatorId = "test-user-uuid";

    if (!creatorId) {
      res.status(401).json({ message: "로그인 정보가 필요합니다." });
      return;
    }

    const page = req.query.page ? parseNumberOrThrow(req.query.page as string, "page") : 1;
    const limit = req.query.limit ? parseNumberOrThrow(req.query.limit as string, "limit") : 10;

    const skip = (page - 1) * limit;

    const items = await productService.getProductsByCreator({
      creatorId,
      skip,
      take: limit,
    });

    res.json({ items });
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
