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
    const { cartItemId, isChecked } = req.query;

    if (!user) throw new AuthenticationError("유저 정보를 찾을 수 없습니다.");

    if (cartItemId) {
      const item = await cartService.getCartItemById(
        req.user!.id,
        parseNumberOrThrow(cartItemId as string, "cartitemId"),
      );
      res.json(item);
      return;
    }

    const onlyChecked = isChecked === "true";
    const cart = await cartService.getMyCart(req.user!.id, onlyChecked);

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
    const result = await cartService.addToCart(req.user!.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const deleteSelectedItems: RequestHandler<{}, {}, TDeleteCartItemsDto> = async (req, res, next) => {
  try {
    await cartService.deleteSelectedItems(req.user!.id, req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const deleteCartItem: RequestHandler = async (req, res, next) => {
  try {
    const itemId = parseNumberOrThrow(req.params.item, "itemId");
    await cartService.deleteCartItem(req.user!.id, itemId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const toggleCheckItem: RequestHandler<TToggleParamsDto, {}, TToggleCheckDto> = async (req, res, next) => {
  try {
    const itemId = parseNumberOrThrow(req.params.item, "itemId");
    await cartService.toggleCheckCartItem(req.user!.id, itemId, req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const toggleAllItems: RequestHandler<{}, {}, TToggleAllCheckDto> = async (req, res, next) => {
  try {
    await cartService.toggleAllCheck(req.user!.id, req.body.isChecked);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const updateQuantity: RequestHandler<{ item: string }, {}, TUpdateQuantityDto> = async (req, res, next) => {
  try {
    const itemId = parseNumberOrThrow(req.params.item, "itemId");
    await cartService.updateQuantity(req.user!.id, itemId, req.body.quantity);
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
