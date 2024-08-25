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
  category: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
    required: false,
  },
  colors: [
    {
      type: String,
      enum: ["White", "Black"],
    },
  ],
  price: {
    type: Number,
    required: true,
  },
  bestseller: {
    type: Boolean,
    default: false,
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
  image: { type: Array, required: true },
});

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
