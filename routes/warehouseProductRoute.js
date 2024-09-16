import express from "express";
import {
  getWarehouseProducts,
  addWarehouseProducts,
  removeWarehouseProduct,
  updateWarehouseProduct,
  getWarehouseProductsByProductId,
} from "../controllers/warehouseProductController.js";

const warehouseProductRouter = express.Router();

warehouseProductRouter.get("/", getWarehouseProducts);

// Route to add new warehouse products
warehouseProductRouter.post("/add", addWarehouseProducts);

// Route to update a warehouse product (serial number, status)
warehouseProductRouter.put("/update/:id", updateWarehouseProduct);

// Route to remove a warehouse product
warehouseProductRouter.delete("/remove/:id", removeWarehouseProduct);

warehouseProductRouter.get(
  "/product/:productId",
  getWarehouseProductsByProductId
);

export default warehouseProductRouter;
