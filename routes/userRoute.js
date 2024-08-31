import express from "express";
import {
  loginUser,
  registerUser,
  adminLogin,
  updateEmail,
  updatePassword,
  forgotPassword,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin", adminLogin);
userRouter.post("/update-email", updateEmail);
userRouter.post("/update-password", updatePassword);
userRouter.post("/forgot-password", forgotPassword);

export default userRouter;
