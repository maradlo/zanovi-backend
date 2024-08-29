import express from "express";
import {
  listWarehouseEntries,
  addWarehouseEntry,
  updateWarehouseEntry,
  removeWarehouseEntry,
  getWarehouseEntry,
} from "../controllers/warehouseController.js";

const warehouseRouter = express.Router();

warehouseRouter.get("/list", listWarehouseEntries);
warehouseRouter.get("/:id", getWarehouseEntry);
warehouseRouter.post("/add", addWarehouseEntry);
warehouseRouter.put("/update/:id", updateWarehouseEntry);
warehouseRouter.post("/remove", removeWarehouseEntry);

export default warehouseRouter;
