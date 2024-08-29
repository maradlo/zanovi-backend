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
    type: String,
    required: true,
  },
  bestseller: {
    type: Boolean,
    default: false,
  },
  inStock: {
    type: Boolean,
    default: false,
  },
  inStore: {
    type: Boolean,
    default: false,
  },
  documents: {
    type: [String], // Array of document URLs
    required: false,
  },
  eanCode: {
    type: String,
    required: false,
  },
  image: {
    type: Array,
    required: true,
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "warehouse",
  },
});

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
