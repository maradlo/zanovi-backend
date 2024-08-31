import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

// add products to user cart
const addToCart = async (req, res) => {
  try {
    const { userId, itemId, condition } = req.body;

    const userData = await userModel.findById(userId);
    let cartData = userData.cartData || {};

    // Fetch product to get the correct price based on condition
    const product = await productModel.findById(itemId).populate("warehouse");
    const price =
      condition === "new"
        ? product.warehouse.price.new
        : product.warehouse.price.used;

    if (cartData[itemId]) {
      if (cartData[itemId][condition]) {
        cartData[itemId][condition].quantity += 1;
      } else {
        cartData[itemId][condition] = { quantity: 1, price };
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][condition] = { quantity: 1, price };
    }

    await userModel.findByIdAndUpdate(userId, { cartData });

    res.json({ success: true, message: "Pridané do košíka" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// update user cart
const updateCart = async (req, res) => {
  try {
    const { userId, itemId, condition, quantity } = req.body;

    const userData = await userModel.findById(userId);
    let cartData = userData.cartData || {};

    // If the item exists in the cart
    if (cartData[itemId] && cartData[itemId][condition]) {
      if (quantity === 0) {
        // Remove the condition if the quantity is 0
        delete cartData[itemId][condition];

        // If there are no more conditions for this item, remove the item itself
        if (Object.keys(cartData[itemId]).length === 0) {
          delete cartData[itemId];
        }
      } else {
        // Otherwise, update the quantity
        cartData[itemId][condition].quantity = quantity;
      }
    }

    // Save the updated cart data
    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Košík bol aktualizovaný" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// get user cart data
const getUserCart = async (req, res) => {
  try {
    const { userId } = req.body;

    const userData = await userModel.findById(userId);
    let cartData = userData.cartData || {};

    res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart };
