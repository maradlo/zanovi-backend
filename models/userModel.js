import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cartData: { type: Object, default: {} },
  // Add these fields for address
  lastName: { type: String },
  street: { type: String },
  city: { type: String },
  country: { type: String },
  phone: { type: String },
  zip: { type: String },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
