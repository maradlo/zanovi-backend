import warehouseProductModel from "../models/warehouseProductModel.js";
import warehouseModel from "../models/warehouseModel.js";
import productModel from "../models/productModel.js";
import mongoose from "mongoose";

export const getWarehouseProducts = async (req, res) => {
  try {
    const warehouseProducts = await warehouseProductModel
      .find()
      .populate("product")
      .populate("warehouse");

    res.json({
      success: true,
      products: warehouseProducts,
    });
  } catch (error) {
    console.error("Error fetching warehouse products:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add new warehouse products based on stock and store quantities
export const addWarehouseProducts = async (req, res) => {
  try {
    const {
      productId,
      warehouseId,
      quantityNew,
      quantityUsed,
      inStoreNew,
      inStoreUsed,
    } = req.body;

    // Create new warehouse product entries for each item
    const warehouseProducts = [];

    for (let i = 0; i < quantityNew; i++) {
      warehouseProducts.push({
        product: productId,
        warehouse: warehouseId,
        condition: "new",
        status: "in stock",
      });
    }

    for (let i = 0; i < quantityUsed; i++) {
      warehouseProducts.push({
        product: productId,
        warehouse: warehouseId,
        condition: "used",
        status: "in stock",
      });
    }

    const savedProducts = await warehouseProductModel.insertMany(
      warehouseProducts
    );

    res.json({
      success: true,
      message: "Warehouse products added",
      products: savedProducts,
    });
  } catch (error) {
    console.error("Error adding warehouse products:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWarehouseProduct = async (req, res) => {
  try {
    const { id } = req.params; // warehouseProductId from URL
    const { eanCode, serialNumber } = req.body;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Neplatné ID produktu" });
    }

    // Find and update the warehouse product by its warehouseProductId
    const updatedProduct = await warehouseProductModel.findByIdAndUpdate(
      id,
      { eanCode, serialNumber },
      { new: true }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Produkt nenájdený" });
    }

    // Also update the product's eanCode
    if (eanCode) {
      await productModel.findByIdAndUpdate(updatedProduct.product, { eanCode });

      // Update eanCode in all warehouseProducts of this product
      await warehouseProductModel.updateMany(
        { product: updatedProduct.product },
        { eanCode }
      );
    }

    res.json({
      success: true,
      message: "Produkt v sklade aktualizovaný",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Chyba pri aktualizácii produktu v sklade:", error);
    res.status(500).json({ success: false, message: "Serverová chyba" });
  }
};

// Remove warehouse product (if necessary)
export const removeWarehouseProduct = async (req, res) => {
  try {
    const { id } = req.params; // warehouseProductId
    const { productId } = req.body;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid IDs" });
    }

    // Find the warehouseProduct to get its condition and location
    const warehouseProduct = await warehouseProductModel.findById(id);
    if (!warehouseProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const { condition, location } = warehouseProduct;

    // Delete the warehouseProduct
    await warehouseProductModel.findByIdAndDelete(id);

    // Update warehouse quantities
    const warehouseEntry = await warehouseModel.findOne({ product: productId });
    if (!warehouseEntry) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse entry not found" });
    }

    // Decrease the appropriate quantity
    if (location === "in stock") {
      warehouseEntry.quantityInStock[condition] = Math.max(
        0,
        warehouseEntry.quantityInStock[condition] - 1
      );
    } else if (location === "in store") {
      warehouseEntry.quantityInStore[condition] = Math.max(
        0,
        warehouseEntry.quantityInStore[condition] - 1
      );
    }

    await warehouseEntry.save();

    res.json({
      success: true,
      message: "Warehouse product removed and quantities updated",
    });
  } catch (error) {
    console.error("Error removing warehouse product:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWarehouseProductsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    const warehouseProducts = await warehouseProductModel
      .find({ product: productId })
      .populate("product")
      .populate("warehouse");

    res.json({
      success: true,
      products: warehouseProducts,
    });
  } catch (error) {
    console.error("Error fetching warehouse products by product ID:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
