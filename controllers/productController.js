import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import buybackModel from "../models/buybackModel.js";
import warehouseModel from "../models/warehouseModel.js";
import warehouseProductModel from "../models/warehouseProductModel.js";
import { createWarehouseProducts } from "./warehouseController.js";
import mongoose from "mongoose";
import { syncWarehouseProducts } from "./warehouseController.js";

// function for add product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      description2,
      category,
      subCategory,
      condition,
      bestseller,
      price,
      eanCode,
      serialNumber,
      productClass,
      youtubeLink,
    } = req.body;

    const images = ["image1", "image2", "image3", "image4"]
      .map((key) => req.files[key] && req.files[key][0])
      .filter((item) => item !== undefined);

    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    // Create product entry
    const product = new productModel({
      name,
      description,
      description2,
      category,
      subCategory,
      condition,
      bestseller,
      price,
      eanCode,
      serialNumber,
      youtubeLink,
      class: productClass,
      image: imagesUrl,
      date: Date.now(),
    });

    await product.save();

    // Create warehouse entry
    const warehouse = new warehouseModel({
      product: product._id,
      quantityInStock: {
        new: 0, // example starting quantity
        used: 0,
      },
      quantityInStore: {
        new: 0,
        used: 0,
      },
      price: {
        new: price, // set the initial price for new
        used: 0, // set the initial price for used (can be updated later)
      },
    });

    await warehouse.save();

    // Link warehouse entry to the product
    product.warehouse = warehouse._id;
    await product.save();

    // Create corresponding WarehouseProduct entries for each condition and location
    if (warehouse.quantityInStock.new > 0) {
      await createWarehouseProducts(
        product._id,
        warehouse._id,
        warehouse.quantityInStock.new,
        "new",
        "in stock"
      );
    }

    if (warehouse.quantityInStore.new > 0) {
      await createWarehouseProducts(
        product._id,
        warehouse._id,
        warehouse.quantityInStore.new,
        "new",
        "in store"
      );
    }

    // Similarly for "used" condition
    if (warehouse.quantityInStock.used > 0) {
      await createWarehouseProducts(
        product._id,
        warehouse._id,
        warehouse.quantityInStock.used,
        "used",
        "in stock"
      );
    }

    if (warehouse.quantityInStore.used > 0) {
      await createWarehouseProducts(
        product._id,
        warehouse._id,
        warehouse.quantityInStore.used,
        "used",
        "in store"
      );
    }

    res.json({
      success: true,
      message: "Produkt pridaný a skladové produkty vytvorené",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    // Find the existing product
    const existingProduct = await productModel.findById(id);

    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Extract EAN code and other fields from request body
    const { eanCode } = req.body;

    // Prepare updated product data
    const updatedProductData = {
      ...req.body, // Include all other fields
      eanCode,
    };

    // Update the product
    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      updatedProductData,
      { new: true }
    );

    // Check if EAN code has changed
    if (eanCode && eanCode !== existingProduct.eanCode) {
      // Update EAN code in all associated warehouseProduct entries
      await warehouseProductModel.updateMany({ product: id }, { eanCode });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// function for list product
const listProducts = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate({
        path: "warehouse",
        select: "quantityInStock quantityInStore price", // Include the price
      })
      .populate({
        path: "warehouseProducts", // Populate warehouseProducts
        select: "condition location eanCode serialNumber price", // Select necessary fields
      })
      .lean();

    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// function for removing product
const removeProduct = async (req, res) => {
  try {
    const { id } = req.body;
    await productModel.findByIdAndDelete(id);

    // Odstráň aj produkty v "warehouseProdukt"
    await warehouseProductModel.deleteMany({ product: id });

    res.json({ success: true, message: "Produkt vymazaný" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// function for single product info
const singleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Nesprávne ID produktu" });
    }

    const product = await productModel.findById(id).populate({
      path: "warehouse",
      select: "quantityInStock quantityInStore price",
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Produkt sa nenašiel" });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProductWarehouseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityInStock, quantityInStore, price } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    let warehouseEntry = await warehouseModel.findOne({ product: id });

    if (!warehouseEntry) {
      // Create warehouse entry if it doesn't exist
      warehouseEntry = new warehouseModel({
        product: id,
        quantityInStock,
        quantityInStore,
        price,
      });
    } else {
      // Update warehouse quantities
      warehouseEntry.quantityInStock = quantityInStock;
      warehouseEntry.quantityInStore = quantityInStore;
      warehouseEntry.price = price;
    }

    await warehouseEntry.save();

    // Sync warehouse products for both "new" and "used" conditions
    await syncWarehouseProducts(
      id,
      warehouseEntry._id,
      quantityInStock.new,
      "new",
      "in stock"
    );
    await syncWarehouseProducts(
      id,
      warehouseEntry._id,
      quantityInStore.new,
      "new",
      "in store"
    );
    await syncWarehouseProducts(
      id,
      warehouseEntry._id,
      quantityInStock.used,
      "used",
      "in stock"
    );
    await syncWarehouseProducts(
      id,
      warehouseEntry._id,
      quantityInStore.used,
      "used",
      "in store"
    );

    res.json({
      success: true,
      message: "Product warehouse details updated successfully",
      warehouseEntry,
    });
  } catch (error) {
    console.error("Error updating product warehouse details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ success: false, message: "Invalid query" });
    }

    const products = await productModel
      .find({
        name: { $regex: query, $options: "i" },
      })
      .populate({
        path: "warehouse",
        select: "quantityInStock quantityInStore price", // Select only necessary fields
      });

    res.json({ success: true, products });
  } catch (error) {
    console.error("Error searching for products:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const submitBuyback = async (req, res) => {
  try {
    const { products, customerDetails } = req.body;

    const buybackTransaction = new buybackModel({
      products,
      customerDetails,
      date: Date.now(),
    });

    await buybackTransaction.save();

    res.json({ success: true, message: "Buyback transaction completed" });
  } catch (error) {
    console.error("Error submitting buyback transaction:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateProductEANCode = async (req, res) => {
  try {
    const { id } = req.params; // Product ID
    const { eanCode } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    // Update the product's EAN code
    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      { eanCode },
      { new: true }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Optionally, update the EAN code in all associated warehouseProducts
    await warehouseProductModel.updateMany({ product: id }, { eanCode });

    res.json({
      success: true,
      message: "Product EAN code updated",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product EAN code:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getProductByEANCode = async (req, res) => {
  try {
    const { eanCode } = req.params;
    const product = await productModel.findOne({ eanCode });

    if (product) {
      res.json({ success: true, product });
    } else {
      res.json({
        success: false,
        message: "Produkt s týmto EAN kódom neexistuje",
      });
    }
  } catch (error) {
    console.error("Error fetching product by EAN code:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const updateProductQuantity = async (req, res) => {
  try {
    const { productId, location, amount, condition } = req.body;

    if (!productId || !location || !amount || !condition) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    if (!["store", "stock"].includes(location)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid location" });
    }

    if (!["new", "used"].includes(condition)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid condition" });
    }

    const product = await productModel.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Find the warehouse associated with this product
    let warehouse = await warehouseModel.findOne({ product: product.id });

    if (!warehouse) {
      // Create a warehouse document for this product if it doesn't exist
      warehouse = new warehouseModel({
        product: product.id,
        quantityInStock: { new: 0, used: 0 },
        quantityInStore: { new: 0, used: 0 },
      });
    }

    // Update the quantity in the warehouse
    if (location === "stock") {
      if (warehouse.quantityInStock[condition] === undefined) {
        warehouse.quantityInStock[condition] = 0;
      }
      warehouse.quantityInStock[condition] += amount;
    } else if (location === "store") {
      if (warehouse.quantityInStore[condition] === undefined) {
        warehouse.quantityInStore[condition] = 0;
      }
      warehouse.quantityInStore[condition] += amount;
    }

    await warehouse.save();

    // Now, create a new warehouseProduct for each unit added
    for (let i = 0; i < amount; i++) {
      const warehouseProductData = {
        product: product.id,
        warehouse: warehouse.id,
        condition: condition,
        location: location === "stock" ? "in stock" : "in store",
        eanCode: product.eanCode,
        serialNumber: "", // If applicable, or collect from user input
        price: product.price || 0,
        quantity: 1, // Each warehouseProduct represents one unit
        dateAdded: new Date(),
      };

      const newWarehouseProduct = new warehouseProductModel(
        warehouseProductData
      );
      await newWarehouseProduct.save();
    }

    res.json({
      success: true,
      message: "Product quantity and warehouseProducts updated",
    });
  } catch (error) {
    console.error("Error updating product quantity:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export {
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
};
