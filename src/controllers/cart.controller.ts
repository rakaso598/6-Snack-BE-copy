import { RequestHandler } from "express";
import cartService from "../services/cart.service";
import { TAddToCartDto, TDeleteCartItemsDto, TToggleCheckDto, TToggleParamsDto } from "../dtos/cart.dto";
import { parseNumberOrThrow } from "../utils/parseNumberOrThrow";

const getMyCart: RequestHandler = async (req, res, next) => {
  try {
    const onlySelected = req.query.selected === "true";
    const cart = await cartService.getMyCart(req.user!.id, onlySelected);
    res.json(cart);
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

export default {
  getMyCart,
  addToCart,
  deleteSelectedItems,
  deleteCartItem,
  toggleCheckItem,
};
