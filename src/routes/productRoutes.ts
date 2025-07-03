import { Router } from "express";
import ProductController from "../controllers/productController";

const router = Router();
const productController = new ProductController();

router.post("/", (req, res) => productController.createProduct(req, res));
router.get("/", (req, res) => productController.getAllProducts(req, res));
router.get("/:id", (req, res) => productController.getProductById(req, res));
router.put("/:id", (req, res) => productController.updateProduct(req, res));
router.delete("/:id", (req, res) => productController.deleteProduct(req, res));

export default router;