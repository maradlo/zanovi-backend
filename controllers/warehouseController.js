import warehouseModel from "../models/warehouseModel.js";
import productModel from "../models/productModel.js";
import warehouseProductModel from "../models/warehouseProductModel.js";
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

export const createWarehouseProducts = async (
  productId,
  warehouseId,
  quantity,
  condition
) => {
  const warehouseProducts = [];

  for (let i = 0; i < quantity; i++) {
    warehouseProducts.push({
      product: productId,
      warehouse: warehouseId,
      condition,
      location: "in stock", // Default to "in stock" initially; can be updated later
      eanCode: "", // Can be filled later by the user
      serialNumber: "", // Can be filled later by the user
      price: 0, // Default price
    });
  }

  return await warehouseProductModel.insertMany(warehouseProducts);
};

// Add a new warehouse entry
export const addWarehouseEntry = async (req, res) => {
  try {
    const { productId, quantityInStock, quantityInStore, documents } = req.body;

    const warehouseEntry = new warehouseModel({
      product: mongoose.Types.ObjectId(productId),
      quantityInStock,
      quantityInStore,
      documents,
    });

    const savedWarehouse = await warehouseEntry.save();

    // Create corresponding warehouse products
    await createWarehouseProducts(
      productId,
      savedWarehouse._id,
      quantityInStock.new,
      "new"
    );
    await createWarehouseProducts(
      productId,
      savedWarehouse._id,
      quantityInStock.used,
      "used"
    );

    res.json({
      success: true,
      message: "Warehouse entry and products added successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update warehouse and sync warehouse products
export const updateWarehouseEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityInStock, quantityInStore, price } = req.body;

    const warehouseEntry = await warehouseModel
      .findById(id)
      .populate("product");

    if (!warehouseEntry) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse entry not found" });
    }

    // Update the warehouse quantities
    warehouseEntry.quantityInStock = quantityInStock;
    warehouseEntry.quantityInStore = quantityInStore;
    warehouseEntry.price = price;

    await warehouseEntry.save();

    // Sync warehouse products
    await syncWarehouseProducts(
      warehouseEntry.product._id,
      warehouseEntry._id,
      quantityInStock.new,
      "new"
    );

    await syncWarehouseProducts(
      warehouseEntry.product._id,
      warehouseEntry._id,
      quantityInStore.new,
      "new"
    );

    await syncWarehouseProducts(
      warehouseEntry.product._id,
      warehouseEntry._id,
      quantityInStock.used,
      "used"
    );

    await syncWarehouseProducts(
      warehouseEntry.product._id,
      warehouseEntry._id,
      quantityInStore.used,
      "used"
    );

    res.json({
      success: true,
      message: "Warehouse and warehouse products updated",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Sync Warehouse Products with quantities
const syncWarehouseProducts = async (
  productId,
  warehouseId,
  condition,
  location,
  targetQuantity,
  price
) => {
  // Get current warehouse products
  const existingProducts = await warehouseProductModel.find({
    product: productId,
    warehouse: warehouseId,
    condition,
    location,
  });

  const currentCount = existingProducts.length;

  // Add missing products
  if (targetQuantity > currentCount) {
    const productsToAdd = targetQuantity - currentCount;
    for (let i = 0; i < productsToAdd; i++) {
      const newProduct = new warehouseProductModel({
        product: productId,
        warehouse: warehouseId,
        condition,
        location,
        price, // set price for the warehouse product
        eanCode: "", // user can set later
        serialNumber: "", // user can set later
      });
      await newProduct.save();
    }
  }

  // Remove extra products
  if (targetQuantity < currentCount) {
    const productsToRemove = currentCount - targetQuantity;
    for (let i = 0; i < productsToRemove; i++) {
      await warehouseProductModel.findByIdAndDelete(existingProducts[i]._id);
    }
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
