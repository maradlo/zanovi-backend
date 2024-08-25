import CategoryModel from "../models/categoryModel.js";

const listCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find({});
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a new category
const addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const categoryExists = await CategoryModel.findOne({ name });
    if (categoryExists) {
      return res.json({ success: false, message: "Kategória už existuje" });
    }

    const category = new CategoryModel({ name });
    await category.save();

    res.json({ success: true, message: "Kategória pridaná", category });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Add a new subcategory
const addSubCategory = async (req, res) => {
  try {
    const { categoryName, subCategoryName } = req.body;

    const category = await CategoryModel.findOne({ name: categoryName });
    if (!category) {
      return res.json({ success: false, message: "Kategória sa nenašla" });
    }

    if (category.subCategories.includes(subCategoryName)) {
      return res.json({
        success: false,
        message: "Subkategória už existuje",
      });
    }

    category.subCategories.push(subCategoryName);
    await category.save();

    res.json({ success: true, message: "Subkategória pridaná", category });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getSubCategories = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const category = await CategoryModel.findOne({ name: categoryName });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Kategória sa nenašla" });
    }

    res.json({ success: true, subCategories: category.subCategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await CategoryModel.findOneAndDelete({ name });

    if (!category) {
      return res.json({ success: false, message: "Kategória sa nenašla" });
    }

    res.json({ success: true, message: "Kategória vymazaná" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a subcategory
const deleteSubCategory = async (req, res) => {
  try {
    const { categoryName, subCategoryName } = req.body;

    const category = await CategoryModel.findOne({ name: categoryName });
    if (!category) {
      return res.json({ success: false, message: "Kategória sa nenašla" });
    }

    const index = category.subCategories.indexOf(subCategoryName);
    if (index > -1) {
      category.subCategories.splice(index, 1);
      await category.save();
      res.json({ success: true, message: "Subkategória vymazaná" });
    } else {
      res.json({ success: false, message: "Subkategória sa nenašla" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  listCategories,
  addCategory,
  addSubCategory,
  getSubCategories,
  deleteCategory,
  deleteSubCategory,
};
