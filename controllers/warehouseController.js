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
      if (!warehouse.product) {
        return acc; // Skip this warehouse entry
      }

      const category = warehouse.product.category || "Unknown Category";
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
  condition,
  location
) => {
  const warehouseProducts = [];

  for (let i = 0; i < quantity; i++) {
    const newWarehouseProduct = new warehouseProductModel({
      product: productId,
      warehouse: warehouseId,
      condition,
      location,
      eanCode: "", // User can set later
      serialNumber: "", // User can set later
      price: 0, // Default price
    });

    const savedProduct = await newWarehouseProduct.save();
    warehouseProducts.push(savedProduct._id);
  }

  // Add the warehouseProduct IDs to the product's warehouseProducts array
  await productModel.findByIdAndUpdate(productId, {
    $push: { warehouseProducts: { $each: warehouseProducts } },
  });

  return warehouseProducts;
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
      "in store"
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
      "in store"
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
export const syncWarehouseProducts = async (
  productId,
  warehouseId,
  targetQuantity,
  condition,
  location
) => {
  const existingProducts = await warehouseProductModel.find({
    product: productId,
    warehouse: warehouseId,
    condition,
    location,
  });

  const currentCount = existingProducts.length;

  // If we need to add more products
  if (targetQuantity > currentCount) {
    const productsToAdd = targetQuantity - currentCount;
    for (let i = 0; i < productsToAdd; i++) {
      const newProduct = new warehouseProductModel({
        product: productId,
        warehouse: warehouseId,
        condition,
        location,
        eanCode: "",
        serialNumber: "",
        price: 0,
      });
      await newProduct.save();
    }
  }

  // If we need to remove excess products
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
