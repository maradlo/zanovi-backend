import express from "express";
import {
  loginUser,
  registerUser,
  adminLogin,
  updateEmail,
  updatePassword,
  forgotPassword,
  updateUserAddress,
  getUserAddress,
} from "../controllers/userController.js";
import authUser from "../middleware/auth.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/admin", adminLogin);
router.post("/update-email", authUser, updateEmail);
router.post("/update-password", authUser, updatePassword);
router.post("/forgot-password", forgotPassword);
router.post("/update-address", authUser, updateUserAddress);
router.get("/address", authUser, getUserAddress);

export default router;
