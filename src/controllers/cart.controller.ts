import { Request, Response, NextFunction } from "express";
import cartService from "../services/cart.service";

const getMyCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await cartService.getMyCart(req.user!.id);
    res.json(cart);
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await cartService.addToCart(req.user!.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const deleteSelectedItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await cartService.deleteSelectedItems(req.user!.id, req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const deleteCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = parseInt(req.params.item, 10);
    await cartService.deleteCartItem(req.user!.id, itemId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const toggleCheckItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = parseInt(req.params.item, 10);
    const { isChecked } = req.body;

    await cartService.toggleCheckCartItem(req.user!.id, itemId, isChecked);
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
