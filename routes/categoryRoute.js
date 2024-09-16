import express from "express";
import {
  addCategory,
  addSubCategory,
  listCategories,
  getSubCategories,
  deleteCategory,
  deleteSubCategory,
} from "../controllers/categoryController.js";

const categoryRouter = express.Router();

categoryRouter.get("/list", listCategories);
categoryRouter.post("/add", addCategory);
categoryRouter.post("/subcategory/add", addSubCategory);
categoryRouter.get("/subcategories/:categoryName", getSubCategories);
categoryRouter.post("/delete", deleteCategory);
categoryRouter.post("/subcategory/delete", deleteSubCategory);

export default categoryRouter;
