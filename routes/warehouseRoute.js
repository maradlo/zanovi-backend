import express from "express";
import warehouseAuth from "../middleware/warehouseAuth.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  listWarehouseEntries,
  addWarehouseEntry,
  updateWarehouseEntry,
  removeWarehouseEntry,
  getWarehouseEntry,
} from "../controllers/warehouseController.js";

const warehouseRouter = express.Router();

warehouseRouter.post("/verify-auth", warehouseAuth, (req, res) => {
  res.json({ success: true, message: "Authorization successful" });
});

warehouseRouter.get("/list", listWarehouseEntries);
warehouseRouter.get("/:id", getWarehouseEntry);
warehouseRouter.post("/add", adminAuth, warehouseAuth, addWarehouseEntry);
warehouseRouter.put(
  "/update/:id",
  adminAuth,
  warehouseAuth,
  updateWarehouseEntry
);
warehouseRouter.delete(
  "/remove/:id",
  adminAuth,
  warehouseAuth,
  removeWarehouseEntry
);

export default warehouseRouter;
