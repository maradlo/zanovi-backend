import mongoose from "mongoose";

const warehouseProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "warehouse",
    required: true,
  },
  condition: {
    type: String,
    enum: ["new", "used"],
    required: true,
  },
  location: {
    type: String,
    enum: ["in stock", "in store"],
    required: true,
  },
  serialNumber: {
    type: String,
    required: false,
  },
  eanCode: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: true,
  },
});

const warehouseProductModel =
  mongoose.models.warehouseProduct ||
  mongoose.model("warehouseProduct", warehouseProductSchema);

export default warehouseProductModel;
