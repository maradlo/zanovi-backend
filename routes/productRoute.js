import express from "express";
import {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  updateProduct,
  updateProductWarehouseDetails,
  searchProducts,
  submitBuyback,
  updateProductEANCode,
  getProductByEANCode,
  updateProductQuantity,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const productRouter = express.Router();

productRouter.get("/list", listProducts);
productRouter.get("/search", searchProducts);
productRouter.get("/:id", singleProduct);

productRouter.put("/warehouse/update/:id", updateProductWarehouseDetails);

productRouter.post(
  "/add",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  addProduct
);
productRouter.post("/remove", adminAuth, removeProduct);

productRouter.put(
  "/update/:id",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  updateProduct
);

productRouter.post("/buyback", adminAuth, submitBuyback);

productRouter.put("/update-ean/:id", adminAuth, updateProductEANCode);

productRouter.get("/by-ean/:eanCode", adminAuth, getProductByEANCode);

productRouter.post("/update-quantity", adminAuth, updateProductQuantity);

export default productRouter;
