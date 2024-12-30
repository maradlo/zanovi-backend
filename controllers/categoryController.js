import CategoryModel from "../models/categoryModel.js";

const listCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find({});
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

const addSubCategory = async (req, res) => {
  try {
    const { categoryName, subCategoryName } = req.body;

    const category = await CategoryModel.findOne({ name: categoryName });
    if (!category) {
      return res.json({ success: false, message: "Kategória sa nenašla" });
    }

    const exists = category.subCategories.some(
      (sc) => sc === subCategoryName || (sc && sc.name === subCategoryName)
    );

    if (exists) {
      return res.json({
        success: false,
        message: "Subkategória už existuje",
      });
    }

    category.subCategories.push({
      name: subCategoryName,
      subSubCategories: [],
    });
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

    const subCategories = category.subCategories
      .map((sc) => (typeof sc === "string" ? sc : sc.name))
      .filter(Boolean);

    res.json({ success: true, subCategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSubSubCategories = async (req, res) => {
  try {
    const { categoryName, subCategoryName } = req.params;

    const category = await CategoryModel.findOne({ name: categoryName });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Kategória sa nenašla" });
    }

    const subCategory = category.subCategories.find(
      (sc) => sc.name === subCategoryName
    );
    if (!subCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Podkategória sa nenašla" });
    }

    res.json({ success: true, subSubCategories: subCategory.subSubCategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addSubSubCategory = async (req, res) => {
  try {
    const { categoryName, subCategoryName, subSubCategoryName } = req.body;

    const category = await CategoryModel.findOne({ name: categoryName });
    if (!category) {
      return res.json({ success: false, message: "Kategória sa nenašla" });
    }

    const subCategory = category.subCategories.find(
      (sc) => sc.name === subCategoryName
    );

    if (!subCategory) {
      return res.json({
        success: false,
        message: "Podkategória sa nenašla",
      });
    }

    if (subCategory.subSubCategories.includes(subSubCategoryName)) {
      return res.json({
        success: false,
        message: "Podpodkategória už existuje",
      });
    }

    subCategory.subSubCategories.push(subSubCategoryName);
    await category.save();

    res.json({ success: true, message: "Podpodkategória pridaná", category });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

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

const deleteSubCategory = async (req, res) => {
  try {
    const { categoryName, subCategoryName } = req.body;

    const category = await CategoryModel.findOne({ name: categoryName });
    if (!category) {
      return res.json({ success: false, message: "Kategória sa nenašla" });
    }

    const index = category.subCategories.findIndex(
      (sc) => sc === subCategoryName || (sc && sc.name === subCategoryName)
    );

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

const deleteSubSubCategory = async (req, res) => {
  try {
    const { categoryName, subCategoryName, subSubCategoryName } = req.body;

    const category = await CategoryModel.findOne({ name: categoryName });
    if (!category) {
      return res.json({ success: false, message: "Kategória sa nenašla" });
    }

    const subCategory = category.subCategories.find(
      (sc) => sc.name === subCategoryName
    );
    if (!subCategory) {
      return res.json({ success: false, message: "Podkategória sa nenašla" });
    }

    const index = subCategory.subSubCategories.indexOf(subSubCategoryName);
    if (index > -1) {
      subCategory.subSubCategories.splice(index, 1);
      await category.save();
      res.json({ success: true, message: "Podpodkategória vymazaná" });
    } else {
      res.json({ success: false, message: "Podpodkategória sa nenašla" });
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
  getSubSubCategories,
  addSubSubCategory,
  deleteCategory,
  deleteSubCategory,
  deleteSubSubCategory,
};
