import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  description2: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
    required: false,
  },
  condition: {
    type: String,
    enum: ["new", "used"],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  bestseller: {
    type: Boolean,
    default: false,
  },
  quantityUsedInStock: {
    type: Number,
    default: 0,
  },
  quantityUsedInStore: {
    type: Number,
    default: 0,
  },
  inStore: {
    type: Boolean,
    default: false,
  },
  inStock: {
    type: Boolean,
    default: false,
  },
  quantityInStore: {
    type: Number,
    default: 0,
  },
  quantityInStock: {
    type: Number,
    default: 0,
  },
  eanCode: {
    type: String,
    required: false,
  },
  image: {
    type: Array,
    required: true,
  },
});

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
