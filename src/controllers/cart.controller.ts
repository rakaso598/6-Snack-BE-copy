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
