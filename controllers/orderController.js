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

// Initialize Stripe with the correct key based on environment
const stripe = new Stripe(
  process.env.NODE_ENV === "production"
    ? process.env.STRIPE_LIVE_SECRET_KEY
    : process.env.STRIPE_TEST_SECRET_KEY
);

const generateInvoicePDF = async (order, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      // Create the directory if it doesn't exist
      const invoiceDir = path.join(__dirname, "../assets/faktury");
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
      }

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
    } catch (error) {
      console.error("Error generating PDF:", error);
      reject(error);
    }
  });
};

// Placing orders using COD Method
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address, paymentMethod } = req.body;

    const orderItems = items.map((item) => ({
      productId: item._id,
      name: item.name,
      condition: item.condition,
      price: item.price,
      quantity: item.quantity,
      image: item.image?.[0] || null,
    }));

    const orderData = {
      userId,
      items: orderItems,
      address,
      amount,
      paymentMethod,
      payment: paymentMethod === "COD", // Set payment to true for COD, false for Stripe
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // Only update stock and clear cart for COD orders
    if (paymentMethod === "COD") {
      // Update stock
      for (const item of orderItems) {
        const product = await productModel
          .findById(item.productId)
          .populate("warehouse");

        if (product?.warehouse?.quantityInStock) {
          if (product.warehouse.quantityInStock[item.condition] !== undefined) {
            product.warehouse.quantityInStock[item.condition] -= item.quantity;
            if (product.warehouse.quantityInStock[item.condition] < 0) {
              product.warehouse.quantityInStock[item.condition] = 0;
            }
            await product.warehouse.save();
          }
        }
      }

      // Clear cart
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
    }

    res.json({
      success: true,
      message: "Order created successfully",
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.json({ success: false, message: error.message });
  }
};

const placeOrderStripe = async (req, res) => {
  try {
    const { orderId, successUrl, cancelUrl } = req.body;
    const stripeApiKey = req.headers.authorization?.split("Bearer ")[1];

    if (!stripeApiKey) {
      return res.json({
        success: false,
        message: "No Stripe API key provided",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Initialize Stripe with the API key from request
    const stripeInstance = new Stripe(stripeApiKey);

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: order.items.map((item) => ({
        price_data: {
          currency,
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orderId: orderId.toString(),
        userId: order.userId.toString(),
      },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
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
    const userId = req.body.userId;
    const orders = await orderModel.find({ userId }).sort({ date: -1 });
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

// Add this new endpoint
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata.orderId;
      const userId = session.metadata.userId;

      console.log("Processing successful payment for order:", orderId);

      try {
        // Update order payment status
        const order = await orderModel.findById(orderId);
        if (order) {
          order.payment = true;
          await order.save();
          console.log("Order marked as paid");

          // Update stock
          for (const item of order.items) {
            const product = await productModel
              .findById(item.productId)
              .populate("warehouse");

            if (product?.warehouse?.quantityInStock) {
              if (
                product.warehouse.quantityInStock[item.condition] !== undefined
              ) {
                product.warehouse.quantityInStock[item.condition] -=
                  item.quantity;
                if (product.warehouse.quantityInStock[item.condition] < 0) {
                  product.warehouse.quantityInStock[item.condition] = 0;
                }
                await product.warehouse.save();
                console.log("Stock updated for product:", item.productId);
              }
            }
          }

          // Clear user's cart
          const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { cartData: {} },
            { new: true }
          );
          console.log("Cart cleared for user:", userId);

          if (!updatedUser) {
            console.error("User not found:", userId);
          }
        } else {
          console.error("Order not found:", orderId);
        }
      } catch (error) {
        console.error("Error processing webhook:", error);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
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
  handleStripeWebhook,
};
