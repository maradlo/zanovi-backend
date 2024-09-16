import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import Stripe from "stripe";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// global variables
const currency = "eur";
const deliveryCharge = 10;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const generateInvoicePDF = async (order, user) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();

    // Define the path to save the PDF
    const invoicePath = path.join(
      __dirname,
      `../assets/faktury/faktura-${Date.now()}-${order._id}.pdf`
    );

    // Create a write stream to write the PDF to file
    const stream = fs.createWriteStream(invoicePath);

    // Pipe the PDF into the file
    doc.pipe(stream);

    // Add some header info
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.fontSize(14).text(`Order ID: ${order._id}`, { align: "left" });
    doc.text(`Date: ${new Date(order.date).toLocaleString()}`, {
      align: "left",
    });
    doc.text(`Customer: ${user.name}`, { align: "left" });
    doc.text(`Address: ${order.address}`, { align: "left" });

    // Add order items
    doc.moveDown();
    order.items.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.name} - ${item.condition} - Quantity: ${
          item.quantity
        } - Price: ${item.price} EUR`
      );
    });

    // Add the total
    doc.moveDown();
    doc.text(`Total Amount: ${order.amount} EUR`, { align: "left" });

    // Close the PDF and resolve the promise
    doc.end();
    stream.on("finish", () => {
      resolve(invoicePath);
    });
    stream.on("error", reject);
  });
};

// Placing orders using COD Method
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const orderItems = items.map((item) => ({
      productId: item._id,
      name: item.name,
      condition: item.condition,
      price: item.price,
      quantity: item.quantity.quantity,
      image: item.image[0], // Assume you want the first image in the array
    }));

    const orderData = {
      userId,
      items: orderItems,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    for (const item of orderItems) {
      const product = await productModel
        .findById(item.productId)
        .populate("warehouse"); // Populate the warehouse data

      if (product && product.warehouse && product.warehouse.quantityInStock) {
        if (product.warehouse.quantityInStock[item.condition] !== undefined) {
          product.warehouse.quantityInStock[item.condition] -= item.quantity;

          if (product.warehouse.quantityInStock[item.condition] < 0) {
            product.warehouse.quantityInStock[item.condition] = 0; // Prevent negative stock
          }

          await product.warehouse.save();
        } else {
          console.error(
            `Condition '${item.condition}' does not exist for product ID ${item.productId}`
          );
        }
      } else {
        console.error(
          `Product or warehouse data not found for product ID ${item.productId}`
        );
      }
    }

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // Fetch the user details
    const user = await userModel.findById(userId);

    // Generate the PDF invoice
    const invoicePath = await generateInvoicePDF(newOrder, user);

    res.json({
      success: true,
      message: "Objednávka vytvorená",
      invoice: invoicePath,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;
    const { origin } = req.headers;

    const orderItems = items.map((item) => ({
      productId: item._id,
      name: item.name,
      condition: item.condition,
      price: item.price,
      quantity: item.quantity.quantity,
      image: item.image[0],
    }));

    const orderData = {
      userId,
      items: orderItems,
      address,
      amount,
      paymentMethod: "Stripe",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    for (const item of orderItems) {
      const product = await productModel
        .findById(item.productId)
        .populate("warehouse"); // Populate the warehouse data

      if (product && product.warehouse && product.warehouse.quantityInStock) {
        if (product.warehouse.quantityInStock[item.condition] !== undefined) {
          product.warehouse.quantityInStock[item.condition] -= item.quantity;

          if (product.warehouse.quantityInStock[item.condition] < 0) {
            product.warehouse.quantityInStock[item.condition] = 0; // Prevent negative stock
          }

          await product.warehouse.save();
        } else {
          console.error(
            `Condition '${item.condition}' does not exist for product ID ${item.productId}`
          );
        }
      } else {
        console.error(
          `Product or warehouse data not found for product ID ${item.productId}`
        );
      }
    }

    const line_items = orderItems.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: currency,
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: deliveryCharge * 100,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: "payment",
    });

    // Fetch the user details
    const user = await userModel.findById(userId);

    // Generate the PDF invoice
    const invoicePath = await generateInvoicePDF(newOrder, user);

    res.json({ success: true, session_url: session.url, invoice: invoicePath });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Verify Stripe
const verifyStripe = async (req, res) => {
  const { orderId, success, userId } = req.body;

  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      res.json({ success: true });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// All Orders data for Admin Panel
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// User Order Data For Forntend
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;

    const orders = await orderModel.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// update order status from Admin Panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: "Stav aktualizovaný" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    await orderModel.findByIdAndDelete(orderId);

    res.json({ success: true, message: "Objednávka bola vymazaná" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  verifyStripe,
  placeOrder,
  placeOrderStripe,
  allOrders,
  userOrders,
  updateStatus,
  deleteOrder,
};
