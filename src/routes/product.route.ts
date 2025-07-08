import { Router } from "express";
import productController from "../controllers/product.controller";

const router = Router();

router.post("/", productController.createProduct);
router.get("/", productController.getProducts)


export default router;
