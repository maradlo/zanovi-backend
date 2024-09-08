import warehouseProductModel from "../models/warehouseProductModel.js";
import warehouseModel from "../models/warehouseModel.js";
import productModel from "../models/productModel.js";

export const getWarehouseProducts = async (req, res) => {
  try {
    const warehouseProducts = await warehouseProductModel
      .find()
      .populate("product")
      .populate("warehouse");

    res.json({
      success: true,
      products: warehouseProducts,
    });
  } catch (error) {
    console.error("Error fetching warehouse products:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add new warehouse products based on stock and store quantities
export const addWarehouseProducts = async (req, res) => {
  try {
    const {
      productId,
      warehouseId,
      quantityNew,
      quantityUsed,
      inStoreNew,
      inStoreUsed,
    } = req.body;

    // Create new warehouse product entries for each item
    const warehouseProducts = [];

    for (let i = 0; i < quantityNew; i++) {
      warehouseProducts.push({
        product: productId,
        warehouse: warehouseId,
        condition: "new",
        status: "in stock",
      });
    }

    for (let i = 0; i < quantityUsed; i++) {
      warehouseProducts.push({
        product: productId,
        warehouse: warehouseId,
        condition: "used",
        status: "in stock",
      });
    }

    const savedProducts = await warehouseProductModel.insertMany(
      warehouseProducts
    );

    res.json({
      success: true,
      message: "Warehouse products added",
      products: savedProducts,
    });
  } catch (error) {
    console.error("Error adding warehouse products:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWarehouseProduct = async (req, res) => {
  try {
    const { id } = req.params; // id z URL
    const { eanCode, serialNumber } = req.body; // dáta z requestu

    // Skontrolujeme, či id je platný ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Neplatné ID produktu" });
    }

    // Nájdeme a aktualizujeme warehouse produkt
    const updatedProduct = await warehouseProductModel.findByIdAndUpdate(
      id,
      { eanCode, serialNumber },
      { new: true }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Produkt nenájdený" });
    }

    res.json({
      success: true,
      message: "Produkt v sklade aktualizovaný",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Chyba pri aktualizácii produktu v sklade:", error);
    res.status(500).json({ success: false, message: "Serverová chyba" });
  }
};

// Helper function to update warehouseProducts based on the warehouse stock counts
const updateWarehouseProducts = async (
  productId,
  condition,
  location,
  targetQuantity
) => {
  // Get current products with matching productId, condition, and location
  const existingProducts = await warehouseProductModel.find({
    product: productId,
    condition,
    location,
  });

  const currentCount = existingProducts.length;

  // If we need to add more products
  if (targetQuantity > currentCount) {
    const productsToAdd = targetQuantity - currentCount;
    for (let i = 0; i < productsToAdd; i++) {
      const newProduct = new warehouseProductModel({
        product: productId,
        condition,
        location,
        eanCode: "", // Initially empty, user can set later
        serialNumber: "", // Initially empty
      });
      await newProduct.save();
    }
  }

  // If we need to remove some products
  if (targetQuantity < currentCount) {
    const productsToRemove = currentCount - targetQuantity;
    for (let i = 0; i < productsToRemove; i++) {
      await warehouseProductModel.findByIdAndDelete(existingProducts[i]._id);
    }
  }
};

// Remove warehouse product (if necessary)
export const removeWarehouseProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await warehouseProductModel.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Warehouse product removed" });
  } catch (error) {
    console.error("Error removing warehouse product:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
