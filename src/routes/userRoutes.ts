import { Router } from "express";
import UserController from "../controllers/userController";

const router = Router();
const userControllerInstance = new UserController();

router.post("/", (req, res) => userControllerInstance.createUser(req, res));
router.get("/", (req, res) => userControllerInstance.getAllUsers(req, res));
router.get("/:id", (req, res) => userControllerInstance.getUserById(req, res));
router.put("/:id", (req, res) => userControllerInstance.updateUser(req, res));
router.delete("/:id", (req, res) => userControllerInstance.deleteUser(req, res));

export default router;