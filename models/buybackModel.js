import mongoose from "mongoose";

const buybackSchema = new mongoose.Schema({
  customerDetails: {
    firstName: String,
    lastName: String,
    nationality: String,
    residence: String,
    dateOfBirth: String,
    phoneNumber: String,
  },
  products: [
    {
      name: String,
      platform: String,
      price: Number,
    },
  ],
  totalAmount: Number,
  pdfPath: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const buybackModel = mongoose.model("Buyback", buybackSchema);
export default buybackModel;
