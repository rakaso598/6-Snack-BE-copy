import { RequestHandler } from "express";
import { CreateProductInput } from "../dtos/product.dto";
import productService from "../services/product.service";
import { AppError, BadRequestError, ServerError } from "../types/error";
import { uploadImageToS3 } from "../utils/s3";

//상품등록
const createProduct: RequestHandler = async (req, res) => {
  try {
    const { name, price, linkUrl, categoryId } = req.body;
    const creatorId = req.user?.id;
    
    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadImageToS3(req.file);
    }

    const input: CreateProductInput & { creatorId?: string } = {
      name,
      price,
      linkUrl,
      categoryId,
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

    const take = limit ? Math.min(Number(limit), 50) : 9;


    const cursorIdRaw = Number(cursor);
    const categoryIdRaw = Number(category);
    const limitRaw = Number(limit);

    if (cursor && isNaN(cursorIdRaw)) {
      throw new BadRequestError("cursor 값이 유효하지 않습니다.");
    }
    if (category && isNaN(categoryIdRaw)) {
      throw new BadRequestError("category 값이 유효하지 않습니다.");
    }
    if (limit && (isNaN(limitRaw) || limitRaw <= 0)) {
      throw new BadRequestError("limit 값이 유효하지 않습니다.");
    }

    const rawSort = String(sort);
    const validSorts = ["latest", "popular", "low", "high"] as const;
    const sortOption = validSorts.includes(rawSort as any)
      ? (rawSort as typeof validSorts[number])
      : "latest";


    const cursorObj = cursor ? { id: Number(cursor) } : undefined;

    const items = await productService.getAllProducts({
      sort: sortOption,
      category: category ? Number(category) : undefined,
      take,
      cursor: cursorObj,
    });

    res.json({ items });
  } catch (error) {
    next(error instanceof Error ? error : new ServerError("예기치 못한 에러", error));
  }
};



//미완성: 유저가 등록한상품 목록 아직 안보셔도 됩니다.
const getMyProducts: RequestHandler = async (req, res) => {
  try {
    const creatorId = "test-user-uuid";

    if (!creatorId) {
      res.status(401).json({ message: "로그인 정보가 필요합니다." });
      return;
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
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
