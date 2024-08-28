import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import mongoose from "mongoose";

// function for add product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      description2,
      price,
      category,
      subCategory,
      bestseller,
      inStore,
      inStock,
      quantityInStore,
      quantityInStock,
      quantityUsedInStore,
      quantityUsedInStock,
      eanCode,
      condition,
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

    const productData = {
      name,
      description,
      description2,
      category,
      price: Number(price),
      subCategory,
      bestseller: bestseller === "true",
      condition,
      inStore: inStore === "true",
      inStock: inStock === "true",
      quantityInStore: Number(quantityInStore),
      quantityInStock: Number(quantityInStock),
      quantityUsedInStore: Number(quantityUsedInStore),
      quantityUsedInStock: Number(quantityUsedInStock),
      eanCode,
      image: imagesUrl,
      date: Date.now(),
    };

    const product = new productModel(productData);
    await product.save();

    res.json({ success: true, message: "Produkt pridaný" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      description2,
      price,
      category,
      subCategory,
      bestseller,
      inStore,
      inStock,
      quantityInStore,
      quantityInStock,
      quantityUsedInStore,
      quantityUsedInStock,
      eanCode,
      condition,
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
      price: Number(price),
      subCategory,
      bestseller: bestseller === "true",
      condition,
      inStore: inStore === "true",
      inStock: inStock === "true",
      quantityInStore: Number(quantityInStore),
      quantityInStock: Number(quantityInStock),
      quantityUsedInStore: Number(quantityUsedInStore),
      quantityUsedInStock: Number(quantityUsedInStock),
      eanCode,
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
    const products = await productModel.find({});
    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for removing product
const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Produkt vymazaný" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
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

    const product = await productModel.findById(id);
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

export {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  updateProduct,
};
