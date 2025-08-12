import { RequestHandler } from "express";
import productService from "../services/product.service";
import {
  AppError,
  AuthenticationError,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ServerError,
} from "../types/error";
import { getCloudFrontUrl, uploadImageToS3 } from "../utils/s3";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";
import {
  TCreateProductDto,
  TGetMyProductsQueryDto,
  TGetProductsQueryDto,
  TProductIdParamsDto,
  TUpdateProductDto,
} from "../dtos/product.dto";
import { Role } from "@prisma/client";

/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: 상품 API
 */

/**
 * @swagger
 * /product:
 *   post:
 *     summary: 상품 등록
 *     description: "새로운 상품을 등록합니다. 이미지 파일 업로드도 지원합니다."
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: "상품명 (1-15자)"
 *                 example: "테스트 상품"
 *               price:
 *                 type: string
 *                 description: "가격 (0 이상)"
 *                 example: "10000"
 *               linkUrl:
 *                 type: string
 *                 description: "상품 링크 URL"
 *                 example: "https://example.com"
 *               categoryId:
 *                 type: string
 *                 description: "카테고리 ID"
 *                 example: "1"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "상품 이미지 파일 (선택사항)"
 *     responses:
 *       201:
 *         description: "상품이 성공적으로 생성됨"
 *         headers:
 *           Location:
 *             description: "생성된 상품의 URL"
 *             schema:
 *               type: string
 *               example: "/products/1"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "테스트 상품"
 *                 price:
 *                   type: integer
 *                   example: 10000
 *                 linkUrl:
 *                   type: string
 *                   example: "https://example.com"
 *                 imageUrl:
 *                   type: string
 *                   example: "https://s3.amazonaws.com/image.jpg"
 *                 categoryId:
 *                   type: integer
 *                   example: 1
 *                 creatorId:
 *                   type: string
 *                   example: "user123"
 *       401:
 *         description: "로그인이 필요합니다"
 *       400:
 *         description: "잘못된 요청 데이터"
 *       500:
 *         description: "서버 에러"
 */
//상품등록
const createProduct: RequestHandler<{}, {}, TCreateProductDto> = async (req, res) => {
  try {
    const { name, price, linkUrl, categoryId } = req.body;
    const creatorId = req.user?.id;

    const priceNum = parseNumberOrThrow(price, "price");
    const categoryIdNum = parseNumberOrThrow(categoryId, "categoryId");

    if (!creatorId) {
      throw new AuthenticationError("사용자 인증이 필요합니다. 다시 로그인해주세요.");
    }

    let imageUrl = "";
    if (req.file) {
      try {
        const s3Key = await uploadImageToS3(req.file);
        imageUrl = getCloudFrontUrl(s3Key);
      } catch (error) {
        if (error instanceof Error) {
          throw new BadRequestError(error.message);
        }
        throw new BadRequestError('이미지 업로드에 실패했습니다.');
      }
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
      throw new ServerError("상품 등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.code || 500).json({ message: error.message, data: error.data });
    } else if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." });
    }
  }
};

/**
 * @swagger
 * /products:
 *   get:
 *     summary: 상품 조회
 *     description: "상품 목록을 조회합니다. 정렬, 카테고리 필터링, 페이지네이션을 지원합니다."
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, popular, low, high]
 *         description: "정렬 기준"
 *         example: "latest"
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: "카테고리 ID로 필터링"
 *         example: "1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: "한 번에 가져올 상품 수 (최대 50)"
 *         example: "9"
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: "커서 기반 페이지네이션을 위한 상품 ID"
 *         example: "10"
 *     responses:
 *       200:
 *         description: "상품 목록 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "테스트 상품"
 *                       price:
 *                         type: integer
 *                         example: 10000
 *                       imageUrl:
 *                         type: string
 *                         example: "https://s3.amazonaws.com/image.jpg"
 *                 nextCursor:
 *                   type: integer
 *                   nullable: true
 *                   description: "다음 페이지를 위한 커서"
 *                   example: 15
 *       400:
 *         description: "잘못된 요청 데이터"
 *       500:
 *         description: "서버 에러"
 */
//상품 조회
const getProducts: RequestHandler<{}, {}, {}, TGetProductsQueryDto> = async (req, res, next) => {
  try {
    const { sort = "latest", category, cursor, limit } = req.query;
    const user = req.user;

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
      userId: user?.id,
    });

    const nextCursor = items.length === take ? items[items.length - 1].id : null;

    res.json({ items, nextCursor: nextCursor || null });
  } catch (error) {
    next(error instanceof Error ? error : new ServerError("예기치 못한 에러", error));
  }
};

