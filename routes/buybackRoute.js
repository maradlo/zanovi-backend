import express from "express";
import {
  addBuyback,
  getAllBuybacks,
  getBuybackById,
  updateBuyback,
  downloadBuybackPDF,
  deleteBuyback,
} from "../controllers/buybackController.js";
import adminAuth from "../middleware/adminAuth.js";

const buybackRouter = express.Router();

buybackRouter.post("/add", adminAuth, addBuyback);
buybackRouter.get("/list", adminAuth, getAllBuybacks);
buybackRouter.get("/:id", adminAuth, getBuybackById);
buybackRouter.put("/:id", adminAuth, updateBuyback);
buybackRouter.delete("/:id", adminAuth, deleteBuyback);
buybackRouter.get("/download/:id", downloadBuybackPDF);

export default buybackRouter;
