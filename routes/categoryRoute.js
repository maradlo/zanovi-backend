import express from "express";
import {
  addCategory,
  addSubCategory,
  listCategories,
  getSubCategories,
  getSubSubCategories,
  addSubSubCategory,
  deleteCategory,
  deleteSubCategory,
  deleteSubSubCategory,
} from "../controllers/categoryController.js";

const categoryRouter = express.Router();

categoryRouter.get("/list", listCategories);
categoryRouter.post("/add", addCategory);
categoryRouter.post("/subcategory/add", addSubCategory);
categoryRouter.get("/subcategories/:categoryName", getSubCategories);
categoryRouter.post("/delete", deleteCategory);
categoryRouter.post("/subcategory/delete", deleteSubCategory);

categoryRouter.get(
  "/sub-sub-categories/:categoryName/:subCategoryName",
  getSubSubCategories
);
categoryRouter.post("/sub-sub-category/add", addSubSubCategory);
categoryRouter.post("/sub-sub-category/delete", deleteSubSubCategory);

export default categoryRouter;