/**
 * @swagger
 * /products/my:
 *   get:
 *     summary: "내가 등록한 상품 조회"
 *     description: 현재 로그인한 사용자가 등록한 상품 목록을 조회합니다.
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: "페이지 번호 (기본값: 1)"
 *         example: "1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *         description: "한 페이지당 상품 수 (기본값: 10)"
 *         example: "10"
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [latest, oldest, priceLow, priceHigh]
 *         description: "정렬 기준 (기본값: latest)"
 *         example: "latest"
 *     responses:
 *       200:
 *         description: "내 상품 목록 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "내 상품1"
 *                       price:
 *                         type: integer
 *                         example: 10000
 *                       imageUrl:
 *                         type: string
 *                         example: "https://s3.amazonaws.com/image.jpg"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-01T00:00:00Z"
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalCount:
 *                       type: integer
 *                       example: 25
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: "로그인이 필요합니다"
 *       500:
 *         description: "서버 에러"
 */
// 유저가 등록한 상품 목록
const getMyProducts: RequestHandler<{}, {}, {}, TGetMyProductsQueryDto> = async (req, res, next) => {
  try {
    const creatorId = req.user?.id;
    if (!creatorId) {
      throw new AuthenticationError("로그인이 필요합니다.");
    }

    const page = req.query.page ? parseNumberOrThrow(req.query.page, "page") : 1;
    const limit = req.query.limit ? parseNumberOrThrow(req.query.limit, "limit") : 10;
    const skip = (page - 1) * limit;

    const orderByParam = req.query.orderBy || "latest";

    let orderBy: { createdAt?: "asc" | "desc"; price?: "asc" | "desc" };

    switch (orderByParam) {
      case "priceLow":
        orderBy = { price: "asc" };
        break;
      case "priceHigh":
        orderBy = { price: "desc" };
        break;
      case "latest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const { items, totalCount } = await productService.getProductsCreator({
      creatorId,
      skip,
      take: limit,
      orderBy,
      userId: creatorId,
    });

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
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: 상품 상세 조회
 *     description: "특정 상품의 상세 정보를 조회합니다."
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "상품 ID"
 *         example: "1"
 *     responses:
 *       200:
 *         description: "상품 상세 정보 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "테스트 상품"
 *                 price:
 *                   type: integer
 *                   example: 10000
 *                 linkUrl:
 *                   type: string
 *                   example: "https://example.com"
 *                 imageUrl:
 *                   type: string
 *                   example: "https://s3.amazonaws.com/image.jpg"
 *                 categoryId:
 *                   type: integer
 *                   example: 1
 *                 creatorId:
 *                   type: string
 *                   example: "user123"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00Z"
 *                 category:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "음료"
 *                 creator:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user123"
 *                     name:
 *                       type: string
 *                       example: "테스트 유저"
 *       404:
 *         description: "상품을 찾을 수 없습니다"
 *       500:
 *         description: "서버 에러"
 */
export const getProductDetail: RequestHandler<TProductIdParamsDto> = async (req, res, next) => {
  try {
    const id = parseNumberOrThrow(req.params.id, "상품 ID");
    const user = req.user;

    const product = await productService.getProductById(id, user?.id);
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
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: 상품 삭제
 *     description: "자신이 등록한 상품을 삭제합니다 (소프트 삭제)."
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "삭제할 상품 ID"
 *         example: "1"
 *     responses:
 *       204:
 *         description: "상품 삭제 성공"
 *       401:
 *         description: "로그인이 필요하거나 권한이 없습니다"
 *       404:
 *         description: 상품을 찾을 수 없습니다
 *       500:
 *         description: 서버 에러
 */
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
/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: 상품 삭제(관리자)
 *     description: "관리자가 모든 상품을 강제로 삭제합니다 (소프트 삭제)."
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "삭제할 상품 ID"
 *         example: "1"
 *     responses:
 *       204:
 *         description: "상품 강제 삭제 성공"
 *       401:
 *         description: "로그인이 필요합니다"
 *       403:
 *         description: "관리자 권한이 필요합니다"
 *       404:
 *         description: "상품을 찾을 수 없습니다"
 *       500:
 *         description: "서버 에러"
 */
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

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: 상품 카테고리 조회
 *     description: "상품 카테고리의 계층 구조를 조회합니다."
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: "카테고리 트리 조회 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parentCategory:
 *                   type: array
 *                   description: "부모 카테고리 목록"
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "음료"
 *                 childrenCategory:
 *                   type: object
 *                   description: "자식 카테고리 목록 (부모 카테고리명을 키로 사용)"
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 3
 *                         name:
 *                           type: string
 *                           example: "콜라"
 *                   example:
 *                     음료:
 *                       - id: 3
 *                         name: "콜라"
 *                       - id: 4
 *                         name: "사이다"
 *                     과자:
 *                       - id: 5
 *                         name: "초코파이"
 *       500:
 *         description: "서버 에러"
 */
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
