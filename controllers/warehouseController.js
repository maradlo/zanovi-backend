import warehouseModel from "../models/warehouseModel.js";
import productModel from "../models/productModel.js";
import mongoose from "mongoose";

// List warehouse entries categorized by product category and subcategory
export const listWarehouseEntries = async (req, res) => {
  try {
    const warehouses = await warehouseModel.find().populate("product").exec();

    // Categorize entries by category and subcategory
    const categorizedEntries = warehouses.reduce((acc, warehouse) => {
      const category = warehouse.product.category;
      const subCategory = warehouse.product.subCategory || "General";

      if (!acc[category]) {
        acc[category] = {};
      }
      if (!acc[category][subCategory]) {
        acc[category][subCategory] = [];
      }
      acc[category][subCategory].push(warehouse);
      return acc;
    }, {});

    res.json({ success: true, warehouses: categorizedEntries });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a new warehouse entry
export const addWarehouseEntry = async (req, res) => {
  try {
    const {
      productId,
      quantityInStock,
      quantityInStore,
      inStock,
      inStore,
      documents,
    } = req.body;

    const warehouseEntry = new warehouseModel({
      product: mongoose.Types.ObjectId(productId),
      quantityInStock,
      quantityInStore,
      inStock,
      inStore,
      documents,
    });

    await warehouseEntry.save();
    res.json({ success: true, message: "Warehouse entry added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a warehouse entry
export const updateWarehouseEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, documents } = req.body;

    const updatedWarehouseEntry = await warehouseModel.findByIdAndUpdate(
      id,
      {
        status,
        documents,
      },
      { new: true }
    );

    if (!updatedWarehouseEntry) {
      return res.status(404).json({
        success: false,
        message: "Warehouse entry not found",
      });
    }

    res.json({
      success: true,
      message: "Warehouse details updated successfully",
      warehouse: updatedWarehouseEntry,
    });
  } catch (error) {
    console.error("Error updating warehouse details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getWarehouseEntry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid warehouse ID" });
    }

    const warehouse = await warehouseModel.findById(id).populate("product");

    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse entry not found" });
    }

    res.json({ success: true, warehouse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Remove a warehouse entry
export const removeWarehouseEntry = async (req, res) => {
  try {
    const { id } = req.body;

    const deletedWarehouseEntry = await warehouseModel.findByIdAndDelete(id);

    if (!deletedWarehouseEntry) {
      return res.status(404).json({
        success: false,
        message: "Warehouse entry not found",
      });
    }

    res.json({
      success: true,
      message: "Warehouse entry removed successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
