import userModel from "../models/userModel.js";

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

    if (cartData[itemId] && cartData[itemId][condition]) {
      cartData[itemId][condition].quantity = quantity;
    }

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
