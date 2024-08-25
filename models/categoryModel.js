import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subCategories: [
    {
      type: String,
    },
  ],
});

const CategoryModel =
  mongoose.models.category || mongoose.model("category", categorySchema);

export default CategoryModel;
