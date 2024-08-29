import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  },
  quantityInStock: {
    new: {
      type: Number,
      default: 0,
    },
    used: {
      type: Number,
      default: 0,
    },
  },
  quantityInStore: {
    new: {
      type: Number,
      default: 0,
    },
    used: {
      type: Number,
      default: 0,
    },
  },
  price: {
    new: {
      type: Number,
      default: 0,
    },
    used: {
      type: Number,
      default: 0,
    },
  },
  documents: {
    type: [String], // Array of document URLs
    required: false,
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
});

const warehouseModel =
  mongoose.models.warehouse || mongoose.model("warehouse", warehouseSchema);

export default warehouseModel;
