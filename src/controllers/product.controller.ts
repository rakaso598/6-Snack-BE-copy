import { RequestHandler } from "express";
import { CreateProductDto } from "../dtos/product.dto";
import productService from "../services/product.service";

//미완성: 상품 등록
const createProduct: RequestHandler = async (req, res) => {
  const { name, price, linkUrl, categoryId, imageUrl } = req.body;

  const token = req.cookies?.accessToken || req.headers["authorization"];
  const creatorId = token ? "test-user-uuid" : null;

  if (!creatorId) {
    res.status(401).json({ message: "로그인 정보가 필요합니다." });
    return;
  }

  if (!name || !categoryId) {
    res.status(400).json({ message: "name과 categoryId는 필수입니다." });
    return;
  }

  const priceNum = Number(price);
  if (isNaN(priceNum)) {
    res.status(400).json({ message: "price가 유효한 숫자가 아닙니다." });
    return;
  }

  const categoryIdNum = Number(categoryId);
  if (isNaN(categoryIdNum)) {
    res.status(400).json({ message: "categoryId가 유효한 숫자가 아닙니다." });
    return;
  }

  const dto: CreateProductDto = {
    name,
    price: priceNum,
    linkUrl,
    imageUrl: imageUrl ?? "",
    categoryId: categoryIdNum,
    creatorId,
  };

  try {
    const product = await productService.createProduct(dto);

    if (!product) {
      res.status(500).json({ message: "상품 생성 실패" });
      return;
    }

    res.status(201).location(`/products/${product.id}`).json(product);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 에러 발생" });
    return;
  }
};


//상품 조회
const getProducts: RequestHandler = async (req, res) => {
  try {
    const { sort = "latest", category, page = "1", device = "desktop" } = req.query;

    let take = 6;
    if (device === "tablet") take = 9;
    else if (device === "mobile") take = 4;

    const skip = (Number(page) - 1) * take;

    const rawSort = String(sort);
    const validSorts = ["latest", "popular", "low", "high"] as const;
    const sortOption = validSorts.includes(rawSort as any)
      ? (rawSort as typeof validSorts[number])
      : "latest";

    const categoryId = category ? Number(category) : undefined;

    const items = await productService.getAllProducts({
      sort: sortOption,
      category: categoryId,
      skip,
      take,
    });

    res.json({ items });
  } catch (error) {
    console.error("getProducts error:", error);
    res.status(500).json({ message: "서버 에러 발생" });
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
  getMyProducts
};
