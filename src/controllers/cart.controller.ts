import { RequestHandler } from "express";
import cartService from "../services/cart.service";
import {
  TAddToCartDto,
  TDeleteCartItemsDto,
  TToggleCheckDto,
  TToggleParamsDto,
  TToggleAllCheckDto,
  TUpdateQuantityDto,
} from "../dtos/cart.dto";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";
import budgetService from "../services/budget.service";
import { AuthenticationError } from "../types/error";

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: 장바구니 관련 API
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: 내 장바구니 조회
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: cartItemId
 *         schema:
 *           type: string
 *         description: 특정 장바구니 항목 ID
 *       - in: query
 *         name: isChecked
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: 체크된 항목만 조회할지 여부
 *     responses:
 *       200:
 *         description: 장바구니 조회 성공
 *       401:
 *         description: 인증 실패
 */

const getMyCart: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new AuthenticationError("유저 정보를 찾을 수 없습니다.");

    const { cartItemId, isChecked } = req.query;

    if (user.role === "USER" && cartItemId) {
      const item = await cartService.getCartItemById(user.id, parseNumberOrThrow(cartItemId as string, "cartitemId"));
      res.json({ cart: item });
      return;
    }

    const onlyChecked = isChecked === "true";
    const cart = await cartService.getMyCart(user.id, onlyChecked);

    if (user.role !== "USER") {
      const budget = await budgetService.getMonthlyBudget(user.companyId);
      res.json({
        cart,
        budget: {
          currentMonthBudget: budget.currentMonthBudget,
          currentMonthExpense: budget.currentMonthExpense,
        },
      });
      return;
    }

    res.json({ cart });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: 장바구니에 상품 추가
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: number
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: 장바구니 추가 성공
 *       400:
 *         description: 잘못된 요청
 */

const addToCart: RequestHandler<{}, {}, TAddToCartDto> = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new AuthenticationError("유저 정보를 찾을 수 없습니다.");

    const result = await cartService.addToCart(user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /cart/{item}:
 *   delete:
 *     summary: 단일 장바구니 항목 삭제
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: item
 *         required: true
 *         schema:
 *           type: string
 *         description: 장바구니 항목 ID
 *     responses:
 *       204:
 *         description: 삭제 성공
 *       400:
 *         description: 잘못된 요청
 */

const deleteSelectedItems: RequestHandler<{}, {}, TDeleteCartItemsDto> = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new AuthenticationError("유저 정보를 찾을 수 없습니다.");

    await cartService.deleteSelectedItems(user.id, req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /cart/delete:
 *   post:
 *     summary: 선택한 장바구니 항목 삭제
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartItemIds
 *             properties:
 *               cartItemIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       204:
 *         description: 삭제 성공
 *       400:
 *         description: 잘못된 요청
 */

const deleteCartItem: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new AuthenticationError("유저 정보를 찾을 수 없습니다.");

    const itemId = parseNumberOrThrow(req.params.item, "itemId");
    await cartService.deleteCartItem(user.id, itemId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /cart/{item}/check:
 *   patch:
 *     summary: 특정 장바구니 항목 체크/해제
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: item
 *         required: true
 *         schema:
 *           type: string
 *         description: 장바구니 항목 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isChecked
 *             properties:
 *               isChecked:
 *                 type: boolean
 *     responses:
 *       204:
 *         description: 체크 상태 변경 성공
 *       400:
 *         description: 잘못된 요청
 */

const toggleCheckItem: RequestHandler<TToggleParamsDto, {}, TToggleCheckDto> = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new AuthenticationError("유저 정보를 찾을 수 없습니다.");

    const itemId = parseNumberOrThrow(req.params.item, "itemId");
    await cartService.toggleCheckCartItem(user.id, itemId, req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /cart/check/all:
 *   patch:
 *     summary: 전체 장바구니 항목 체크/해제
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isChecked
 *             properties:
 *               isChecked:
 *                 type: boolean
 *     responses:
 *       204:
 *         description: 전체 체크 상태 변경 성공
 *       400:
 *         description: 잘못된 요청
 */

const toggleAllItems: RequestHandler<{}, {}, TToggleAllCheckDto> = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new AuthenticationError("유저 정보를 찾을 수 없습니다.");

    await cartService.toggleAllCheck(user.id, req.body.isChecked);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /cart/{item}/quantity:
 *   patch:
 *     summary: 장바구니 항목 수량 수정
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: item
 *         required: true
 *         schema:
 *           type: string
 *         description: 장바구니 항목 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *     responses:
 *       204:
 *         description: 수량 변경 성공
 *       400:
 *         description: 잘못된 요청
 */

const updateQuantity: RequestHandler<{ item: string }, {}, TUpdateQuantityDto> = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new AuthenticationError("유저 정보를 찾을 수 없습니다.");

    const itemId = parseNumberOrThrow(req.params.item, "itemId");
    await cartService.updateQuantity(user.id, itemId, req.body.quantity);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export default {
  getMyCart,
  addToCart,
  deleteSelectedItems,
  deleteCartItem,
  toggleCheckItem,
  toggleAllItems,
  updateQuantity,
};
