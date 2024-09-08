import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import buybackModel from "../models/buybackModel.js";
import warehouseModel from "../models/warehouseModel.js";
import { createWarehouseProducts } from "./warehouseController.js";
import mongoose from "mongoose";

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
        new: 1, // example starting quantity
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

    // Create corresponding WarehouseProduct entries
    await createWarehouseProducts(
      product._id,
      warehouse._id,
      warehouse.quantityInStock.new,
      "new"
    );
    await createWarehouseProducts(
      product._id,
      warehouse._id,
      warehouse.quantityInStock.used,
      "used"
    );

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
    const {
      name,
      description,
      description2,
      category,
      subCategory,
      price,
      condition,
      bestseller,
      eanCode,
      serialNumber,
      productClass,
      quantityInStock,
      quantityInStore,
      warehousePrice, // expecting price object with new and used prices
      youtubeLink,
    } = req.body;

    const images = ["image1", "image2", "image3", "image4"]
      .map((key) => req.files[key] && req.files[key][0])
      .filter((item) => item !== undefined);

    const imagesUrl =
      images.length > 0
        ? await Promise.all(
            images.map(async (item) => {
              const result = await cloudinary.uploader.upload(item.path, {
                resource_type: "image",
              });
              return result.secure_url;
            })
          )
        : undefined;

    const productData = {
      name,
      description,
      description2,
      category,
      subCategory,
      price,
      bestseller,
      condition,
      eanCode,
      youtubeLink,
      serialNumber,
      class: productClass,
      ...(imagesUrl && { image: imagesUrl }),
    };

    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      { $set: productData },
      { new: true }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Produkt sa nenašiel" });
    }

    if (quantityInStock || quantityInStore || warehousePrice) {
      const warehouseEntry = await warehouseModel.findOneAndUpdate(
        { product: id },
        {
          $set: {
            quantityInStock,
            quantityInStore,
            price: warehousePrice,
          },
        },
        { new: true }
      );
      if (!warehouseEntry) {
        return res
          .status(404)
          .json({ success: false, message: "Warehouse entry not found" });
      }
    }

    res.json({
      success: true,
      message: "Produkt aktualizovaný",
      product: updatedProduct,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
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
    const {
      inStock,
      inStore,
      documents,
      quantityInStock,
      quantityInStore,
      price,
    } = req.body;

    // Ensure the product ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    // Find the warehouse entry for this product
    let warehouseEntry = await warehouseModel.findOne({ product: id });

    if (!warehouseEntry) {
      // If the entry does not exist, create a new one
      warehouseEntry = new warehouseModel({
        product: id,
        quantityInStock,
        quantityInStore,
        price, // include the price
        documents,
      });
    } else {
      // Update the existing entry
      warehouseEntry.quantityInStock = quantityInStock;
      warehouseEntry.quantityInStore = quantityInStore;
      warehouseEntry.price = price; // update the price
      warehouseEntry.documents = documents;
    }

    // Save the warehouse entry
    await warehouseEntry.save();

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

export {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  updateProduct,
  updateProductWarehouseDetails,
  searchProducts,
  submitBuyback,
};
