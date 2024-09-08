import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    lastName: { type: String, required: false }, // New field for last name
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    street: { type: String, required: false }, // New field for street
    city: { type: String, required: false }, // New field for city
    country: { type: String, required: false }, // New field for country
    phone: { type: String, required: false }, // New field for phone
    zip: { type: String, required: false }, // New field for ZIP
    cartData: { type: Object, default: {} },
  },
  { minimize: false }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
